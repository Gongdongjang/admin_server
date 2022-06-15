const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: 'gdjang.cunrdvutvfmu.ap-northeast-2.rds.amazonaws.com',
    user: 'admin',
    password: 'gdj13579',
    database: 'gdjang',
    connectionLimit: 10,
    dateStrings: 'date',
});

module.exports = db;