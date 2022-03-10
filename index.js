const express = require('express');
const app = express();
const login_register = require('./login');

app.use('/login', login_register);

app.get('/', async (req, res) => {
    res.send('initial commit');
})

app.listen(3000);