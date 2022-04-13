const express = require('express');
const app = express();
const aws_key = require('./config').aws_access;
const aws = require('aws-sdk');
const multer = require('multer');
const multer_s3 = require('multer-s3');
const db = require('./db');

// aws.config.update({})


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
        cb(null, `contents/${Date.now()}_${file.originalname}`);
    }
})
const upload = multer({
    storage: storage
})

app.use(express.json());

// content 작성
app.post('/', upload.fields([{name: 'photo', maxCount: 1}, {name: 'thumbnail', maxCount: 1}]), async (req, res) => {
    const body = req.body;
    const title = body.title;
    const context = body.context;
    const link = body.link;
    let photo;
    if (req.files['photo'] !== undefined) {
        photo = req.files['photo'][0].key;
    } else {
        photo = null;
    }
    let thumbnail;
    if (req.files['thumbnail'] !== undefined) {
        thumbnail = req.files['thumbnail'][0].key;
    } else {
        thumbnail = null;
    }

    try {
        const [result] = await db.execute(`INSERT INTO content(content_title, content_context, content_photo, content_link, content_thumbnail)
                                        VALUES (?, ?, ?, ?, ?)`, [title, context, photo, link, thumbnail]);
        res.send({id: result.insertId});
    } catch (e) {
        console.log(e);
        res.status(500).send({msg: "server error"});
    }
});

app.delete('/delete/:content_id', async (req, res) => {
    const content_id = req.params.content_id;

    try {
        const [content, field] = await db.execute(`SELECT * FROM content WHERE content_id=?`, [content_id]);
        const photo = content[0].content_photo;
        const thumbnail = content[0].content_thumbnail;

        console.log(photo, thumbnail);

        // db 에서 content 삭제
        const [result] = await db.execute(`DELETE FROM content WHERE content_id=?`, [content_id]);
        // 성공하면
        if (result) {
            s3.deleteObject({
                Bucket: 'gdjang',
                Key: thumbnail
            }, (err, data) => {
                if (err) console.log(err);
                else console.log(data);
            });

            // 만약 첨부 사진이 있으면
            if (photo) {
                s3.deleteObject({
                    Bucket: 'gdjang',
                    Key: photo
                }, (err, data) => {
                    if (err) console.log(err);
                    else console.log(data);
                });
            }
            res.send({content_id: content_id, msg: '삭제 성공'});
        } else {
            res.status(400).send({msg: '삭제 실패'});
        }
    } catch (e) {
        console.log(e);
        res.status(400).send({msg: '잘못된 content 삭제 시도'});
    }
})


module.exports = app;