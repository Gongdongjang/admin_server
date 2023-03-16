const mysql = require('mysql2/promise');

const db = mysql.createPool({
    
    host: 'ggdjang.ckk4lyglm3sb.ap-northeast-2.rds.amazonaws.com',
    user: 'admin',
    password: 'gdj13579',
    database: 'ggdjang',
    connectionLimit: 10,
    dateStrings: 'date',
});

module.exports = db;
