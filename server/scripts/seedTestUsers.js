import "dotenv/config";
import prisma from "../config/prisma.js";
import { hashPassword, syncRoleAdmin } from "../utils/helpers.js";

// ─────────────────────────────────────────────────────────────────────────────
// Seeded test personas
//
//  customer.test  – regular user         (Test@123)
//  admin.test     – admin (non-super)    (Admin@1234)   ← used for admin-vs-super-admin guard tests
//  ops.test       – super-admin          (Ops@12345)    ← primary super-admin used in all tests
// ─────────────────────────────────────────────────────────────────────────────

const testUsers = [
  {
    name: "Test Customer",
    firstName: "Test",
    lastName: "Customer",
    email: "customer.test@bananthi.local",
    password: "Test@123",
    role: "user",
    isAdmin: false,
  },
  {
    name: "Admin Tester",
    firstName: "Admin",
    lastName: "Tester",
    email: "admin.test@bananthi.local",
    password: "Admin@1234",
    role: "admin", // admin but NOT super-admin — used for role-guard tests
    isAdmin: true,
  },
  {
    name: "Ops Super Admin",
    firstName: "Ops",
    lastName: "SuperAdmin",
    email: "ops.test@bananthi.local",
    password: "Ops@12345",
    role: "super-admin", // primary super-admin used in all manual and automated tests
    isAdmin: true,
  },
];

const upsertUser = async ({
  name,
  firstName,
  lastName,
  email,
  password,
  role,
  isAdmin,
}) => {
  const hashed = await hashPassword(password);
  const roleSynced = syncRoleAdmin(role, isAdmin);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { name, firstName, lastName, password: hashed, ...roleSynced },
    });
    return { email, role: roleSynced.role, action: "updated" };
  }

  await prisma.user.create({
    data: { name, firstName, lastName, email, password: hashed, ...roleSynced },
  });
  return { email, role: roleSynced.role, action: "created" };
};

const seed = async () => {
  try {
    console.log("Seeding test personas…\n");
    const results = [];

    for (const user of testUsers) {
      const result = await upsertUser(user);
      results.push(result);
    }

    console.log("Result:");
    for (const r of results) {
      const tag =
        r.role === "super-admin"
          ? "🔴 super-admin"
          : r.role === "admin"
            ? "🟡 admin"
            : "🟢 user";
      console.log(`  [${r.action}] ${r.email}  —  ${tag}`);
    }

    console.log("\n─────────────────────────────────────────");
    console.log("Credentials:");
    for (const u of testUsers) {
      console.log(`  ${u.email}  /  ${u.password}  (${u.role})`);
    }
    console.log("─────────────────────────────────────────\n");

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    await prisma.$disconnect();
    process.exit(1);
  }
};

seed();
