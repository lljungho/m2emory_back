const nodemailer = require('nodemailer');

// 이메일 전송 설정
const transporter = nodemailer.createTransport({
    service: 'Gmail', // 이메일 서비스 제공자
    auth: {
        user: process.env.EMAIL_ADDRESS, // 전송자 이메일
        pass: process.env.EMAIL_PASSWORD, // 전송자 이메일 비밀번호
    }
});

module.exports = {
    transporter,
};