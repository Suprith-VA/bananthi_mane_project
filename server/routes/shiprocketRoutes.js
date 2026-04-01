import express from "express";
import prisma from "../config/prisma.js";
import { protect, isSuperAdmin } from "../middleware/auth.js";
import { serializeOrder } from "../utils/serializers.js";
import {
  createShiprocketOrder,
  assignAWB,
  cancelShiprocketOrder,
  trackShipment,
} from "../services/shiprocketService.js";

const router = express.Router();

// POST /api/shiprocket/push-order/:orderId — push a local order to Shiprocket
router.post("/push-order/:orderId", protect, isSuperAdmin, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.shiprocketOrderId) {
      return res
        .status(400)
        .json({ message: "Order already pushed to Shiprocket" });
    }

    const result = await createShiprocketOrder(order);

    // Guard: Shiprocket should always return order_id and shipment_id on success
    if (!result.order_id || !result.shipment_id) {
      const errMsg =
        result.message ||
        result.error ||
        "Shiprocket did not return an order ID — order creation may have failed.";
      console.error(
        "[Shiprocket Push] Unexpected response (no order_id):",
        JSON.stringify(result),
      );
      return res.status(400).json({ message: errMsg });
    }

    // Warn if Shiprocket immediately flagged the order as cancelled/invalid
    if (result.status && String(result.status).toUpperCase() === "CANCELED") {
      console.warn(
        "[Shiprocket Push] Order created but immediately CANCELED by Shiprocket. Check address validity and wallet balance.",
      );
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        shiprocketOrderId: String(result.order_id),
        shipmentId: String(result.shipment_id),
      },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    res.json({
      message: "Order pushed to Shiprocket",
      shiprocketOrderId: result.order_id,
      shipmentId: result.shipment_id,
      shiprocketStatus: result.status || null,
      order: serializeOrder(updated),
    });
  } catch (error) {
    console.error("[Shiprocket Push]", error.message);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/shiprocket/assign-awb/:orderId — assign courier and get AWB
router.post("/assign-awb/:orderId", protect, isSuperAdmin, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!order.shipmentId) {
      return res
        .status(400)
        .json({ message: "Push the order to Shiprocket first" });
    }

    const result = await assignAWB(order.shipmentId);

    console.log("[Shiprocket AWB] Raw response:", JSON.stringify(result));

    // Shiprocket returns awb_assign_status=0 on failure (low wallet, no courier, cancelled order, etc.)
    if (!result.awb_assign_status || result.awb_assign_status === 0) {
      const errMsg =
        result.response?.data?.awb_assign_error ||
        result.response?.data?.awb_errors?.[0] ||
        result.message ||
        "AWB assignment failed. Check your Shiprocket wallet balance (minimum ₹100 required) and courier serviceability for this pincode.";
      console.error(
        "[Shiprocket AWB] Assignment failed (awb_assign_status=0):",
        errMsg,
      );
      return res.status(400).json({ message: errMsg });
    }

    const awbData = result.response?.data;
    const awbCode = awbData?.awb_code || "";
    const courierName = awbData?.courier_name || "";

    // Extra guard — status was 1 but no awb_code came back
    if (!awbCode) {
      console.error(
        "[Shiprocket AWB] Status=1 but no awb_code in response:",
        JSON.stringify(result),
      );
      return res.status(400).json({
        message:
          "AWB assignment returned success but no tracking number was provided. Please check the Shiprocket dashboard.",
      });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { awbCode, courierName },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    res.json({
      message: "AWB assigned successfully",
      awbCode,
      courierName,
      order: serializeOrder(updated),
    });
  } catch (error) {
    console.error("[Shiprocket AWB]", error.message);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/shiprocket/cancel/:orderId — cancel on Shiprocket
router.post("/cancel/:orderId", protect, isSuperAdmin, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!order.shiprocketOrderId) {
      return res.status(400).json({ message: "Order not on Shiprocket" });
    }

    await cancelShiprocketOrder([Number(order.shiprocketOrderId)]);

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        shiprocketOrderId: null,
        shipmentId: null,
        awbCode: null,
        courierName: null,
      },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    res.json({
      message: "Shiprocket order cancelled and tracking data cleared",
      order: serializeOrder(updated),
    });
  } catch (error) {
    console.error("[Shiprocket Cancel]", error.message);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/shiprocket/track/:orderId — track via AWB
router.get("/track/:orderId", protect, isSuperAdmin, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!order.awbCode) {
      return res
        .status(400)
        .json({ message: "No AWB code available for this order" });
    }

    const tracking = await trackShipment(order.awbCode);
    res.json({ awbCode: order.awbCode, tracking });
  } catch (error) {
    console.error("[Shiprocket Track]", error.message);
    res.status(500).json({ message: error.message });
  }
});

/* ══════════════════════════════════════════════════════════════
   Shiprocket → Our App status mapping
   ══════════════════════════════════════════════════════════════ */
const SR_STATUS_MAP = {
  // Shiprocket status_id or current_status string → our fulfillmentStatus
  "PICKED UP": "Shipped",
  "IN TRANSIT": "Shipped",
  SHIPPED: "Shipped",
  "OUT FOR DELIVERY": "Out for Delivery",
  DELIVERED: "Delivered",
  "RTO INITIATED": "Failed",
  "RTO DELIVERED": "Failed",
  CANCELLED: "Cancelled",
  UNDELIVERED: "Stuck",
  LOST: "Failed",
};

function mapShiprocketStatus(srStatus) {
  if (!srStatus) return null;
  return SR_STATUS_MAP[srStatus.toUpperCase()] || null;
}

/* ══════════════════════════════════════════════════════════════
   POST /api/shiprocket/webhook — Shiprocket push notification
   Shiprocket sends status updates here automatically.
   No auth middleware — Shiprocket doesn't send a bearer token.
   ══════════════════════════════════════════════════════════════ */
router.post("/webhook", async (req, res) => {
  try {
    const payload = req.body;
    console.log("[Shiprocket Webhook] Received:", JSON.stringify(payload));

    // Shiprocket sends: { order_id, current_status, awb, ... }
    const srOrderId = String(payload.order_id || "");
    const srStatus = payload.current_status || payload.status || "";
    const awb = payload.awb || "";

    if (!srOrderId && !awb) {
      return res.status(400).json({ message: "Missing order_id or awb" });
    }

    // Find our order by shiprocketOrderId or awbCode
    let order = null;
    if (srOrderId) {
      order = await prisma.order.findFirst({
        where: { shiprocketOrderId: srOrderId },
      });
    }
    if (!order && awb) {
      order = await prisma.order.findFirst({ where: { awbCode: awb } });
    }

    if (!order) {
      console.log(
        `[Shiprocket Webhook] No matching order for SR#${srOrderId} / AWB:${awb}`,
      );
      return res.status(200).json({ message: "Order not found, ignored" });
    }

    const newFulfillment = mapShiprocketStatus(srStatus);
    if (!newFulfillment) {
      console.log(
        `[Shiprocket Webhook] Unmapped status "${srStatus}", ignoring`,
      );
      return res.status(200).json({ message: "Status not mapped, ignored" });
    }

    // Don't downgrade: if already Delivered or Cancelled, don't overwrite
    const terminalStatuses = ["Delivered", "Cancelled"];
    if (terminalStatuses.includes(order.fulfillmentStatus)) {
      console.log(
        `[Shiprocket Webhook] Order already ${order.fulfillmentStatus}, skipping`,
      );
      return res
        .status(200)
        .json({ message: "Order already in terminal state" });
    }

    // Update our order
    const statusMap = {
      Processing: "processing",
      Packed: "processing",
      Shipped: "shipped",
      "Out for Delivery": "shipped",
      Delivered: "delivered",
      Stuck: "processing",
      Failed: "cancelled",
      Cancelled: "cancelled",
    };

    await prisma.order.update({
      where: { id: order.id },
      data: {
        fulfillmentStatus: newFulfillment,
        status: statusMap[newFulfillment] || "processing",
      },
    });

    console.log(
      `[Shiprocket Webhook] Order ${order.id}: ${order.fulfillmentStatus} → ${newFulfillment}`,
    );
    res
      .status(200)
      .json({
        message: "Status updated",
        orderId: order.id,
        newStatus: newFulfillment,
      });
  } catch (error) {
    console.error("[Shiprocket Webhook] Error:", error.message);
    // Always return 200 to avoid Shiprocket retrying endlessly
    res.status(200).json({ message: "Error processing webhook" });
  }
});

/* ══════════════════════════════════════════════════════════════
   POST /api/shiprocket/sync-statuses — Admin-triggered bulk sync
   Polls Shiprocket for all orders with AWB that aren't terminal.
   ══════════════════════════════════════════════════════════════ */
router.post("/sync-statuses", protect, isSuperAdmin, async (req, res) => {
  try {
    // Find all orders that have an AWB and are not yet Delivered/Cancelled
    const activeOrders = await prisma.order.findMany({
      where: {
        awbCode: { not: null },
        fulfillmentStatus: { notIn: ["Delivered", "Cancelled"] },
      },
    });

    if (activeOrders.length === 0) {
      return res.json({ message: "No active shipments to sync", updated: 0 });
    }

    let updatedCount = 0;
    const results = [];

    for (const order of activeOrders) {
      try {
        const tracking = await trackShipment(order.awbCode);
        const srStatus =
          tracking?.tracking_data?.shipment_status_text ||
          tracking?.tracking_data?.current_status ||
          "";

        const newFulfillment = mapShiprocketStatus(srStatus);
        if (newFulfillment && newFulfillment !== order.fulfillmentStatus) {
          const statusMap = {
            Processing: "processing",
            Packed: "processing",
            Shipped: "shipped",
            "Out for Delivery": "shipped",
            Delivered: "delivered",
            Stuck: "processing",
            Failed: "cancelled",
            Cancelled: "cancelled",
          };

          await prisma.order.update({
            where: { id: order.id },
            data: {
              fulfillmentStatus: newFulfillment,
              status: statusMap[newFulfillment] || "processing",
            },
          });

          results.push({
            orderId: order.id,
            from: order.fulfillmentStatus,
            to: newFulfillment,
          });
          updatedCount++;
        }
      } catch (err) {
        console.error(
          `[Shiprocket Sync] Failed for order ${order.id}:`,
          err.message,
        );
        results.push({ orderId: order.id, error: err.message });
      }
    }

    console.log(
      `[Shiprocket Sync] Synced ${updatedCount}/${activeOrders.length} orders`,
    );
    res.json({
      message: `Synced ${updatedCount} orders`,
      updated: updatedCount,
      total: activeOrders.length,
      results,
    });
  } catch (error) {
    console.error("[Shiprocket Sync]", error.message);
    res.status(500).json({ message: error.message });
  }
});

export default router;
