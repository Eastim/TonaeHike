"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const trip_routes_1 = __importDefault(require("./routes/trip.routes"));
const post_routes_1 = __importDefault(require("./routes/post.routes"));
const verification_routes_1 = __importDefault(require("./routes/verification.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const comment_routes_1 = __importDefault(require("./routes/comment.routes"));
const search_routes_1 = __importDefault(require("./routes/search.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
});
// 静态文件服务（头像、帖子图片、城市图片等）
app.use('/avatar', express_1.default.static('public/avatar'));
app.use('/posts', express_1.default.static('public/posts'));
app.use('/CityView', express_1.default.static('public/CityView'));
// 添加视频和图片资源服务
app.use('/assset', express_1.default.static('public/assset'));
app.use('/img', express_1.default.static('public/img'));
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/trips', trip_routes_1.default);
app.use('/api/posts', post_routes_1.default);
app.use('/api/comments', comment_routes_1.default);
app.use('/api/search', search_routes_1.default);
app.use('/getcode', verification_routes_1.default);
app.get('/', (req, res) => {
    res.send('TonaeHike Backend API');
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
