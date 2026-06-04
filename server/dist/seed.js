"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("./prisma/client"));
const bcrypt_1 = __importDefault(require("bcrypt"));
async function createUsers() {
    const adminPassword = await bcrypt_1.default.hash('123456', 12);
    const testPassword = await bcrypt_1.default.hash('123456', 12);
    const admin = await client_1.default.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@tonaehike.com',
            passwordHash: adminPassword,
            avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop'
        }
    });
    const testUser = await client_1.default.user.upsert({
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
    await client_1.default.$disconnect();
}
createUsers().catch(console.error);
