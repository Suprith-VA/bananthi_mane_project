import prisma from '../config/prisma.js';
import { hashPassword, syncRoleAdmin } from './helpers.js';

export const conditionallySeedUsers = async () => {
  try {
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin.test@bananthi.local' },
    });

    if (!adminExists) {
      await prisma.user.create({
        data: {
          name: 'Admin Tester',
          firstName: 'Admin',
          lastName: 'Tester',
          email: 'admin.test@bananthi.local',
          password: await hashPassword('Admin@1234'),
          ...syncRoleAdmin('admin', true),
        },
      });

      await prisma.user.create({
        data: {
          name: 'Test Customer',
          firstName: 'Test',
          lastName: 'Customer',
          email: 'customer.test@bananthi.local',
          password: await hashPassword('Test@1234'),
          ...syncRoleAdmin('user', false),
        },
      });

      console.log(
        'Seeded test users (admin.test@bananthi.local / Admin@1234, customer.test@bananthi.local / Test@1234)'
      );
    }
  } catch (err) {
    console.error('Failed to seed users', err);
  }
};
