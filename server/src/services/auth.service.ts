import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import prisma from '../prisma/client'

const JWT_SECRET = (process.env.JWT_SECRET || 'tonaehike_jwt_secret_key_2024') as jwt.Secret

export async function register(username: string, email: string, password: string) {
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] }
  })

  if (existingUser) {
    throw new Error('用户已存在')
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: { username, email, passwordHash, avatarUrl: '/avatar/default.png' },
    select: { id: true, username: true, email: true, avatarUrl: true, nickname: true, createdAt: true }
  })

  const token = jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '2h') as jwt.SignOptions['expiresIn'] }
  )

  return { user, token }
}

export async function login(loginId: string, password: string) {
  const user = await prisma.user.findFirst({ 
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
  })

  if (!user) {
    throw new Error('用户名或密码错误')
  }

  const isValid = await bcrypt.compare(password, user.passwordHash)

  if (!isValid) {
    throw new Error('用户名或密码错误')
  }

  const token = jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '2h') as jwt.SignOptions['expiresIn'] }
  )

  // 确保 avatarUrl 有值，使用默认头像
  const avatarUrl = user.avatarUrl ? user.avatarUrl : '/avatar/default.png'

  return {
    user: { 
      id: user.id, 
      username: user.username, 
      email: user.email,
      avatarUrl: avatarUrl,
      nickname: user.nickname
    },
    token
  }
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({
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
  })
}

export async function updateUserAvatar(userId: string, avatarUrl: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
    select: { id: true, avatarUrl: true }
  })
}

export async function updateUserProfile(userId: string, data: {
  nickname?: string
  gender?: string
  birthday?: Date | null
  phone?: string
  email?: string
  bio?: string
}) {
  return prisma.user.update({
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
  })
}

// 重置密码
export async function resetPassword(phone: string, password: string) {
  // 先找到用户
  const user = await prisma.user.findFirst({
    where: { email: phone } // 因为注册时手机号作为email存储
  })

  if (!user) {
    throw new Error('该手机号未注册')
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
    select: { id: true, username: true, email: true }
  })

  return updatedUser
}
