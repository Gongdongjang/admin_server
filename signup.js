const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const db = require('./db');
const axios = require('axios');
const CryptoJS = require('crypto-js');
const naver = require('./config').naver;

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

// sms 인증
function makeSignature(time) {
    var space = " ";				// one space
    var newLine = "\n";				// new line
    var method = "POST";				// method
    var url = `/sms/v2/services/${naver.id}/messages`;	// url (include query string)
    var timestamp = time;			// current timestamp (epoch)
    var accessKey = naver.access;			// access key id (from portal or Sub Account)
    var secretKey = naver.console_secret;			// secret key (from portal or Sub Account)

    var hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);
    hmac.update(method);
    hmac.update(space);
    hmac.update(url);
    hmac.update(newLine);
    hmac.update(timestamp);
    hmac.update(newLine);
    hmac.update(accessKey);

    var hash = hmac.finalize();

    return hash.toString(CryptoJS.enc.Base64);
}

app.post('/phone-check', async (req, res) => {
    const body = req.body;
    const phone_number = body.phone_number;
    console.log(body);

    const sms_url = `https://sens.apigw.ntruss.com/sms/v2/services/${naver.id}/messages`;
    const time_stamp = Date.now().toString();
    const signature = makeSignature(time_stamp);
    let code = '';
    for (let i = 0; i < 6; i++) code += Math.floor(Math.random() * 10);
    try {
        // const sms_res = await axios.post(sms_url, {
        //         "type":"SMS",
        //         "from":"01099263238",
        //         "countryCode": "82",
        //         "content":`공동장 인증번호는 [${code}]입니다.`,
        //         "messages":[
        //             {
        //                 "to": phone_number,
        //                 "content":`공동장 인증번호는 [${code}]입니다.`
        //             }
        //         ]
        //     }, {
        //         headers: {
        //             'Content-Type': 'application/json; charset=utf-8',
        //             'x-ncp-apigw-timestamp': time_stamp,
        //             'x-ncp-iam-access-key': naver.access,
        //             'x-ncp-apigw-signature-v2': signature
        //         }
        //     }
        // )
        const [result] = await db.execute(`INSERT INTO sms_validation(phone_number, code, expire)
                                           VALUES (?, ?, NOW() + INTERVAL 3 MINUTE) ON DUPLICATE KEY
                UPDATE code = ?, expire = NOW() + INTERVAL 3 MINUTE`,
            [phone_number, code, code]);
        res.send({  msg: 'success'  });
    } catch (e) {
        console.log(e);
        res.status(500).send({ msg: 'server error' });
    }
})

app.post('/phone-check/verify', async (req, res) => {
    const body = req.body;
    const code = body.code;
    const phone_number = body.phone_number;

    let phone_valid = false;

    console.log(code);
    try {
        const [result, field] = await db.execute(`SELECT *
                                                  FROM sms_validation
                                                  WHERE phone_number = ?`, [phone_number]);
        const expire_time = new Date(result[0].expire).setHours(result[0].expire.getHours() + 9);
        const now = Date.now();
        console.log(expire_time, now)
        if (code === result[0].code && expire_time > now) {
            phone_valid = true;
        }

        res.send({phone_valid: phone_valid});
    } catch (e) {
        console.log(e);
        res.status(500).send({ msg: 'server error' });
    }
})

module.exports = app;