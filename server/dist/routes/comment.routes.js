"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const comment_service_1 = require("../services/comment.service");
const router = express_1.default.Router();
router.post('/', auth_middleware_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                code: 401,
                msg: '未授权'
            });
        }
        const { postId, content } = req.body;
        if (!postId || !content) {
            return res.status(400).json({
                code: 400,
                msg: '帖子ID和评论内容不能为空'
            });
        }
        const comment = await (0, comment_service_1.createComment)({
            postId,
            userId: req.user.id,
            content
        });
        res.json({
            code: 200,
            msg: '评论成功',
            data: comment
        });
    }
    catch (error) {
        console.error('创建评论失败:', error);
        res.status(500).json({
            code: 500,
            msg: error.message || '评论失败'
        });
    }
});
router.get('/post/:postId', async (req, res) => {
    try {
        const { postId } = req.params;
        const comments = await (0, comment_service_1.getCommentsByPostId)(postId);
        res.json({
            code: 200,
            msg: '获取成功',
            data: comments
        });
    }
    catch (error) {
        console.error('获取评论失败:', error);
        res.status(500).json({
            code: 500,
            msg: error.message || '获取失败'
        });
    }
});
router.delete('/:id', auth_middleware_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                code: 401,
                msg: '未授权'
            });
        }
        const { id } = req.params;
        const result = await (0, comment_service_1.deleteComment)(id, req.user.id);
        if (!result) {
            return res.status(404).json({
                code: 404,
                msg: '评论不存在或无权删除'
            });
        }
        res.json({
            code: 200,
            msg: '删除成功'
        });
    }
    catch (error) {
        console.error('删除评论失败:', error);
        res.status(500).json({
            code: 500,
            msg: error.message || '删除失败'
        });
    }
});
router.post('/:id/like', auth_middleware_1.authenticate, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                code: 401,
                msg: '未授权'
            });
        }
        const { id } = req.params;
        const comment = await (0, comment_service_1.updateCommentLikes)(id);
        res.json({
            code: 200,
            msg: '点赞成功',
            data: {
                likesCount: comment.likesCount
            }
        });
    }
    catch (error) {
        console.error('评论点赞失败:', error);
        res.status(500).json({
            code: 500,
            msg: error.message || '点赞失败'
        });
    }
});
exports.default = router;
