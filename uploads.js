const multer = require('multer');
const multerS3 = require('multer-s3')
const AWS = require("aws-sdk");
const aws_key = require('./config').aws_access;

const s3 = new AWS.S3({
    accessKeyId: aws_key.access,
    secretAccessKey: aws_key.secret,
    region: aws_key.region
});
const storage = multerS3({
    s3: s3,
    bucket: 'gdjang',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: 'public-read',
    metadata: function(req, file, cb) {
        cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
        cb(null, `md/${Date.now()}_${file.originalname}`);
    }
})
const upload = multer({
    storage: storage
})

module.exports = upload;
//export default upload