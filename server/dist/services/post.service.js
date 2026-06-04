"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPost = createPost;
exports.getPosts = getPosts;
exports.getPostById = getPostById;
exports.deletePost = deletePost;
exports.getPostsByUserId = getPostsByUserId;
exports.updatePostLikes = updatePostLikes;
exports.updatePostImages = updatePostImages;
const client_1 = __importDefault(require("../prisma/client"));
async function createPost(data) {
    return client_1.default.post.create({
        data: {
            userId: data.userId,
            title: data.title,
            content: data.content,
            category: data.category || undefined,
            destination: data.destination || undefined,
            coverImage: data.coverImage || undefined,
            images: data.images || undefined, // 直接存储数组，不使用 Prisma 的 set 语法
            tags: data.tags || undefined
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
}
async function getPosts(page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const posts = await client_1.default.post.findMany({
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
    });
    return posts.map(post => {
        const images = Array.isArray(post.images)
            ? post.images
            : (post.images && typeof post.images === 'object' && 'set' in post.images
                ? post.images.set
                : []);
        const tags = Array.isArray(post.tags)
            ? post.tags
            : (post.tags && typeof post.tags === 'object' && 'set' in post.tags
                ? post.tags.set
                : []);
        return {
            ...post,
            commentsCount: post._count.comments,
            _count: undefined,
            images,
            tags
        };
    });
}
async function getPostById(id) {
    const post = await client_1.default.post.findUnique({
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
    });
    if (!post)
        return null;
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
    };
}
async function deletePost(postId, userId) {
    return client_1.default.post.deleteMany({
        where: {
            id: postId,
            userId
        }
    });
}
async function getPostsByUserId(userId, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const posts = await client_1.default.post.findMany({
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
    });
    return posts.map(post => {
        const images = Array.isArray(post.images)
            ? post.images
            : (post.images && typeof post.images === 'object' && 'set' in post.images
                ? post.images.set
                : []);
        const tags = Array.isArray(post.tags)
            ? post.tags
            : (post.tags && typeof post.tags === 'object' && 'set' in post.tags
                ? post.tags.set
                : []);
        return {
            ...post,
            commentsCount: post._count.comments,
            _count: undefined,
            images,
            tags
        };
    });
}
async function updatePostLikes(postId) {
    return client_1.default.post.update({
        where: { id: postId },
        data: {
            likesCount: {
                increment: 1
            }
        }
    });
}
async function updatePostImages(postId, coverImage, images) {
    return client_1.default.post.update({
        where: { id: postId },
        data: {
            coverImage,
            images: images // 直接存储数组，不使用 Prisma 的 set 语法
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
}
