const authService = {
    success: (req, res, userInfo) => {
        console.log('auth success service');
        res.send({ code: true, userInfo });
    },
    
    failure: (req, res) => {
        console.log('auth failure service');
        res.send({ code: false });
    },
};

module.exports = authService;