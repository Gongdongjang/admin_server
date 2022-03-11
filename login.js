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

module.exports = app;