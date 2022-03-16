const express = require('express');
const app = express();
const login_register = require('./login');
const cors = require('cors');

app.use(cors());
app.use('/login', login_register);

app.get('/', async (req, res) => {
    res.send({test: 'initial commit'});
})

app.listen(5000);