const jwt = require('jsonwebtoken');
const jwt_secret = require('./config').jwt_secret;
const db = require('./db');

function token_verify(token) {
    try {
        return jwt.verify(token, jwt_secret);
    } catch (e) {
        if (e.name === 'TokenExpiredError') return undefined;
        else return null;
    }
}

const auth_middleware = async (req, res, next) => {
    let access_token = req.headers.authorization;

    if (access_token === undefined) { // access_token 없으면 로그인 X 상태
        res.status(401).send({msg: "unauthorized"});
    } else {
        access_token = access_token.split('Bearer ')[1];

        try { // access_token 유효하면 인증 완료
            req.decode = jwt.verify(access_token, jwt_secret);
            next();
        } catch (e) {
            res.status(401).send({msg: "unauthorized"});
        }
    }
}

module.exports = auth_middleware;