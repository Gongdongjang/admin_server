const express = require('express');
const app = express();

const cors = require('cors');
const read = require('./read');
const post = require('./post');

const PORT = 5000;

//app.use(cors());
app.use('/api/read', read);
app.use('/api/post', post);




// 5000 포트로 서버 오픈
app.listen(PORT, function() {
    console.log("start! express server on port 5000")
})



