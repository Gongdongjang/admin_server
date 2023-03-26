const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const db = require('./db');
const axios = require('axios');
const CryptoJS = require('crypto-js');
const naver = require('./config').naver;
const fromNumber = require('./config').phoneNumber;

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
        console.log(`SIGNUP_SUCCESS :: userID = {${result.insertId}}` );
    } catch (e) {
        console.log(`SIGNUP_FAILED :: msg = ${e}`);
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
        console.log(`ID_CHECK_SUCCESS`);
    } catch (e) {
        res.status(500).send({ msg: 'server error' });
        console.log(`ID_CHECK_FAILED :: msg = ${e}`);
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

    const sms_url = `https://sens.apigw.ntruss.com/sms/v2/services/${naver.id}/messages`;
    const time_stamp = Date.now().toString();
    const signature = makeSignature(time_stamp);
    let code = '';
    for (let i = 0; i < 6; i++) code += Math.floor(Math.random() * 10);
    try {
        const sms_res = await axios.post(sms_url, {
                "type":"SMS",
                "from": fromNumber,
                "countryCode": "82",
                "content":`공동장 인증번호는 [${code}]입니다.`,
                "messages":[
                    {
                        "to": phone_number,
                        "content":`공동장 인증번호는 [${code}]입니다.`
                    }
                ]
            }, {
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'x-ncp-apigw-timestamp': time_stamp,
                    'x-ncp-iam-access-key': naver.access,
                    'x-ncp-apigw-signature-v2': signature
                }
            }
        )
        const [result] = await db.execute(`INSERT INTO sms_validation(phone_number, code, expire)
                                           VALUES (?, ?, NOW() + INTERVAL 3 MINUTE) ON DUPLICATE KEY
                UPDATE code = ?, expire = NOW() + INTERVAL 3 MINUTE`,
            [phone_number, code, code]);
        res.send({  msg: 'success'  });
        console.log(`SMS_SEND_SUCCESS :: phoneNumber = ${phone_number}`);
    } catch (e) {
        console.log(`SMS_SEND_FAILED :: msg = ${e}`);
        res.status(500).send({ msg: 'server error' });
    }
})

app.post('/phone-check/verify', async (req, res) => {
    const body = req.body;
    const code = body.code;
    const phone_number = body.phone_number;

    let phone_valid = false;

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
        console.log(`SMS_VERIFY_SUCCESS :: phoneNumber = ${phone_number}`);
    } catch (e) {
        console.log(`SMS_VERIFY_FAILED :: msg = ${e}`);
        res.status(500).send({ msg: 'server error' });
    }
})

app.post('/unique-number', async (req, res) => {
    const body = req.body;
    const storeName = body.storeName;
    const uniqueNumber = body.uniqueNumber;

    try {
        const [result, field] = await db.execute(`SELECT store_number FROM store WHERE store_name= ?`, [storeName]);

        if (result.length === 0) {
            res.status(400).send({msg: 'STORE_NOT_FOUND'});
            console.log(`STORE_NOT_FOUND :: storeName = ${storeName}`);
        } else if (uniqueNumber === result[0].store_number) {
            console.log(`UNIQUE_VERIFY_SUCCESS :: storeName = ${storeName}`);
            res.send({
                msg: 'UNIQUE_NUMBER_VERIFY_SUCCESS',
            });
        } else {
            console.log(`UNIQUE_VERIFY_FAILED :: storeName = ${storeName}`);
            res.status(400).send({msg: 'UNIQUE_NUMBER_VERIFY_FAIL'});
        }
    } catch (e) {
        console.log(`UNIQUE_VERIFY_FAILED :: msg = ${e}`);
        res.status(500).send({msg: 'SERVER_ERROR'});
    }
})

module.exports = app;