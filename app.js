//const { swaggerUi, specs } = require('./modules/swagger');
const express = require('express');
const app = express();

const cors = require('cors');
const read = require('./read');
const post = require('./post');
const edit = require('./editMd');
const search = require('./search');
const test = require('./test');

const PORT = 5000;

//app.use(cors());
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use('/api/read', read);
app.use('/api/post', post);
app.use('/api/md', edit);
app.use('/api/search', search);
app.use('/api/test', test);

// 5000 포트로 서버 오픈
app.listen(PORT, function() {
    console.log("start! express server on port 5000")
})



