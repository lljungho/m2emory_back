require('../../dotenvConfig');
const mysql = require('mysql2/promise');

// database connect
const DB = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    dateStrings: true,
    waitForConnections: true,  // 모든 연결이 사용 중일 때 새로운 연결 요청을 대기열에 추가
    connectionLimit: 10,       // 동시에 최대 허용 제한
    queueLimit: 0              // 대기열의 크기를 제한하지 않음 (무제한 대기열)
});

module.exports = DB;