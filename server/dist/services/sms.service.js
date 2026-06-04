"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSMSVerificationCode = sendSMSVerificationCode;
const crypto_1 = __importDefault(require("crypto"));
// 容联云配置
const CCLOUD_CONFIG = {
    accountSid: '2c94811c9dfd83b1019e62606f7d58f8',
    authToken: '262c0cfaef514ef3937040c2dafd9b67',
    restUrl: 'https://app.cloopen.com:8883',
    testPhone: '15735830170' // 测试手机号
};
// 生成容联云认证头
// 容联云要求：Authorization = Base64(accountSid:时间戳)
function generateAuthHeader() {
    const now = new Date();
    // 容联云要求的时间格式：yyyy-MM-dd HH:mm:ss
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    // 生成Authorization头：Base64(accountSid:date)
    const authStr = `${CCLOUD_CONFIG.accountSid}:${date}`;
    const authorization = Buffer.from(authStr).toString('base64');
    console.log('生成的Authorization:', authorization);
    console.log('解码后:', Buffer.from(authorization, 'base64').toString());
    return authorization;
}
// 生成签名
// 容联云要求：SigParameter = MD5(账户Id + 账户授权令牌 + 时间戳).toUpperCase()
function generateSig() {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const sigStr = CCLOUD_CONFIG.accountSid + CCLOUD_CONFIG.authToken + date;
    const sig = crypto_1.default
        .createHash('md5')
        .update(sigStr)
        .digest('hex')
        .toUpperCase();
    console.log('生成的Sig:', sig);
    return sig;
}
// 发送短信验证码
async function sendSMSVerificationCode(phone, code) {
    try {
        // 测试模式：直接返回成功，在控制台打印验证码
        console.log(`[测试模式] 验证码已生成: ${code}，将发送到手机号: ${phone}`);
        console.log('容联云配置信息:');
        console.log('- AccountSid:', CCLOUD_CONFIG.accountSid);
        console.log('- AuthToken:', CCLOUD_CONFIG.authToken);
        console.log('- RestUrl:', CCLOUD_CONFIG.restUrl);
        // 如果需要发送真实短信，取消下面的注释并确保模板ID正确
        /*
        const sig = generateSig()
        const authHeader = generateAuthHeader()
        
        const url = `${CCLOUD_CONFIG.restUrl}/2013-12-26/Accounts/${CCLOUD_CONFIG.accountSid}/SMS/TemplateSMS?sig=${sig}`
    
        const body = JSON.stringify({
          to: phone,
          templateId: '1', // 需要在容联云后台配置模板
          appId: CCLOUD_CONFIG.accountSid,
          datas: [code, '5'] // 验证码和有效期(分钟)
        })
    
        console.log('发送短信请求到:', url)
        console.log('请求体:', body)
    
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': authHeader
          },
          body
        })
    
        const result = await response.json()
        console.log('容联云响应:', result)
        
        if (result.statusCode === '000000') {
          return { success: true, message: '验证码已发送' }
        } else {
          console.error('发送短信失败:', result)
          return { success: false, message: result.statusMsg || '发送失败' }
        }
        */
        return { success: true, message: '验证码已发送（测试模式）' };
    }
    catch (error) {
        console.error('发送短信异常:', error);
        return { success: false, message: '网络错误，请稍后重试' };
    }
}
