//const { swaggerUi, specs } = require('./modules/swagger');
const express = require('express');
const app = express();

const cors = require('cors');
const read = require('./read');
const post = require('./post');
const edit = require('./edit');
const search = require('./search');
const md = require('./md');
const partner = require('./partner');
const review = require('./review');

const PORT = 5000;

//app.use(cors());
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.use('/api/read', read);
//app.use('/api/post', post);
//app.use('/api/edit', edit);/
//app.use('/api/search', search);


app.use('/api/md', md);
app.use('/api/partner', partner);
app.use('/api/review', review);

// 5000 포트로 서버 오픈
app.listen(PORT, function() {
    console.log("start! express server on port 5000")
})



