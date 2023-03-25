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

app.get('/:rvw_id', async(req, res) => { //리뷰의 상품 명,사용자 아이디
  const rvw_id = req.params.rvw_id;
  try {//모든 상점
    let [rows, fields] = await db.execute(`select md_name,user_id from review join md on md.md_id=review.md_id join`+"`"+"user"+"`"+ `on`+"`"+"user"+"`"+`.user_no =review.user_no where rvw_id=?;`, [rvw_id]);
    res.send(rows);
    } 
    catch (e) {
        console.log(e);
    }
  
});
app.get('/img/:rvw_id', async (req, res) => {//특정 상가의 이미지만
  const rvw_id = req.params.rvw_id;//`select * from md  where md_id=?`, [md_id]
  try{
    const [row23, field] = await db.execute(`select rvw_img1,rvw_img2,rvw_img3 from review where rvw_id = ?`,[rvw_id]);
    res.send(row23);
    console.log(rvw_id);
  }
  catch (e) {
    console.log(e);
  }
});

app.post('/delete/:rvw_id', async (req, res) => {
  const rvw_id = req.params.rvw_id;

  try {
      await db.execute(`update review set rvw_who=1,rvw_isDelete=1 WHERE rvw_id=?`, [rvw_id]);
      
      console.log(rvw_id,  '삭제 성공');
  } catch (e) {
      console.log(e);
      res.status(400).send({msg: '잘못된 리뷰 삭제 시도'});
  }
})
app.post('/recover/:rvw_id', async (req, res) => {
  const rvw_id = req.params.rvw_id;

  try {
      await db.execute(`update review set rvw_who=null,rvw_isDelete=0 WHERE rvw_id=?`, [rvw_id]);
      
      console.log(rvw_id,  '복구 성공');
  } catch (e) {
      console.log(e);
      res.status(400).send({msg: '잘못된 리뷰 복구 시도'});
  }
})
app.post('/delete', async (req, res) => {
  const rvw_ids = req.body.rvw_ids;
  console.log(rvw_ids);

  try {
      for (let rvw_id of rvw_ids) {
          rvw_id = rvw_id.id;
          
          const [result] = await db.execute(`update review set rvw_who=1,rvw_isDelete=1 WHERE rvw_id=?`, [rvw_id]);
      }
      console.log(rvw_id, rvw_ids,  '삭제 성공');
  } catch (e) {
      console.log(e);
      res.status(400).send({msg: '잘못된 리뷰 삭제 시도'});
  }
})
module.exports = app;