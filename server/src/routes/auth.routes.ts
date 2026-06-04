import * as express from 'express'
import { register, login, getUserById, resetPassword } from '../services/auth.service'
import { authenticate, AuthRequest } from '../middleware/auth.middleware'
import { generateVerificationCode, storeVerificationCode, verifyCode } from '../services/verification.service'

const router = express.Router()

router.post('/register', async (req, res) => {
  try {
    const { username, phone, code, password } = req.body

    // 验证必填字段
    if (!username || !phone || !code || !password) {
      return res.status(400).json({
        code: 400,
        msg: '请填写所有必填项'
      })
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        code: 400,
        msg: '手机号格式不正确'
      })
    }

    // 验证验证码
    if (!verifyCode(phone, code)) {
      return res.status(400).json({
        code: 400,
        msg: '验证码错误或已过期'
      })
    }

    // 注册用户（使用手机号作为邮箱）
    const result = await register(username, phone, password)
    res.status(201).json({
      code: 200,
      msg: '注册成功',
      data: result
    })
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      msg: error.message || '注册失败'
    })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const result = await login(username, password)
    res.json({ code: 200, msg: '登录成功', data: result })
  } catch (error: any) {
    res.status(401).json({ code: 401, msg: error.message })
  }
})

router.get('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await getUserById(req.user!.id)
    res.json(user)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
})

// 发送重置密码验证码
router.get('/send-reset-code', async (req, res) => {
  try {
    const { phone } = req.query as { phone?: string }

    if (!phone) {
      return res.status(400).json({
        code: 400,
        msg: '请提供手机号'
      })
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        code: 400,
        msg: '手机号格式不正确'
      })
    }

    // 生成验证码
    const code = generateVerificationCode()
    
    // 存储验证码
    storeVerificationCode(phone, code)

    // TODO: 在生产环境中，这里应该调用短信服务发送验证码
    console.log(`发送验证码 ${code} 到手机号 ${phone}`)

    res.json({
      code: 200,
      msg: '验证码已发送'
    })
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      msg: error.message || '发送失败'
    })
  }
})

// 重置密码
router.post('/reset-password', async (req, res) => {
  try {
    const { phone, code, password } = req.body

    // 验证必填字段
    if (!phone || !code || !password) {
      return res.status(400).json({
        code: 400,
        msg: '请填写所有必填项'
      })
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        code: 400,
        msg: '手机号格式不正确'
      })
    }

    // 验证验证码
    if (!verifyCode(phone, code)) {
      return res.status(400).json({
        code: 400,
        msg: '验证码错误或已过期'
      })
    }

    // 验证密码长度
    if (password.length < 6) {
      return res.status(400).json({
        code: 400,
        msg: '密码至少需要6个字符'
      })
    }

    // 重置密码
    const result = await resetPassword(phone, password)
    
    res.json({
      code: 200,
      msg: '密码重置成功',
      data: result
    })
  } catch (error: any) {
    res.status(400).json({
      code: 400,
      msg: error.message || '重置失败'
    })
  }
})

export default router
