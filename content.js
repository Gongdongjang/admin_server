const express = require('express');
const app = express();
const aws_key = require('./config').aws_access;
const aws = require('aws-sdk');
const multer = require('multer');
const multer_s3 = require('multer-s3');
const db = require('./db');

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
        cb(null, `contents/${Date.now()}_${file.originalname}`);
    }
})
const upload = multer({
    storage: storage
})

app.use(express.json());

// 홍보용 배너 콘텐츠 등록
app.post('/banner', async (req, res) => {
    const bannerIds = req.body;

    try {
        // 기존의 배너 콘텐츠는 NULL로 변경 후 새로 등록
        await db.execute(`UPDATE content SET promotion_banner = ?`, [null]);

        for (let bannerId of bannerIds) {
            const id = bannerId.id;
            const order = bannerId.order;

            await db.execute(`UPDATE content SET promotion_banner = ? WHERE content_id = ?`, [order, id]);
        }

        res.send({msg: 'BANNER_CONTENT_CREATE_SUCCESS', data: bannerIds});
    } catch (e) {
        console.log(e);
        res.status(500).send({msg: 'BANNER_CONTENT_CREATE_FAIL'})
    }
})

// 홍보용 배너 콘텐츠 조회
app.get('/banner', async (req, res) => {
    try {
        const [result, field] = await db.execute(`SELECT * FROM content WHERE promotion_banner IS NOT NULL ORDER BY promotion_banner ASC`);

        res.send({msg: 'BANNER_CONTENT_READ_SUCCESS', data: result});
    } catch (e) {
        console.log(e);
        res.status(500).send({msg: 'BANNER_CONTENT_READ_FAIL'});
    }
})

// 모든 content 리스트
app.get('/', async (req, res) => {
    const query = req.query.aspect;
    const is_tmp = req.query.is_tmp;
    const category = req.query.category;

    let return_content;
    if (query === 'admin') { // 관리자용
        if (!category) {
            const [contents, field] = await db.execute(`SELECT * FROM content WHERE is_tmp = ? ORDER BY content_date DESC`, [is_tmp]);
            return_content = contents;
        } else {
            const [contents, field] = await db.execute(`SELECT * FROM content WHERE content_category = ? AND is_tmp = ? ORDER BY content_date DESC`, [category, is_tmp]);
            return_content = contents;
        }
    }
    else { // 소비자용
        const [contents, fields] = await db.execute(`SELECT * FROM content WHERE is_tmp = 0 AND upload_date < CURRENT_DATE() ORDER BY content_date DESC`);
        return_content = contents;
    }
    res.send(return_content);
})

// content 제목으로 검색
app.get('/search', async (req, res) => {
    const search_word = req.query.search;

    const [contents, fields] = await db.execute(`SELECT * FROM content WHERE CONCAT_WS(' ', content_context, content_title) LIKE ? AND is_tmp = 0 ORDER BY content_date DESC`, ['%' + search_word + '%']);
    res.send(contents);
})

// 특정 content
app.get('/:content_id', async (req, res) => {
    const content_id = req.params.content_id;
    const [content, field] = await db.execute(`SELECT * FROM content WHERE content_id = ?`, [content_id]);
    res.send(content[0]);
})

// content 작성
app.post('/', upload.fields([{name: 'photo', maxCount: 1}, {name: 'thumbnail', maxCount: 1}, {name: 'main', maxCount: 1}]), async (req, res) => {
    const body = req.body;
    const title = body.title;
    const context = body.context;
    const upload_type = body.upload_type;
    const upload_date = body.upload_date;
    const link = body.link;
    const category = body.category;
    const is_tmp = body.is_tmp === 'true';
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
    let main;
    if (req.files['main'] !== undefined) {
        main = req.files['main'][0].key;
    } else {
        main = null;
    }

    try {
        const [result] = await db.execute(`INSERT INTO content(content_title, content_context, content_photo, content_link, content_thumbnail, is_tmp, upload_type, upload_date, content_main, content_category)
                                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [title, context, photo, link, thumbnail, is_tmp, upload_type, upload_date, main, category]);
        res.send({id: result.insertId});
    } catch (e) {
        console.log(e);
        res.status(500).send({msg: "server error"});
    }
});

// content 수정
app.patch('/:content_id', upload.fields([{name: 'photo', maxCount: 1}, {name: 'thumbnail', maxCount: 1}, {name: 'main', maxCount: 1}]), async (req, res) => {
    const content_id = req.params.content_id;
    let body = req.body;
    body.is_tmp = body.is_tmp === 'true';
    let photo_update = false;
    let thumbnail_update = false;
    let main_update = false;

    // 요청하는 것만 update
    let sql_key = Object.keys(body).map((key) => {
        if (key !== 'is_tmp' && !key.includes('upload')) return `content_${key} = ?`;
        else return `${key} = ?`
    }).join(", ");
    let sql_parameter = [...Object.values(body)];
    // 사진 수정 요청
    if (req.files['photo'] !== undefined) {
        if (sql_key) sql_key += ', content_photo = ?';
        else sql_key = 'content_photo = ?';
        sql_parameter.push(req.files['photo'][0].key);
        photo_update = true;
    }
    // 썸네일 수정 요청
    if (req.files['thumbnail'] !== undefined) {
        if (sql_key) sql_key += ', content_thumbnail = ?';
        else sql_key = 'content_thumbnail = ?';
        sql_parameter.push(req.files['thumbnail'][0].key);
        thumbnail_update = true;
    }
    // 메인 사진 수정 요청
    if (req.files['main'] !== undefined) {
        if (sql_key) sql_key += ', content_main = ?';
        else sql_key = 'content_main = ?';
        sql_parameter.push(req.files['main'][0].key);
        main_update = true;
    }
    sql_parameter.push(content_id);

    try {
        const [content, field] = await db.execute(`SELECT * FROM content WHERE content_id = ?`, [content_id]);
        const [result] = await db.execute(`UPDATE content SET ${sql_key} WHERE content_id = ?`, sql_parameter);

        // 사진이나 썸네일/메인 수정 시, s3에서 이전 사진/썸네일/메인 삭제
        if (photo_update || thumbnail_update || main_update) {
            const photo = content[0].content_photo;
            const thumbnail = content[0].content_thumbnail;
            const main = content[0].content_main;

            if (photo_update) {
                s3.deleteObject({
                    Bucket: 'ggdjang',
                    Key: photo
                }, (err, data) => {
                    if (err) console.log(err);
                    else console.log(data);
                });
            }
            if (thumbnail_update) {
                s3.deleteObject({
                    Bucket: 'ggdjang',
                    Key: thumbnail
                }, (err, data) => {
                    if (err) console.log(err);
                    else console.log(data);
                });
            }
            if (main) {
                s3.deleteObject({
                    Bucket: 'ggdjang',
                    Key: main
                }, (err, data) => {
                    if (err) console.log(err);
                    else console.log(data);
                });
            }
        }
        res.send(result);
    } catch (e) {
        console.log(e);
    }
    console.log(sql_key);
    console.log(sql_parameter);
})

// content 삭제(편집)
app.post('/delete', async (req, res) => {
    const content_ids = req.body.content_ids;
    console.log(content_ids);

    try {
        for (let content_id of content_ids) {
            content_id = content_id.id;
            const [content, field] = await db.execute(`SELECT * FROM content WHERE content_id=?`, [content_id]);
            const photo = content[0].content_photo;
            const thumbnail = content[0].content_thumbnail;
            const main = content[0].content_main;

            console.log(photo, thumbnail);

            // db 에서 content 삭제
            const [result] = await db.execute(`DELETE FROM content WHERE content_id=?`, [content_id]);
            // 성공하면
            if (result) {
                s3.deleteObject({
                    Bucket: 'ggdjang',
                    Key: thumbnail
                }, (err, data) => {
                    if (err) console.log(err);
                    else console.log(data);
                });

                // 만약 첨부 사진이 있으면
                if (photo) {
                    s3.deleteObject({
                        Bucket: 'ggdjang',
                        Key: photo
                    }, (err, data) => {
                        if (err) console.log(err);
                        else console.log(data);
                    });
                }

                if (main) {
                    s3.deleteObject({
                        Bucket: 'ggdjang',
                        Key: main
                    }, (err, data) => {
                        if (err) console.log(err);
                        else console.log(data);
                    })
                }
            } else {
                res.status(400).send({msg: '삭제 실패'});
            }
        }
        res.send({content_id: content_ids, msg: '삭제 성공'});
    } catch (e) {
        console.log(e);
        res.status(400).send({msg: '잘못된 content 삭제 시도'});
    }
})

module.exports = app;