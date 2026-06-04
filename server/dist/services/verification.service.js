"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVerificationCode = generateVerificationCode;
exports.storeVerificationCode = storeVerificationCode;
exports.verifyCode = verifyCode;
exports.cleanExpiredCodes = cleanExpiredCodes;
// 验证码存储（生产环境应该使用 Redis）
const verificationCodes = new Map();
// 生成6位随机验证码
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
// 存储验证码（5分钟过期）
function storeVerificationCode(phone, code) {
    const expiry = Date.now() + 5 * 60 * 1000; // 5分钟后过期
    verificationCodes.set(phone, { code, expiry });
}
// 验证验证码
function verifyCode(phone, code) {
    const stored = verificationCodes.get(phone);
    if (!stored) {
        return false;
    }
    // 检查是否过期
    if (Date.now() > stored.expiry) {
        verificationCodes.delete(phone);
        return false;
    }
    // 验证码是否正确
    const isValid = stored.code === code;
    // 验证成功后删除验证码
    if (isValid) {
        verificationCodes.delete(phone);
    }
    return isValid;
}
// 清理过期验证码（定时任务）
function cleanExpiredCodes() {
    const now = Date.now();
    for (const [phone, data] of verificationCodes.entries()) {
        if (now > data.expiry) {
            verificationCodes.delete(phone);
        }
    }
}
// 每分钟清理一次过期验证码
setInterval(cleanExpiredCodes, 60 * 1000);
