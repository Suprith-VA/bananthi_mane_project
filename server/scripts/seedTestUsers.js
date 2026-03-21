import 'dotenv/config';
import prisma from '../config/prisma.js';
import { hashPassword, syncRoleAdmin } from '../utils/helpers.js';

const testUsers = [
  {
    name: 'Test Customer',
    firstName: 'Test',
    lastName: 'Customer',
    email: 'customer.test@bananthi.local',
    password: 'Test@1234',
    role: 'user',
    isAdmin: false,
  },
  {
    name: 'Ops Viewer',
    firstName: 'Ops',
    lastName: 'Viewer',
    email: 'ops.test@bananthi.local',
    password: 'Ops@12345',
    role: 'user',
    isAdmin: false,
  },
  {
    name: 'Admin Tester',
    firstName: 'Admin',
    lastName: 'Tester',
    email: 'admin.test@bananthi.local',
    password: 'Admin@1234',
    role: 'admin',
    isAdmin: true,
  },
];

const upsertUser = async ({ name, firstName, lastName, email, password, role, isAdmin }) => {
  const hashed = await hashPassword(password);
  const roleSynced = syncRoleAdmin(role, isAdmin);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { name, firstName, lastName, password: hashed, ...roleSynced },
    });
    return { email, action: 'updated', isAdmin: roleSynced.isAdmin };
  }

  await prisma.user.create({
    data: { name, firstName, lastName, email, password: hashed, ...roleSynced },
  });
  return { email, action: 'created', isAdmin: roleSynced.isAdmin };
};

const seed = async () => {
  try {
    const results = [];
    for (const user of testUsers) {
      const result = await upsertUser(user);
      results.push(result);
    }

    console.log('Test personas ready:');
    for (const result of results) {
      console.log(`- ${result.email} (${result.isAdmin ? 'admin' : 'user'}) [${result.action}]`);
    }

    console.log('\nShared credentials:');
    for (const user of testUsers) {
      console.log(`- ${user.email} / ${user.password}`);
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`Failed to seed test users: ${error.message}`);
    await prisma.$disconnect();
    process.exit(1);
  }
};

seed();
