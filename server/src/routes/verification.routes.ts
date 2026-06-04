import express from 'express'
import { generateVerificationCode, storeVerificationCode, verifyCode } from '../services/verification.service'
import { sendSMSVerificationCode } from '../services/sms.service'

const router = express.Router()

// 发送验证码
router.get('/', async (req, res) => {
  try {
    const { phone } = req.query

    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({
        code: 400,
        msg: '手机号不能为空'
      })
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        code: 400,
        msg: '手机号格式不正确'
      })
    }

    // 生成6位验证码
    const code = generateVerificationCode()

    // 存储验证码
    storeVerificationCode(phone, code)

    // 发送短信
    const result = await sendSMSVerificationCode(phone, code)

    if (result.success) {
      res.json({
        code: 200,
        msg: '验证码已发送',
        data: { phone }
      })
    } else {
      res.status(500).json({
        code: 500,
        msg: result.message
      })
    }
  } catch (error) {
    console.error('发送验证码错误:', error)
    res.status(500).json({
      code: 500,
      msg: '服务器错误，请稍后重试'
    })
  }
})

// 验证验证码
router.post('/', (req, res) => {
  try {
    const { phone, code } = req.body

    if (!phone || !code) {
      return res.status(400).json({
        code: 400,
        msg: '手机号和验证码不能为空'
      })
    }

    const isValid = verifyCode(phone, code)

    if (isValid) {
      res.json({
        code: 200,
        msg: '验证码正确'
      })
    } else {
      res.status(400).json({
        code: 400,
        msg: '验证码错误或已过期'
      })
    }
  } catch (error) {
    console.error('验证验证码错误:', error)
    res.status(500).json({
      code: 500,
      msg: '服务器错误，请稍后重试'
    })
  }
})

export default router