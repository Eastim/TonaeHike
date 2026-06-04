const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createUsers() {
  const adminPassword = await bcrypt.hash('123456', 12);
  const testPassword = await bcrypt.hash('123456', 12);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@tonaehike.com',
      passwordHash: adminPassword,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop'
    }
  });

  const testUser = await prisma.user.upsert({
    where: { username: 'testuser' },
    update: {},
    create: {
      username: 'testuser',
      email: 'testuser@tonaehike.com',
      passwordHash: testPassword,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop'
    }
  });

  console.log('用户初始化完成：');
  console.log('管理员:', admin);
  console.log('测试用户:', testUser);
  
  await prisma.$disconnect();
}

createUsers().catch(console.error);