"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.getUserById = getUserById;
exports.updateUserAvatar = updateUserAvatar;
exports.updateUserProfile = updateUserProfile;
exports.resetPassword = resetPassword;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = __importDefault(require("../prisma/client"));
const JWT_SECRET = (process.env.JWT_SECRET || 'tonaehike_jwt_secret_key_2024');
async function register(username, email, password) {
    const existingUser = await client_1.default.user.findFirst({
        where: { OR: [{ email }, { username }] }
    });
    if (existingUser) {
        throw new Error('用户已存在');
    }
    const passwordHash = await bcrypt_1.default.hash(password, 12);
    const user = await client_1.default.user.create({
        data: { username, email, passwordHash, avatarUrl: '/avatar/default.png' },
        select: { id: true, username: true, email: true, avatarUrl: true, nickname: true, createdAt: true }
    });
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: (process.env.JWT_EXPIRES_IN || '2h') });
    return { user, token };
}
async function login(loginId, password) {
    const user = await client_1.default.user.findFirst({
        where: {
            OR: [
                { email: loginId },
                { username: loginId }
            ]
        },
        select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            nickname: true,
            passwordHash: true
        }
    });
    if (!user) {
        throw new Error('用户名或密码错误');
    }
    const isValid = await bcrypt_1.default.compare(password, user.passwordHash);
    if (!isValid) {
        throw new Error('用户名或密码错误');
    }
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: (process.env.JWT_EXPIRES_IN || '2h') });
    // 确保 avatarUrl 有值，使用默认头像
    const avatarUrl = user.avatarUrl ? user.avatarUrl : '/avatar/default.png';
    return {
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            avatarUrl: avatarUrl,
            nickname: user.nickname
        },
        token
    };
}
async function getUserById(id) {
    return client_1.default.user.findUnique({
        where: { id },
        select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            nickname: true,
            gender: true,
            birthday: true,
            phone: true,
            bio: true,
            createdAt: true,
            updatedAt: true
        }
    });
}
async function updateUserAvatar(userId, avatarUrl) {
    return client_1.default.user.update({
        where: { id: userId },
        data: { avatarUrl },
        select: { id: true, avatarUrl: true }
    });
}
async function updateUserProfile(userId, data) {
    return client_1.default.user.update({
        where: { id: userId },
        data,
        select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            nickname: true,
            gender: true,
            birthday: true,
            phone: true,
            bio: true,
            createdAt: true,
            updatedAt: true
        }
    });
}
// 重置密码
async function resetPassword(phone, password) {
    // 先找到用户
    const user = await client_1.default.user.findFirst({
        where: { email: phone } // 因为注册时手机号作为email存储
    });
    if (!user) {
        throw new Error('该手机号未注册');
    }
    const passwordHash = await bcrypt_1.default.hash(password, 12);
    const updatedUser = await client_1.default.user.update({
        where: { id: user.id },
        data: { passwordHash },
        select: { id: true, username: true, email: true }
    });
    return updatedUser;
}
