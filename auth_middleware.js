const jwt = require('jsonwebtoken');
const jwt_secret = require('./config').jwt_secret;

const get_cookies = (req) => {
    if (req.headers.cookie) {
        let cookies = {};
        req.headers && req.headers.cookie.split(';').forEach(function(cookie) {
            let parts = cookie.match(/(.*?)=(.*)$/)
            cookies[ parts[1].trim() ] = (parts[2] || '').trim();
        });
        return cookies;
    } else return undefined;

};

/** 로그인, 콘텐츠 조회는 토큰 필요 없게 처리 */
const checkPass = (req) => {
    if (req.originalUrl.indexOf('/login') !== -1){
        return true;
    }
    if (req.originalUrl.indexOf('/signup') !== -1){
        return true;
    }
    if (req.method === 'GET' && (req.originalUrl === '/api/content' || req.originalUrl === '/api/content/banner')) {
        return true;
    }
}

const auth_middleware = async (req, res, next) => {
    if (checkPass(req)) {
        console.log(`AUTH_PASS :: url = ${req.originalUrl}`);
        next();
    } else {
        let token = get_cookies(req);
        if (token === undefined) {
            res.status(401).send({msg: "unauthorized"});
        } else {
            const access_token = token['access_token'];
            if (access_token === undefined) { // access_token 없으면 로그인 X 상태
                res.status(401).send({msg: "unauthorized"});
            } else {
                // access_token = access_token['access_token'];
                try { // access_token 유효하면 인증 완료
                    req.decode = jwt.verify(access_token, jwt_secret);
                    next();
                } catch (e) { // access_token 만료 -> /refresh 필요
                    res.status(401).send({msg: "unauthorized"});
                }
            }
        }
    }
}

module.exports = auth_middleware;