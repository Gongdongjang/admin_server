const express = require('express');
const app = express();
const aws_key = require('./config').aws_access;
const aws = require('aws-sdk');
const multer = require('multer');
const multer_s3 = require('multer-s3');
const db = require('./db');
const firebase = require('firebase-admin')
const firebaseCredential = require('./config').firebase;
const scheduler = require('node-schedule');

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

/** 알림을 보낼 사용자 조회 */
app.get('/user', async (req, res) => {
    try {
        const [result, field] = await db.execute(`SELECT user_no, user_id, user_name FROM user`);
        res.send({msg: 'USER_READ_SUCCESS', data: result});
    } catch (e) {
        console.log(e);
    }
})

/** 알림 리스트 조회 */
app.get('/', async (req, res) => {
    const body = req.body;
    const filter = req.query.filter;

    const resBody = {msg: 'NOTIFICATION_READ_SUCCESS'};
    try {
        if (!filter) {
            const [result, field] = await db.execute(`SELECT *
                                                      FROM notification
                                                      ORDER BY createdAt DESC`);
            resBody['data'] = result;
        } else {
            const [result, field] = await db.execute(`SELECT *
                                                      FROM notification WHERE notification_target = ?
                                                      ORDER BY createdAt DESC`, [filter]);
            resBody['data'] = result;
        }

        res.send(resBody);
    } catch (e) {
        console.log(e);
    }
})


/** 개별 알림 조회 */
app.get('/:notificationId', async (req, res) => {
    const notificationId = req.params.notificationId;
    const resBody = {msg: 'NOTIFICATION_READ_SUCCESS'};

    try {
        const [result, field] = await db.execute(`SELECT *FROM notification WHERE notification_id = ?`, [notificationId]);
        resBody['data'] = result[0];

        res.send(resBody);
    } catch (e) {
        console.log(e);
    }
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
const createNotificationByUser = async (noticeId, userIds, status) => {
    for (let userId of userIds) {
        if (status === 'SENT')
            await db.execute(`INSERT INTO notification_by_user (notification_user, notification_id) VALUES (?, ?)`,
                [userId, noticeId]);
        else
            await db.execute(`INSERT INTO notification_by_user (notification_user, notification_id, status) VALUES (?, ?, ?)`,
                [userId, noticeId, 'SCHEDULED']);
    }
}

/** 알림 생성 */
const createNotification = async (body, image) => {
    const title = body.title;
    const content = body.content;
    const type = body.type;
    const target = body.target;
    const pushType = body.pushType;
    const date = body.date;

    const [result, fields] = await db.execute(`INSERT INTO notification (notification_title, notification_content, notification_type, notification_target, notification_img,
                          notification_push_type, notification_date) VALUES (?, ?, ?, ?, ?, ?, ?)`, [title, content, type, target, image, pushType, date]);

    return result;
}

const createTokenMessage = (tokens, title, content, image) => {
    let message;

    if (image !== null) {
        const url = encodeURI(`https://ggdjang.s3.ap-northeast-2.amazonaws.com/${image}`)
        message = {
            notification: {
                title: title,
                body: content,
                imageUrl: url
            },
            data: {
                title: title,
                body: content
            },
            tokens: tokens
        }
    } else {
        message = {
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
    }

    return message;
}

const createTopicMessage = (topic, title, content, image) => {
    let message;

    if (image !== null) {
        const url = encodeURI(`https://ggdjang.s3.ap-northeast-2.amazonaws.com/${image}`)
        message = {
            notification: {
                title: title,
                body: content,
                imageUrl: url
            },
            data: {
                title: title,
                body: content
            },
            topic: topic
        }
    } else {
        message = {
            notification: {
                title: title,
                body: content
            },
            data: {
                title: title,
                body: content
            },
            topic: topic
        }
    }

    return message;
}

/** 토큰으로 알림 전송 */
app.post('/token', upload.single('image'), async (req, res) => {
    const body = req.body;
    let userIds = req.body.userIds;
    if (!Array.isArray(userIds)) {
        userIds = userIds.split(',')
    }
    const tokens = await getTokensByUser(userIds);

    const title = body.title;
    const content = body.content;
    const pushType = body.pushType;
    let image = null;
    if (req.file !== undefined) image = req.file.key;

    try {
        const noticeResult = await createNotification(body, image);

        if (pushType === '실시간') {
            const message = createTokenMessage(tokens, title, content, image);

            const msgResult = await firebase.messaging().sendMulticast(message);
            await createNotificationByUser(noticeResult.insertId, userIds, 'SENT');

            res.send({
                msg: "NOTIFICATION_SEND_SUCCESS",
                data: {
                    successCount: msgResult.successCount,
                    failureCount: msgResult.failureCount
                }}
            );
        } else {
            await createNotificationByUser(noticeResult.insertId, userIds, 'SCHEDULED');
            res.send({msg: "NOTIFICATION_RESERVE_SUCCESS"});
        }
    } catch (e) {
        console.log(e);
    }
})

/** 토픽으로 알림 전송 */
app.post('/topic', upload.single('image'), async (req, res) => {
    const body = req.body;
    const topic = body.topic;

    const title = body.title;
    const content = body.content;
    const pushType = body.pushType;
    let image = null;
    if (req.file !== undefined) image = req.file.key;

    try {
        const noticeResult = await createNotification(body, image);

        const [userResult, field] = await db.execute('SELECT user_no FROM user');
        let userIds = [];
        for (let user of userResult) {
            userIds.push(user.user_no);
        }

        if (pushType === '실시간') {
            const message = createTopicMessage(topic, title, content, image);

            const msgResult = await firebase.messaging().send(message);
            await createNotificationByUser(noticeResult.insertId, userIds, 'SENT');

            res.send({
                msg: "NOTIFICATION_SEND_SUCCESS",
                data: {
                    successCount: msgResult.successCount,
                    failureCount: msgResult.failureCount
                }}
            );
        } else {
            await createNotificationByUser(noticeResult.insertId, userIds, 'SCHEDULED');
            res.send({msg: "NOTIFICATION_RESERVE_SUCCESS"});
        }
    } catch (e) {
        console.log(e);
    }
})

/** 매 정각에 예약된 알림(현재 시간 ~ 현재 시간 + 1시간 사이) 확인 후 발송 */
scheduler.scheduleJob('0 * * * *', async () => {
    const [notifications, field] = await db.execute(`SELECT notification_id, notification_target, notification_title, notification_content FROM notification 
                                                                  WHERE notification_push_type = ? AND notification_date BETWEEN NOW() and NOW() + INTERVAL 1 HOUR`, ['예약']);

    for (const notification of notifications) {
        const notificationId = notification.notification_id;
        const target = notification.notification_target;
        const title = notification.notification_title;
        const content = notification.notification_content;
        const image = notification.notification_img;

        const [users, fields] = await db.execute(`SELECT notification_user FROM notification_by_user WHERE notification_id = ?`, [notificationId]);
        let userIds = [];
        for (let user of users) {
            userIds.push(user.notification_user);
        }

        if (target === '개인') {
            const tokens = await getTokensByUser(userIds);

            const message = createTokenMessage(tokens, title, content, image);
            const msgResult = await firebase.messaging().sendMulticast(message);
            console.log(msgResult);
        } else if (target === '소비자') {
            const message = createTopicMessage('userTopic', title, content, image);
            const msgResult = await firebase.messaging().send(message);
            console.log(msgResult);
        }
        // TODO: 관리자 알림 개발 완료 후 추가

        await db.execute(`UPDATE notification_by_user SET status = ? WHERE notification_id = ?`, ['SENT', notificationId]);
    }
})

module.exports = app;