"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createComment = createComment;
exports.getCommentsByPostId = getCommentsByPostId;
exports.deleteComment = deleteComment;
exports.updateCommentLikes = updateCommentLikes;
const client_1 = __importDefault(require("../prisma/client"));
async function createComment(data) {
    const comment = await client_1.default.comment.create({
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
    });
    await client_1.default.post.update({
        where: { id: data.postId },
        data: {
            commentsCount: {
                increment: 1
            }
        }
    });
    return {
        ...comment,
        username: comment.user.username,
        nickname: comment.user.nickname,
        avatarUrl: comment.user.avatarUrl,
        user: undefined
    };
}
async function getCommentsByPostId(postId) {
    const comments = await client_1.default.comment.findMany({
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
    });
    return comments.map(comment => ({
        ...comment,
        username: comment.user.username,
        nickname: comment.user.nickname,
        avatarUrl: comment.user.avatarUrl,
        user: undefined
    }));
}
async function deleteComment(commentId, userId) {
    const comment = await client_1.default.comment.findUnique({
        where: { id: commentId },
        include: { post: true }
    });
    if (!comment || comment.userId !== userId) {
        return null;
    }
    await client_1.default.comment.delete({
        where: { id: commentId }
    });
    await client_1.default.post.update({
        where: { id: comment.postId },
        data: {
            commentsCount: {
                decrement: 1
            }
        }
    });
    return comment;
}
async function updateCommentLikes(commentId) {
    return client_1.default.comment.update({
        where: { id: commentId },
        data: {
            likesCount: {
                increment: 1
            }
        }
    });
}
