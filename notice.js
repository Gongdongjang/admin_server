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
    bucket: 'gdjang',
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

// notice 작성
app.post('/', upload.single('photo'), async (req, res) => {
    const body = req.body;
    const title = body.title;
    const context = body.context;
    let photo;
    if (req.file) photo = req.file.key;
    else photo = null;

    try {
        const [result] = await db.execute(`INSERT INTO notice (notice_title, notice_context, notice_photo) VALUES (?, ?, ?)`, [title, context, photo]);
        res.send({id: result.insertId});
    } catch (e) {
        console.log(e);
        res.status(500).send({msg: "server error"});
    }
})

// notice 삭제
app.delete('/delete/:notice_id', async (req, res) => {
    const notice_id = req.params.notice_id;

    try {
        const [notice, field] = await db.execute(`SELECT * FROM notice WHERE notice_id = ?`, [notice_id]);
        const photo = notice[0].notice_photo;

        const [result] = await db.execute(`DELETE FROM notice WHERE notice_id = ?`, [notice_id]);
        // 삭제 성공하면 photo 도 s3 에서 삭제
        if (result) {
            if (photo) {
                s3.deleteObject({
                    Bucket: 'gdjang',
                    Key: photo
                }, (err, data) => {
                    if (err) console.log(err);
                    else console.log(data);
                });
            }
            res.send({notice_id: notice_id, msg: '삭제 성공'});
        } else res.status(400).send({msg: '삭제 실패'});
    } catch (e) {
        console.log(e);
        res.status(500).send({msg: 'server error'});
    }
})

module.exports = app;