require('./dotenvConfig');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { passport, authenticateJWT } = require('./lib/auth/passportConfig');

const app = express();
const mainServerPort = process.env.SERVER_PORT;

// cors
const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,  
};
app.use(cors(corsOptions));

// parser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser({
    httpOnly: true, // 클라이언트 측 자바스크립트로 쿠키 접근 금지
    secure: process.env.NODE_ENV === 'production', // https에서만 쿠키전송(true)
}));

// 경로 설정
app.use(express.static(process.env.MEMBER_STATIC_PROFILE_IMG_DIR));

// passport
app.use(passport.initialize());

const memberRouter = require('./routes/memberRouter'); 
app.use('/member', memberRouter); // signUp, signIn, signOut, userInfo, modifyProfile

const uploadRouter = require('./routes/uploadRouter');
app.use('/upload', authenticateJWT, uploadRouter); // modifyProfileImg, deleteProfileImg

app.listen(mainServerPort, () => {
    console.log(`Server is running on port ${mainServerPort}`);
});