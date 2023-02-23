const express = require('express');
const app = express();

app.get('/', async (req, res) => {
    res.send('initial commit');
})

app.listen(3000);