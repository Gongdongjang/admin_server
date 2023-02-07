const express = require('express');
const app = express();
const aws_key = require('./config').aws_access;
const aws = require('aws-sdk');
const multer = require('multer');
const multer_s3 = require('multer-s3');
const db = require('./db');
const firebase = require('firebase-admin')
const firebaseCredential = require('./config').firebase;

app.use(express.json())

const s3 = new aws.S3({
    accessKeyId: aws_key.access,
    secretAccessKey: aws_key.secret,
    region: aws_key.region
});
const storage = multer_s3({
    s3: s3,
    bucket: 'ggdjang',
    contentType: multer_s3.AUTO_CONTENT_TYPE,
    acl: 'public-read',
    metadata: function(req, file, cb) {
        cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
        cb(null, `notification/${Date.now()}_${file.originalname}`);
    }
})
const upload = multer({
    storage: storage
})

firebase.initializeApp({
    credential: firebase.credential.cert(firebaseCredential),
});

/** 알림 리스트 조회 */
app.get('/', async (req, res) => {

})

/** 사용자 아이디로 토큰 찾기 */
const getTokensByUser = async (userIds) => {
    let tokens = [];

    for (let userId of userIds) {
        const [result, field] = await db.execute(`SELECT fcm_token FROM user WHERE user_no = ?`, [userId]);
        tokens.push(result[0].fcm_token);
    }

    return tokens;
}

/** 사용자별 알림 리스트 생성 */
const createNotificationByUser = async (noticeId, userIds) => {
    for (let userId of userIds) {
        await db.execute(`INSERT INTO notification_by_user (notification_user, notification_id) VALUES (?, ?)`, [userId, noticeId]);
    }
}

/** 토큰으로 알림 전송 */
app.post('/token', upload.single('image'), async (req, res) => {
    const body = req.body;
    const userIds = body.userIds;
    const tokens = await getTokensByUser(userIds);

    const title = body.title;
    const content = body.content;
    const type = body.type;
    const target = body.target;
    const image = body.image;
    const pushType = body.pushType;
    const date = body.date;

    try {
        const [result, fields] = await db.execute(`INSERT INTO notification (notification_title, notification_content, notification_type, notification_target, notification_img,
                          notification_push_type, notification_date) VALUES (?, ?, ?, ?, ?, ?, ?)`, [title, content, type, target, image, pushType, date]);

        if (pushType === '실시간') {
            const message = {
                notification: {
                    title: title,
                    body: content
                },
                data: {
                    title: title,
                    body: content
                },
                tokens: tokens
            }

            const msgResult = await firebase.messaging().sendMulticast(message);
            await createNotificationByUser(result.insertId, userIds);

            res.send({
                msg: "NOTIFICATION_SEND_SUCCESS",
                data: {
                    successCount: msgResult.successCount,
                    failureCount: msgResult.failureCount
                }}
            );
        } else {
            res.send({msg: "NOTIFICATION_RESERVE_SUCCESS"});
        }
    } catch (e) {
        console.log(e);
    }
})

/** 토픽으로 알림 전송 */
app.post('/topic', async (req, res) => {

})

module.exports = app;