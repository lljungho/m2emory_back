const express = require('express');
const router = express.Router();
const memberService = require('../lib/service/memberService');
const { authenticateJWT } = require('../lib/auth/passportConfig');

// 회원가입
router.post('/signUp', (req, res) => {
    console.log('member signUp.');
    memberService.signUp(req, res);
});

// 로그인
router.post('/signIn', (req, res) => {
    console.log('member signIn.');
    memberService.signIn(req, res);
});

// 로그아웃
router.get('/signOut', (req, res) => {
    console.log('member signOut.');
    memberService.signOut(req, res);
});

// 아이디 찾기
router.post('/forgotId', (req, res) => {
    console.log('member forgotId.');
    memberService.forgotId(req, res);
});

// 비밀번호 찾기
router.post('/forgotPw', (req, res) => {
    console.log('member forgotPw.');
    memberService.forgotPw(req, res);
});

// 유저정보
router.get('/userInfo', authenticateJWT, (req, res) => {
    console.log('member userInfo.');
    memberService.userInfo(req, res);
});

// 프로필 내용 수정
router.put('/modifyProfile', authenticateJWT, (req, res) => {
    console.log('member modifyProfile.');
    memberService.modifyProfile(req, res);
});

// 더비 계정 생성
router.put('/dummy', (req, res) => {
    console.log('member dummy 100');
    memberService.dummyUsers(req, res);
});

module.exports = router;