// 서버 에러 핸들러
const handleServerError = (res, error, location = 'Unknown') => {
    console.error(`${location} Error:`, error);
    res.status(500).json({ 
        message: `${location} Internal server error`
    });
};

// 데이터베이스 조회 결과 없음
const handleDatabaseError = (res, location = 'Database') => {
    res.status(400).json({ 
        message: `${location} No database lookup results`
    });
};


module.exports = {
    handleServerError,
    handleDatabaseError,
};