import prisma from '../prisma/client'

export interface CreateCommentData {
  postId: string
  userId: string
  content: string
}

export async function createComment(data: CreateCommentData) {
  const comment = await prisma.comment.create({
    data: {
      postId: data.postId,
      userId: data.userId,
      content: data.content
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

  await prisma.post.update({
    where: { id: data.postId },
    data: {
      commentsCount: {
        increment: 1
      }
    }
  })

  return {
    ...comment,
    username: comment.user.username,
    nickname: comment.user.nickname,
    avatarUrl: comment.user.avatarUrl,
    user: undefined
  }
}

export async function getCommentsByPostId(postId: string) {
  const comments = await prisma.comment.findMany({
    where: { postId },
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
      }
    }
  })

  return comments.map(comment => ({
    ...comment,
    username: comment.user.username,
    nickname: comment.user.nickname,
    avatarUrl: comment.user.avatarUrl,
    user: undefined
  }))
}

export async function deleteComment(commentId: string, userId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { post: true }
  })

  if (!comment || comment.userId !== userId) {
    return null
  }

  await prisma.comment.delete({
    where: { id: commentId }
  })

  await prisma.post.update({
    where: { id: comment.postId },
    data: {
      commentsCount: {
        decrement: 1
      }
    }
  })

  return comment
}

export async function updateCommentLikes(commentId: string) {
  return prisma.comment.update({
    where: { id: commentId },
    data: {
      likesCount: {
        increment: 1
      }
    }
  })
}