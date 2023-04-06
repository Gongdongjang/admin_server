const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwt_secret = require('./config').jwt_secret;
const db = require('./db');

app.use(express.json())

// login
app.post('/', async (req, res) => {
    const body = req.body;
    const id = body.id;
    const password = body.password;

    if (id === undefined || password === undefined) {
        console.log(`LOGIN_FAILED :: userID = {${id}}`);
        res.send({access_token: 'false'});
    } else {
        try {
            const [user, field] = await db.execute(`SELECT * FROM admin_user WHERE admin_id = ?`, [id]);

            if (user.length === 0) {
                res.send({access_token: 'id_false'});
            } else {
                const encode_pwd = await bcrypt.compare(password, user[0].password);

                if (encode_pwd) {
                    const access_token = await jwt.sign(
                        {
                            id: user[0].admin_id,
                            nickname: user[0].nickname,
                            name: user[0].admin_name
                        },
                        jwt_secret,
                        {expiresIn: '1d'}
                    );
                    const refresh_token = await jwt.sign(
                        {
                            id: user[0].admin_id
                        },
                        jwt_secret,
                        {expiresIn: '14d'}
                    )

                    res.cookie('access_token', access_token, {httpOnly: false, maxAge: 60000 * 60});
                    res.cookie('refresh_token', refresh_token, {httpOnly: false, maxAge: 60000 * 60 * 24 * 14});

                    let body = {
                        access_token: access_token,
                        refresh_token: refresh_token
                    }

                    const [store, fields] = await db.execute(`SELECT store_id FROM store WHERE store_name = ?`, [user[0].admin_name]);
                    if (store.length !== 0) {
                        body.storeId = store[0].store_id;
                    }

                    console.log(`LOGIN_SUCCESS :: userID = {${id}}`);
                    res.send(body);
                } else {
                    console.log(`LOGIN_FAILED :: userID = {${id}}`);
                    res.send({access_token: 'pwd_false'});
                }
            }
        } catch (e) {
            console.log(`LOGIN_FAILED :: msg = {${e}}`);
        }
    }
})

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

// access_token 만료 -> refresh token 을 이용해 재발급
app.get('/refresh', async (req, res) => {
    let refresh_token = get_cookies(req);

    if (refresh_token === undefined) {
        res.sendStatus(400);
    } else {
        refresh_token = refresh_token['refresh_token'];
        try {
            const refresh_verify = jwt.verify(refresh_token, jwt_secret);

            const [user, fields] = await db.execute('SELECT * FROM admin_user WHERE admin_id = ?', [refresh_verify.id]);
            const access_token = await jwt.sign(
                {
                    id: user[0].admin_id,
                    nickname: user[0].nickname,
                    name: user[0].admin_name
                },
                jwt_secret,
                {expiresIn: '1h'}
            );

            res.cookie('access_token', access_token, {httpOnly: true, maxAge: 60000 * 60, overwrite: true});

            console.log(`REFRESH_SUCCESS ::`);
            res.send({
                access_token: access_token,
                refresh_token: refresh_token
            })
        } catch (e) {
            console.log(`REFRESH_FAILED :: msg = {${e}}`);
            res.status(401).send({msg: "retry login"});
        }
    }
})

// logout
app.post('/logout', async (req, res) => {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    console.log(`LOGOUT_SUCCESS ::`);
    res.send();
})

module.exports = app;