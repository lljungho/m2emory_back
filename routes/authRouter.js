const express = require('express');
const router = express.Router();
const authService = require('../lib/service/authService');
const passport = require('../lib/auth/passportConfig');
const utils = require('../lib/utils/utils');

// 세션 유저 정보 저장 성공 유무
// router.post('/log_process',
//     passport.authenticate('local', {
//         successRedirect: '/auth/success',
//         failureRedirect: '/auth/failure'
//     }
// ));
    
// 세션 체크
// router.get('/checkSession', (req, res) => {
//     if (req.isAuthenticated()) {
//         console.log('auth checkSession success');
//         const userInfo = utils.getUserInfo(req.user);
//         res.send({ code: true, userInfo });
//     } else {
//         console.log('auth checkSession failure');
//         res.send({ code: false });
//     }
// });

// // 유저 정보 저장 성공
// router.get('/success', (req, res) => {
//     const userInfo = utils.getUserInfo(req.user);
//     console.log('auth success.');
//     console.log(userInfo);
//     authService.success(req, res, userInfo);
// });

// // 유저 정보 저장 실패
// router.get('/failure', (req, res) => {
//     console.log('auth failure.');
//     authService.failure(req, res);
// });

// // 로그아웃
// router.get('/logout', (req, res) => {
//     console.log('auth logout');
//     req.logout(() => { // passport.js 에서 로그아웃 처리
//         req.session.destroy(); // 세션 파기
//         res.clearCookie('connect.sid'); // 세션 쿠키 삭제
//         res.send({ message: 'logout' });
//     }); 
// });

module.exports = router;