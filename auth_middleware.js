const jwt = require('jsonwebtoken');
const jwt_secret = require('./config').jwt_secret;

const get_cookies = (req) => {
    let cookies = {};
    req.headers && req.headers.cookie.split(';').forEach(function(cookie) {
        let parts = cookie.match(/(.*?)=(.*)$/)
        cookies[ parts[1].trim() ] = (parts[2] || '').trim();
    });
    return cookies;
};

const auth_middleware = async (req, res, next) => {
    if (req.headers.referer.indexOf('/login') !== -1) {
        console.log('login pass');
        next();
    } else {
        let access_token = get_cookies(req)['access_token'];
        console.log(access_token);

        if (access_token === undefined) { // access_token 없으면 로그인 X 상태
            res.status(401).send({msg: "unauthorized"});
        } else {
            try { // access_token 유효하면 인증 완료
                req.decode = jwt.verify(access_token, jwt_secret);
                console.log(req.decode);
                next();
            } catch (e) { // access_token 만료 -> /refresh 필요
                res.status(401).send({msg: "unauthorized"});
            }
        }
    }
}

module.exports = auth_middleware;