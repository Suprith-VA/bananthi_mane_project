import express from "express";
import prisma from "../config/prisma.js";
import { protect, isAdmin } from "../middleware/auth.js";
import { serializeOrder } from "../utils/serializers.js";
import {
  sendOrderStatusChangeEmail,
  sendCustomerShippingUpdateEmail,
} from "../services/emailService.js";
import {
  createShiprocketOrder,
  assignAWB,
  requestPickup,
  generateManifest,
  cancelShiprocketOrder,
  cancelShipment,
  trackShipment,
} from "../services/shiprocketService.js";

const router = express.Router();

/* ══════════════════════════════════════════════════════════════
   Shiprocket → Our App status mapping (comprehensive)
   ══════════════════════════════════════════════════════════════ */
const SR_STATUS_MAP = {
  // Shiprocket current_status (uppercase) → our fulfillmentStatus
  NEW: null, // just created, no local change
  "READY TO SHIP": "Packed",
  "PICKUP SCHEDULED": "Shipped",
  "PICKUP GENERATED": "Shipped",
  "PICKUP QUEUED": "Shipped",
  "OUT FOR PICKUP": "Shipped",
  "PICKED UP": "Shipped",
  "NOT PICKED UP": "Packed", // courier didn't pick up, revert to Packed
  SHIPPED: "Shipped",
  "IN TRANSIT": "Shipped",
  "REACHED AT DESTINATION HUB": "Shipped",
  "OUT FOR DELIVERY": "Out for Delivery",
  DELIVERED: "Delivered",
  "RTO INITIATED": "Failed",
  "RTO IN TRANSIT": "Failed",
  "RTO DELIVERED": "Failed",
  CANCELLED: "Cancelled",
  CANCELED: "Cancelled",
  UNDELIVERED: "Stuck",
  LOST: "Failed",
  DAMAGED: "Failed",
  DISPOSED: "Failed",
  "MANIFEST GENERATED": "Shipped",
};

function mapShiprocketStatus(srStatus) {
  if (!srStatus) return null;
  return SR_STATUS_MAP[srStatus.toUpperCase().trim()] || null;
}

/**
 * Maps our fulfillmentStatus → our order.status (DB field)
 */
function fulfillmentToOrderStatus(fulfillment) {
  const map = {
    Processing: "processing",
    Packed: "processing",
    Shipped: "shipped",
    "Out for Delivery": "shipped",
    Delivered: "delivered",
    Stuck: "processing",
    Failed: "cancelled",
    Cancelled: "cancelled",
  };
  return map[fulfillment] || "processing";
}

/**
 * Helper: Extract tracking status from Shiprocket tracking API response.
 * Shiprocket returns different nested structures depending on API version/state.
 */
function extractTrackingStatus(tracking) {
  if (!tracking) return { status: null, activities: [] };

  // Try multiple paths for the status text
  const td = tracking.tracking_data || tracking;

  let status =
    td.shipment_status_text ||
    td.current_status ||
    td.track_status ||
    null;

  // Try from shipment_track array
  if (!status && td.shipment_track && td.shipment_track.length > 0) {
    status = td.shipment_track[0].current_status;
  }

  // Try from courier_track data
  if (!status && td.courier_track) {
    status = td.courier_track.current_status;
  }

  // Extract activities from multiple possible locations
  let activities =
    td.shipment_track_activities ||
    td.tracking_activities ||
    td.activities ||
    [];

  // If activities are nested inside shipment_track
  if (activities.length === 0 && td.shipment_track) {
    for (const track of td.shipment_track) {
      if (track.shipment_track_activities) {
        activities = track.shipment_track_activities;
        break;
      }
    }
  }

  return { status, activities };
}

// POST /api/shiprocket/push-order/:orderId — push a local order to Shiprocket
router.post("/push-order/:orderId", protect, isAdmin, async (req, res) => {
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
    let warning = null;
    if (result.status && String(result.status).toUpperCase() === "CANCELED") {
      warning =
        "Shiprocket immediately cancelled this order. This usually means the shipping address is invalid/not serviceable or the pickup location name does not match your Shiprocket account.";
      console.warn(
        "[Shiprocket Push] Order created but immediately CANCELED by Shiprocket.",
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
      warning,
      order: serializeOrder(updated),
    });
  } catch (error) {
    console.error("[Shiprocket Push]", error.message);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/shiprocket/assign-awb/:orderId — assign courier, get AWB, request pickup, auto-update status
router.post("/assign-awb/:orderId", protect, isAdmin, async (req, res) => {
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

    // Step 1: Assign AWB
    const result = await assignAWB(order.shipmentId);

    if (process.env.NODE_ENV !== 'production') console.log("[Shiprocket AWB] Raw response:", JSON.stringify(result));

    // Shiprocket returns awb_assign_status=0 on failure
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

    // Step 2: Request Pickup (the missing step!)
    let pickupResult = null;
    let pickupError = null;
    try {
      pickupResult = await requestPickup(order.shipmentId);
      console.log("[Shiprocket Pickup] Result:", JSON.stringify(pickupResult));
    } catch (pickupErr) {
      pickupError = pickupErr.message;
      console.error("[Shiprocket Pickup] Failed:", pickupErr.message);
      // Don't fail the whole operation — AWB was assigned successfully
    }

    // Step 3: Generate manifest (optional, non-blocking)
    try {
      await generateManifest(order.shipmentId);
      console.log("[Shiprocket Manifest] Generated successfully");
    } catch (manifestErr) {
      console.warn("[Shiprocket Manifest] Failed (non-critical):", manifestErr.message);
    }

    // Step 4: Auto-update order status to Shipped
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        awbCode,
        courierName,
        fulfillmentStatus: "Shipped",
        status: "shipped",
      },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    res.json({
      message: "AWB assigned and pickup requested successfully",
      awbCode,
      courierName,
      pickupStatus: pickupResult ? "Pickup requested" : `Pickup request failed: ${pickupError}`,
      order: serializeOrder(updated),
    });

    // ── Shipped email notifications (fire-and-forget) ──
    sendOrderStatusChangeEmail(updated, "Shipped")
      .catch(err => console.error("[AWB → Sales email error]", err.message));
    sendCustomerShippingUpdateEmail(updated, "Shipped")
      .catch(err => console.error("[AWB → Customer email error]", err.message));
  } catch (error) {
    console.error("[Shiprocket AWB]", error.message);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/shiprocket/cancel/:orderId — cancel on Shiprocket (shipment + order)
router.post("/cancel/:orderId", protect, isAdmin, async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!order.shiprocketOrderId) {
      return res.status(400).json({ message: "Order not on Shiprocket" });
    }

    // If AWB was assigned, cancel the shipment first (by AWB)
    if (order.awbCode) {
      try {
        await cancelShipment([order.awbCode]);
        console.log("[Shiprocket Cancel] Shipment cancelled via AWB:", order.awbCode);
      } catch (shipErr) {
        console.warn("[Shiprocket Cancel] Shipment cancel failed (may already be cancelled):", shipErr.message);
        // Continue — the order cancel should still work
      }
    }

    // Cancel the Shiprocket order
    await cancelShiprocketOrder([Number(order.shiprocketOrderId)]);

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        shiprocketOrderId: null,
        shipmentId: null,
        awbCode: null,
        courierName: null,
        fulfillmentStatus: "Cancelled",
        status: "cancelled",
      },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    // Restore stock for cancelled order
    const items = await prisma.orderItem.findMany({
      where: { orderId: order.id },
    });
    for (const item of items) {
      if (!item.productId) continue;
      if (item.unitLabel) {
        const variant = await prisma.productVariant.findFirst({
          where: { productId: item.productId, unitLabel: item.unitLabel },
        });
        if (variant) {
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
      } else {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });
      }
    }

    res.json({
      message: "Shiprocket order cancelled, tracking data cleared, and stock restored",
      order: serializeOrder(updated),
    });

    // ── Cancellation email notifications (fire-and-forget) ──
    sendOrderStatusChangeEmail(updated, "Cancelled")
      .catch(err => console.error("[SR Cancel → Sales email error]", err.message));
    sendCustomerShippingUpdateEmail(updated, "Cancelled")
      .catch(err => console.error("[SR Cancel → Customer email error]", err.message));
  } catch (error) {
    console.error("[Shiprocket Cancel]", error.message);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/shiprocket/track/:orderId — track via AWB
router.get("/track/:orderId", protect, isAdmin, async (req, res) => {
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
    const { status, activities } = extractTrackingStatus(tracking);

    res.json({
      awbCode: order.awbCode,
      courierName: order.courierName,
      currentStatus: status || "Awaiting pickup",
      activities,
      rawTracking: tracking,
    });
  } catch (error) {
    console.error("[Shiprocket Track]", error.message);
    res.status(500).json({ message: error.message });
  }
});

/* ══════════════════════════════════════════════════════════════
   POST /api/shiprocket/webhook — Shiprocket push notification
   Shiprocket sends status updates here automatically.
   No auth middleware — Shiprocket doesn't send a bearer token.
   ══════════════════════════════════════════════════════════════ */
router.post("/webhook", async (req, res) => {
  try {
    const payload = req.body;
    if (process.env.NODE_ENV !== 'production') console.log("[Shiprocket Webhook] Received:", JSON.stringify(payload));

    // Shiprocket sends: { order_id, sr_order_id, current_status, awb, ... }
    const srOrderId = String(payload.sr_order_id || payload.order_id || "");
    const srStatus = payload.current_status || payload.shipment_status || payload.status || "";
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

    // Update our order — also fetch user so we can send email
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        fulfillmentStatus: newFulfillment,
        status: fulfillmentToOrderStatus(newFulfillment),
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    // ── Webhook email notifications (fire-and-forget) ──
    sendOrderStatusChangeEmail(updatedOrder, newFulfillment)
      .catch(err => console.error("[Webhook → Sales email error]", err.message));
    sendCustomerShippingUpdateEmail(updatedOrder, newFulfillment)
      .catch(err => console.error("[Webhook → Customer email error]", err.message));

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
router.post("/sync-statuses", protect, isAdmin, async (req, res) => {
  try {
    // Find all orders that have an AWB and are not yet Delivered/Cancelled
    const activeOrders = await prisma.order.findMany({
      where: {
        awbCode: { not: null },
        fulfillmentStatus: { notIn: ["Delivered", "Cancelled"] },
      },
    });

    if (activeOrders.length === 0) {
      return res.json({ message: "No active shipments to sync", updated: 0, results: [] });
    }

    let updatedCount = 0;
    const results = [];

    for (const order of activeOrders) {
      try {
        const tracking = await trackShipment(order.awbCode);
        const { status: srStatus } = extractTrackingStatus(tracking);

        const newFulfillment = mapShiprocketStatus(srStatus);
        if (newFulfillment && newFulfillment !== order.fulfillmentStatus) {
          // Don't downgrade terminal statuses
          const terminalStatuses = ["Delivered", "Cancelled"];
          if (terminalStatuses.includes(order.fulfillmentStatus)) {
            results.push({
              orderId: order.id,
              from: order.fulfillmentStatus,
              to: newFulfillment,
              skipped: "Already in terminal state",
            });
            continue;
          }

          await prisma.order.update({
            where: { id: order.id },
            data: {
              fulfillmentStatus: newFulfillment,
              status: fulfillmentToOrderStatus(newFulfillment),
            },
          });

          results.push({
            orderId: order.id,
            from: order.fulfillmentStatus,
            to: newFulfillment,
          });
          updatedCount++;
        } else {
          results.push({
            orderId: order.id,
            currentStatus: order.fulfillmentStatus,
            shiprocketStatus: srStatus || "No tracking data yet",
            noChange: true,
          });
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
