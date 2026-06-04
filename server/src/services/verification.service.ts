import crypto from 'crypto'

// 验证码存储（生产环境应该使用 Redis）
const verificationCodes = new Map<string, { code: string, expiry: number }>()

// 生成6位随机验证码
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// 存储验证码（5分钟过期）
export function storeVerificationCode(phone: string, code: string): void {
  const expiry = Date.now() + 5 * 60 * 1000 // 5分钟后过期
  verificationCodes.set(phone, { code, expiry })
}

// 验证验证码
export function verifyCode(phone: string, code: string): boolean {
  const stored = verificationCodes.get(phone)
  if (!stored) {
    return false
  }
  
  // 检查是否过期
  if (Date.now() > stored.expiry) {
    verificationCodes.delete(phone)
    return false
  }
  
  // 验证码是否正确
  const isValid = stored.code === code
  
  // 验证成功后删除验证码
  if (isValid) {
    verificationCodes.delete(phone)
  }
  
  return isValid
}

// 清理过期验证码（定时任务）
export function cleanExpiredCodes(): void {
  const now = Date.now()
  for (const [phone, data] of verificationCodes.entries()) {
    if (now > data.expiry) {
      verificationCodes.delete(phone)
    }
  }
}

// 每分钟清理一次过期验证码
setInterval(cleanExpiredCodes, 60 * 1000)