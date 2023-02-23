const express = require('express');
const app = express();
const db = require('./db');
const aws_key = require('./config').aws_access;
const aws = require('aws-sdk');
const multer = require('multer');
const multer_s3 = require('multer-s3');

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
        cb(null, `notice/${Date.now()}_${file.originalname}`);
    }
})
const upload = multer({
    storage: storage
})

app.use(express.json());

/** 특정 notice 가져오기 */
app.get('/:noticeId', async (req, res) => {
    const noticeId = req.params.noticeId;

    const [notice, fields] = await db.execute(`SELECT * FROM notice WHERE notice_id = ?`, [noticeId]);
    res.send({
        msg: 'NOTICE_READ_SUCCESS',
        data: notice[0]
    });
})

// notice 가져오기
app.get('/', async (req, res) => {
    try {
        const [notices, fields] = await db.execute(`SELECT * FROM notice WHERE notice_date < CURRENT_DATE() ORDER BY notice_date DESC`);
        res.send(notices);
    } catch (e) {
        console.log(e);
        res.status(500).send({msg: "server error"});
    }
})

// notice 작성
app.post('/', upload.single('photo'), async (req, res) => {
    const body = req.body;
    const title = body.title;
    const context = body.context;
    const target = '소비자';
    const type = body.type;
    const date = body.date;
    let photo;
    if (req.file) photo = req.file.key;
    else photo = null;

    try {
        const [result] = await db.execute(`INSERT INTO notice (notice_title, notice_context, notice_photo, notice_date, notice_target, notice_type) VALUES (?, ?, ?, ?, ?, ?)`,
          [title, context, photo, date, target, type]);
        res.send({id: result.insertId});
    } catch (e) {
        console.log(e);
        res.status(500).send({msg: "server error"});
    }
})

// notice 삭제
app.post('/delete', async (req, res) => {
    const notice_ids = req.body.notice_ids;

    try {
        for (let notice_id of notice_ids) {
            notice_id = notice_id.id;

            const [notice, field] = await db.execute(`SELECT * FROM notice WHERE notice_id = ?`, [notice_id]);
            const photo = notice[0].notice_photo;

            const [result] = await db.execute(`DELETE FROM notice WHERE notice_id = ?`, [notice_id]);
            // 삭제 성공하면 photo 도 s3 에서 삭제
            if (result) {
                if (photo) {
                    s3.deleteObject({
                        Bucket: 'ggdjang',
                        Key: photo
                    }, (err, data) => {
                        if (err) console.log(err);
                        else console.log(data);
                    });
                }
            } else res.status(400).send({msg: '삭제 실패'});
        }
        res.send({notice_id: notice_ids, msg: '삭제 성공'});
    } catch (e) {
        console.log(e);
        res.status(500).send({msg: 'server error'});
    }
})

module.exports = app;
