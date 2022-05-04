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

module.exports = app;