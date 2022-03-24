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
    const title = req.title;
    const context = req.context;
    const link = req.link;
    let photo;
    if (req.files['photo'] !== undefined) {
        photo = req.files['photo'][0];
    } else {
        photo = null;
    }
    let thumbnail;
    if (req.files['thumbnail'] !== undefined) {
        thumbnail = req.files['thumbnail'][0];
    } else {
        thumbnail = null;
    }

    console.log(body);
    console.log(photo);
    console.log(thumbnail);
    res.send(req.decode);
});

module.exports = app;