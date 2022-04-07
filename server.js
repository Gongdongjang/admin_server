const fs = require('fs');
const express = require("express"); 
const app = express();
const port = process.env.port || 5000; // react의 기본값은 3000이니까 3000이 아닌 아무 수
const cors = require("cors");
const bodyParser = require("body-parser");
const mysql = require("mysql2/promise"); 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const data = fs.readFileSync('./database.json');
const conf = JSON.parse(data);

const connection = mysql.createPool({
    host : conf.host,
    user : conf.user,
    password : conf.password,
    port: conf.port,
    database : conf.database,
    enableKeepAlive: true,
    waitForConnections: true, 
    connectionLimit: 10, 
    queueLimit: 0
});

const multer = require('multer');
const upload = multer({dest: './upload'});

app.get('/api/stores', async (req,res) =>{
    let sql = "SELECT * FROM store";
    const [rows, fields] = await connection.query(sql);
    res.send(rows);
});

app.use('./image', express.static('./upload'));

app.post('/api/stores', upload.single('image'), async (req,res) => {
    let sql = "INSERT INTO store VALUES (null, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)";
    let store_filename = '/image/' + req.file.filename;
    let store_name = req.body.store_name;
    let store_info = req.body.store_info;
    let store_hours = req.body.store_hours;
    let store_restDays = req.body.store_restDays;
    let store_phone = req.body.store_phone;
    let store_type = req.body.store_type;
    let store_loc = req.body.store_loc;
    let store_lat = req.body.store_lat;
    let store_long = req.body.store_long;
    let store_size = req.body.store_size;
    let store_fridge = req.body.store_fridge;
    let store_contractDuration = req.body.store_contractDuration;
    let store_inProg = req.body.store_inProg;
    let admin_number = req.body.admin_number;
    let params = [store_name, store_info, store_hours, store_restDays, store_phone, store_type, store_loc, store_lat, store_long, store_size, store_fridge, store_contractDuration, store_inProg, store_filename, admin_number];

    const [err, rows, fields] = await connection.query(sql, params);
    console.log(err);
    res.send(rows);
});

app.listen(port, ()=>{
    console.log(`Connect at http://localhost:${port}`);
});