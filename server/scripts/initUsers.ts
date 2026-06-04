import bcrypt from 'bcrypt'
import prisma from '../src/prisma/client'

async function initUsers() {
  try {
    console.log('开始初始化用户数据...')

    const hashedPassword = await bcrypt.hash('123456', 10)

    // 创建管理员用户
    const admin = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@tonaehike.com',
        passwordHash: hashedPassword,
        nickname: '管理员',
        phone: '19138811308',
        bio: '系统管理员账号',
        avatarUrl: '/avatar/default.png'
      }
    })
    console.log('✓ 管理员用户创建成功:', admin.username)

    // 创建测试用户
    const testUser = await prisma.user.upsert({
      where: { username: 'tonae' },
      update: {},
      create: {
        username: 'tonae',
        email: 'tonae@tonaehike.com',
        passwordHash: hashedPassword,
        nickname: 'Tonae',
        phone: '17716517779',
        bio: '热爱旅行，分享旅途故事',
        avatarUrl: '/avatar/default.png'
      }
    })
    console.log('✓ 测试用户创建成功:', testUser.username)

    console.log('\n初始化完成！')
    console.log('两个账号密码都是: 123456')
    
  } catch (error) {
    console.error('初始化失败:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

initUsers()
