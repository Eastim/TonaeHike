import prisma from '../prisma/client'

export interface CreatePostData {
  userId: string
  title: string
  content: string
  category?: string
  destination?: string
  coverImage?: string
  images?: string[]
  tags?: string[]
}

export async function createPost(data: CreatePostData) {
  return prisma.post.create({
    data: {
      userId: data.userId,
      title: data.title,
      content: data.content,
      category: data.category || undefined,
      destination: data.destination || undefined,
      coverImage: data.coverImage || undefined,
      images: data.images as any || undefined, // 直接存储数组，不使用 Prisma 的 set 语法
      tags: data.tags as any || undefined
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          nickname: true,
          avatarUrl: true
        }
      }
    }
  })
}

export async function getPosts(page: number = 1, pageSize: number = 10) {
  const skip = (page - 1) * pageSize
  
  const posts = await prisma.post.findMany({
    skip,
    take: pageSize,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          nickname: true,
          avatarUrl: true
        }
      },
      _count: {
        select: {
          comments: true
        }
      }
    }
  })
  
  return posts.map(post => {
    const images = Array.isArray(post.images) 
      ? post.images 
      : (post.images && typeof post.images === 'object' && 'set' in post.images 
        ? (post.images as { set: string[] }).set 
        : [])
    const tags = Array.isArray(post.tags) 
      ? post.tags 
      : (post.tags && typeof post.tags === 'object' && 'set' in post.tags 
        ? (post.tags as { set: string[] }).set 
        : [])
    return {
      ...post,
      commentsCount: post._count.comments,
      _count: undefined,
      images,
      tags
    }
  })
}

export async function getPostById(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          nickname: true,
          avatarUrl: true
        }
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              nickname: true,
              avatarUrl: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })
  
  if (!post) return null
  
  return {
    ...post,
    commentsCount: post.comments.length,
    comments: post.comments.map(comment => ({
      ...comment,
      username: comment.user.username,
      nickname: comment.user.nickname,
      avatarUrl: comment.user.avatarUrl,
      user: undefined
    }))
  }
}

export async function deletePost(postId: string, userId: string) {
  return prisma.post.deleteMany({
    where: {
      id: postId,
      userId
    }
  })
}

export async function getPostsByUserId(userId: string, page: number = 1, pageSize: number = 10) {
  const skip = (page - 1) * pageSize
  
  const posts = await prisma.post.findMany({
    where: { userId },
    skip,
    take: pageSize,
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      _count: {
        select: {
          comments: true
        }
      }
    }
  })
  
  return posts.map(post => {
    const images = Array.isArray(post.images) 
      ? post.images 
      : (post.images && typeof post.images === 'object' && 'set' in post.images 
        ? (post.images as { set: string[] }).set 
        : [])
    const tags = Array.isArray(post.tags) 
      ? post.tags 
      : (post.tags && typeof post.tags === 'object' && 'set' in post.tags 
        ? (post.tags as { set: string[] }).set 
        : [])
    return {
      ...post,
      commentsCount: post._count.comments,
      _count: undefined,
      images,
      tags
    }
  })
}

export async function updatePostLikes(postId: string) {
  return prisma.post.update({
    where: { id: postId },
    data: {
      likesCount: {
        increment: 1
      }
    }
  })
}

export async function updatePostImages(postId: string, coverImage: string | undefined, images: string[]) {
  return prisma.post.update({
    where: { id: postId },
    data: {
      coverImage,
      images: images as any // 直接存储数组，不使用 Prisma 的 set 语法
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          nickname: true,
          avatarUrl: true
        }
      }
    }
  })
}
