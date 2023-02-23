const express = require('express');
const app = express();
const db = require('./db');
const cors = require('cors');

app.use(cors());
app.use(express.json());

app.get('/', async(req, res) => { //삭제되지않은 리뷰 가져오기

    try {//모든 상점
      let [rows, fields] = await db.execute("select * from review where rvw_isDelete =0 ORDER BY rvw_id desc");
      res.send(rows);
      } 
      catch (e) {
          console.log(e);
      }
    
});
app.get('/reviewDelete', async(req, res) => {  //삭제된 리뷰 가져오기

    try {//모든 상점
      let [rows, fields] = await db.execute("select * from review where rvw_isDelete =1 ORDER BY rvw_id desc");
      res.send(rows);
      } 
      catch (e) {                
        console.log(e);
     }
      
});


module.exports = app;