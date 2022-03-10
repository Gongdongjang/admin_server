const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

app.use(express.json())

app.post('/', async (req, res) => {
    const body = req.body;
    const id = body.id;
    const password = body.password;

    const [user, field] = await db.execute(`SELECT * FROM admin_user WHERE admin_id = ?`, [id]);
    const encode_pwd = await bcrypt.compare(password, user[0].password);
    if (encode_pwd) {
        const token = await jwt.sign({id: user[0].admin_id, nickname: user[0].nickname}, 'secret', {expiresIn: '7d'});
        res.send({token: token});
    }
})

module.exports = app;