const express = require('express');
const app = express();
const db = require('./db');
const cors = require('cors');

app.use(cors());
app.use(express.json());



//read
app.get('/', async(req, res) => { //굳이 필요는 없지만,,
 
  try {//최근등록순
    let [rows, fields] = await db.execute("select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id ORDER BY md.md_id desc");
    res.send(rows);
    } 
    catch (e) {
        console.log(e);
    }
  
  });
app.get('/farm', async(req, res) => { 

    try {//모든 상점
      let [rows, fields] = await db.execute(`select * from farm  join Hours on farm.farm_id=Hours.hours_PartnerId   where  Hours.hours_partner=0`);
      res.send(rows);
      } 
      catch (e) {
          console.log(e);
      }
    
    });
app.get('/store', async(req, res) => { 

      try {//모든 상점
        let [rows, fields] = await db.execute(`select * from store  join Hours on store.store_id=Hours.hours_PartnerId   where  Hours.hours_partner=1`);
        res.send(rows);
        } 
        catch (e) {
            console.log(e);
        }
      
      });
app.get('/review', async(req, res) => { 

        try {//모든 상점
          let [rows, fields] = await db.execute("select * from review where rvw_isDelete =0 ORDER BY rvw_id desc");
          res.send(rows);
          } 
          catch (e) {
              console.log(e);
          }
        
        });
app.get('/reviewDelete', async(req, res) => { 

        try {//모든 상점
          let [rows, fields] = await db.execute("select * from review where rvw_isDelete =1 ORDER BY rvw_id desc");
          res.send(rows);
          } 
          catch (e) {                
            console.log(e);
         }
          
});
app.get('/MD/MDResult', async(req, res) => { 
 
    try {//최근등록순
      let [rows, fields] = await db.execute("select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id where md.md_result is not null ORDER BY md.md_id desc");
       res.send(rows);
      } 
    catch (e) {
      console.log(e);
      }
          
          });       
app.get('/:md_id', async (req, res) => {//특정 md만 get
  const md_id = req.params.md_id;
  
  try{
    
    let [row2, field] = await db.execute(`select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id where md.md_id=?`, [md_id]);
    res.send(row2);
    console.log(row2);
  }
  catch (e) {
    console.log(e);
}
});

app.get('/imgs/:md_id', async (req, res) => {//특정 md만 get
  const md_id = req.params.md_id;//`select * from md  where md_id=?`, [md_id]
  try{
    const [row23, field] = await db.execute(`select * from md_Img where md_id = ?`,[md_id]);
    res.send(row23);
    //console.log(row23);
  }
  catch (e) {
    console.log(e);
  }
});
app.get('/farm/:farm_id', async (req, res) => {//특정 md만 get
  const farm_id = req.params.farm_id;
  
  try{
    
    let [row2, field] = await db.execute(`select * from farm join Hours on farm.farm_id=Hours.hours_PartnerId   where farm.farm_id=? and Hours.hours_partner=0`, [farm_id]);
    res.send(row2);
    console.log(row2);
  }
  catch (e) {
    console.log(e);
}
});
app.get('/farm/imgs/:farm_id', async (req, res) => {//특정 md만 get
  const farm_id = req.params.farm_id;//`select * from md  where md_id=?`, [md_id]
  try{
    const [row23, field] = await db.execute(`select farm_thumbnail, farm_mainImg, farm_detailImg from farm where farm_id = ?`,[farm_id]);
    res.send(row23);
    //console.log(row23);
  }
  catch (e) {
    console.log(e);
  }
});

app.get('/store/:store_id', async (req, res) => {//특정 store만 get
  const store_id = req.params.store_id;
  
  try{
    
    let [row2, field] = await db.execute(`select * from store  join Hours on store.store_id=Hours.hours_PartnerId   where store.store_id=? and Hours.hours_partner=1`, [store_id]);
    res.send(row2);
    console.log(row2);
  }
  catch (e) {
    console.log(e);
}
});
app.get('/store/imgs/:store_id', async (req, res) => {//특정 md만 get
  const store_id = req.params.store_id;//`select * from md  where md_id=?`, [md_id]
  try{
    const [row23, field] = await db.execute(`select store_thumbnail, store_mainImg, store_detailImg from store where store_id = ?`,[store_id]);
    res.send(row23);
    console.log(store_id);
  }
  catch (e) {
    console.log(e);
  }
});

app.get('/name/:md_id', async (req, res) => {//md_id에 따라 상점,농장 이름 출력
  const md_id = req.params.md_id;
  const [row3, field] = await db.execute(`select  md.farm_id ,pickup.store_id from md join pickup  using (md_id) where md_id=?`, [md_id]);
  let farmId = row3[0].farm_id;
  let storeId = row3[0].store_id;

  const [row4, field2] = await db.execute(`select  farm_name from farm  where farm_id=?`, [farmId]);
  const [row5, field3] = await db.execute(`select  store_name from store  where store_id=?`, [storeId]);
  let farmName = row4[0].farm_name;
  let storeName = row5[0].store_name;
  res.json( { farm_name: farmName ,store_name:storeName });
  
});

app.get('/pickup/:md_id', async (req, res) => {//특정 md의 픽업리스트 출력
  const md_id = req.params.md_id;
  
  try{
    
    let [row2, field] = await db.execute("select * from "+"`"+"order"+"`"+` where md_id=?`, [md_id]);
    res.send(row2);
    
  }
  catch (e) {
    consoe.log(e);
}
});

module.exports = app;