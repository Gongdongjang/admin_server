//const { swaggerUi, specs } = require('./modules/swagger');
const express = require('express');
const app = express();

const cors = require('cors');
const read = require('./read');
const md = require('./md');
const partner = require('./partner');
const review = require('./review');
const store = require('./admin_app');

const PORT = 5000;

app.use('/api/admin', store);
app.use('/api/read', read);
app.use('/api/md', md);
app.use('/api/partner', partner);
app.use('/api/review', review);

// 5000 포트로 서버 오픈
app.listen(PORT, function() {
    console.log("start! express server on port 5000")
})

const login_register = require('./login');
const notificationRegister = require('./notification');
const notice_register = require('./notice');
const content_register = require('./content');
const signup_register = require('./signup');
//const cors = require('cors');
const auth_middleware = require('./auth_middleware');

app.use(cors());
app.use(auth_middleware);
app.use('/api/login', login_register);
app.use('/api/notification', notificationRegister);
app.use('/api/notice', notice_register);
app.use('/api/content', content_register);
app.use('/api/signup', signup_register);

app.get('/api', async (req, res) => {
    res.send(req.decode);
})

//app.listen(5000);

