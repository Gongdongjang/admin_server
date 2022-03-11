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
        res.send({access_token: 'false'});
    } else {
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
                    {expiresIn: '1h'}
                );
                const refresh_token = await jwt.sign(
                    {
                        id: user[0].admin_id
                    },
                    jwt_secret,
                    {expiresIn: '14d'}
                )

                res.cookie('access_token', access_token, {httpOnly: true, maxAge: 60000 * 60});
                res.cookie('refresh_token', refresh_token, {httpOnly: true, maxAge: 60000 * 60 * 24 * 14});
                res.send({
                    access_token: access_token,
                    refresh_token: refresh_token
                });
            } else {
                res.send({access_token: 'pwd_false'});
            }
        }
    }
})

// access_token 만료 -> refresh token 을 이용해 재발급
app.post('/refresh', async (req, res) => {
    const body = req.body;
    const refresh_token = body.refresh_token;

    if (refresh_token === undefined) {
        res.sendStatus(400);
    } else {
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
            res.send({
                access_token: access_token,
                refresh_token: refresh_token
            })
        } catch (e) {
            res.status(401).send({msg: "retry login"});
        }
    }
})

module.exports = app;