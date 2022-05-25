const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const db = require('./db');

app.use(express.json());

// 사장님용 회원가입
app.post('/', async (req, res) => {
    const body = req.body;
    const id = body.id;
    const password = body.password;
    const nickname = body.nickname;
    const phone_number = body.phone_number;

    const encode_pwd = await bcrypt.hash(password, 10);
    try {
        const [result] = await db.execute(`INSERT INTO admin_user (admin_id, password, admin_name, mobile_number) VALUES (?, ?, ?, ?)`,
            [id, encode_pwd, nickname, phone_number]);
        res.send({ id: result.insertId });
    } catch (e) {
        console.log(e);
        res.status(500).send({ msg: 'signup error'});
    }
})

// id 중복 확인
app.post('/id-check', async (req, res) => {
    const body = req.body;
    const id = body.id;
    let is_valid = true;

    try {
        const [result, field] = await db.execute(`SELECT * FROM admin_user WHERE admin_id = ?`, [id]);
        // id가 이미 존재하면 is_valid 는 false
        if (result.length !== 0) is_valid = false;
        res.send({ is_valid: is_valid });
    } catch (e) {
        res.status(500).send({ msg: 'server error' });
    }
})

module.exports = app;