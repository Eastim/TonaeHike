"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express = __importStar(require("express"));
const auth_service_1 = require("../services/auth.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const verification_service_1 = require("../services/verification.service");
const router = express.Router();
router.post('/register', async (req, res) => {
    try {
        const { username, phone, code, password } = req.body;
        // 验证必填字段
        if (!username || !phone || !code || !password) {
            return res.status(400).json({
                code: 400,
                msg: '请填写所有必填项'
            });
        }
        // 验证手机号格式
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            return res.status(400).json({
                code: 400,
                msg: '手机号格式不正确'
            });
        }
        // 验证验证码
        if (!(0, verification_service_1.verifyCode)(phone, code)) {
            return res.status(400).json({
                code: 400,
                msg: '验证码错误或已过期'
            });
        }
        // 注册用户（使用手机号作为邮箱）
        const result = await (0, auth_service_1.register)(username, phone, password);
        res.status(201).json({
            code: 200,
            msg: '注册成功',
            data: result
        });
    }
    catch (error) {
        res.status(400).json({
            code: 400,
            msg: error.message || '注册失败'
        });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await (0, auth_service_1.login)(username, password);
        res.json({ code: 200, msg: '登录成功', data: result });
    }
    catch (error) {
        res.status(401).json({ code: 401, msg: error.message });
    }
});
router.get('/profile', auth_middleware_1.authenticate, async (req, res) => {
    try {
        const user = await (0, auth_service_1.getUserById)(req.user.id);
        res.json(user);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// 发送重置密码验证码
router.get('/send-reset-code', async (req, res) => {
    try {
        const { phone } = req.query;
        if (!phone) {
            return res.status(400).json({
                code: 400,
                msg: '请提供手机号'
            });
        }
        // 验证手机号格式
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            return res.status(400).json({
                code: 400,
                msg: '手机号格式不正确'
            });
        }
        // 生成验证码
        const code = (0, verification_service_1.generateVerificationCode)();
        // 存储验证码
        (0, verification_service_1.storeVerificationCode)(phone, code);
        // TODO: 在生产环境中，这里应该调用短信服务发送验证码
        console.log(`发送验证码 ${code} 到手机号 ${phone}`);
        res.json({
            code: 200,
            msg: '验证码已发送'
        });
    }
    catch (error) {
        res.status(400).json({
            code: 400,
            msg: error.message || '发送失败'
        });
    }
});
// 重置密码
router.post('/reset-password', async (req, res) => {
    try {
        const { phone, code, password } = req.body;
        // 验证必填字段
        if (!phone || !code || !password) {
            return res.status(400).json({
                code: 400,
                msg: '请填写所有必填项'
            });
        }
        // 验证手机号格式
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            return res.status(400).json({
                code: 400,
                msg: '手机号格式不正确'
            });
        }
        // 验证验证码
        if (!(0, verification_service_1.verifyCode)(phone, code)) {
            return res.status(400).json({
                code: 400,
                msg: '验证码错误或已过期'
            });
        }
        // 验证密码长度
        if (password.length < 6) {
            return res.status(400).json({
                code: 400,
                msg: '密码至少需要6个字符'
            });
        }
        // 重置密码
        const result = await (0, auth_service_1.resetPassword)(phone, password);
        res.json({
            code: 200,
            msg: '密码重置成功',
            data: result
        });
    }
    catch (error) {
        res.status(400).json({
            code: 400,
            msg: error.message || '重置失败'
        });
    }
});
exports.default = router;
