const bcrypt = require('bcrypt');

const utils = {
    // 해싱
    hashData: async (data) => {
        console.log('hashData()');
        try {
            const saltRounds = 10; // 솔트 수 설정
            const hashedData = await bcrypt.hash(data, saltRounds);
            return hashedData;

        } catch(error) {
            console.error('Error hashing data:', error);
            throw error;
        }
    },

    // 비밀번호 매칭
    compareData: async (plainData, hashedData) => {
        console.log('compareData()');
        try {
            const isMatch = await bcrypt.compare(plainData, hashedData);
            return isMatch;

        } catch(error) {
            console.log('Error comparing data :', error);
            throw error;
        }
    },

    // passport로 검증된 유저 정보
    setUserInfo: (user) => {
        const userInfo = {
            u_id: user.id,
            u_email: user.email,
            u_pf_img: user.pf_img,
            u_pf_name: user.pf_name,
            u_pf_introduction: user.pf_introduction,
        };

        return userInfo;
    },
}

module.exports = utils;