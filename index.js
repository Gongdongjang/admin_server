const express = require('express');
const app = express();
const login_register = require('./login');
const notificationRegister = require('./notification');
const cors = require('cors');
const auth_middleware = require('./auth_middleware');

app.use(cors());
app.use(auth_middleware);
app.use('/api/login', login_register);
app.use('/api/notification', notificationRegister);

app.get('/api', async (req, res) => {
    res.send(req.decode);
})

app.listen(5000);