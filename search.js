const express = require('express');
const app = express();
const db = require('./db');
const cors = require('cors');

app.use(cors());
app.use(express.json());


app.get('/:sort', async(req, res) => { //정렬
 
  const sort = req.params.sort;
  switch(sort){
    case 'recent':
      try {//최근등록순
        let [rows, fields] = await db.execute("select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id ORDER BY md.md_id desc");
        res.send(rows);
        } 
        catch (e) {
            console.log(e);
        }
      break;

    case 'alphabet':
      try {//가나다라순
        let [rows, fields] = await db.execute("select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id ORDER BY md.md_name ASC");
        res.send(rows);
        } 
        catch (e) {
            console.log(e);
        }
      break;
    
    case 'deadline':
      try {//마감임박순
        let [rows, fields] = await db.execute("select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id ORDER BY md.md_end asc");
        res.send(rows);
        } 
        catch (e) {
            console.log(e);
        }
      break;

      case 'number':
        try {//상품번호순
          let [rows, fields] = await db.execute("select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id ");
          res.send(rows);
          } 
          catch (e) {
              console.log(e);
          }
        break;
  
      case 'counts':
        try {//조회수 높은 순
          let [rows, fields] = await db.execute("select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id ORDER BY md.md_name ASC");
          res.send(rows);
          } 
          catch (e) {
              console.log(e);
          }
        break;
      
      case 'best':
        try {//구매율 높은순
          let [rows, fields] = await db.execute("select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id ORDER BY md.md_name ASC");
          res.send(rows);
          } 
          catch (e) {
              console.log(e);
          }
        break;
  }
});

app.get('/:search/:search_value', async(req, res) => { //검색
 
  const search = req.params.search;
  const search_value ='%'+ req.params.search_value+'%';
  
  switch(search){

    case 'name':
        try {//상품이름
          let [rows, fields] = await db.execute('select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id join payment on md.md_id=payment.md_id where md.md_name like ?',[search_value]);
          res.send(rows);
          } 
          catch (e) {
            console.log(e);
          }
        break;

    case 'farm':
      try {//농가
        //search id
        let [rows1, fields1] = await db.execute('SELECT farm_id FROM farm where farm_name like ?',[search_value]);
        let farmId = rows1[0].farm_id;
        
        let [rows, fields2] = await db.execute('select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id where md.farm_id=?',[farmId]);
        res.send(rows);
        } 
        catch (e) {     
          if (e instanceof TypeError) {
            console.log('검색결과가 없습니다');
            res.send();
          }else{
            console.log(e);
          }
      }
      break;
    
    case 'store':
      try {//상점
        let [rows2, fields2] = await db.execute('SELECT store_id FROM store where store_name like ?',[search_value]);
        let storeId = rows2[0].store_id;
        let [rows, fields] = await db.execute('select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id where pickup.store_id=?',[storeId]);
        res.send(rows);
      }
        catch (e) {     
          if (e instanceof TypeError) {
            console.log('검색결과가 없습니다');
            res.send();
          }else{
            console.log(e);
          }
      }
      break;
    
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
app.get('/name/:farm_id/:store_id', async (req, res) => {//상점,농장 이름 출력
  const farmId = req.params.farm_id;
  const storeId = req.params.store_id;

  const [row4, field2] = await db.execute(`select  farm_name,farm_info from farm  where farm_id=?`, [farmId]);
  const [row5, field3] = await db.execute(`select  store_name,store_info from store  where store_id=?`, [storeId]);
  let farmName = row4[0].farm_name; 
  let farmInfo = row4[0].farm_info;
  let storeName = row5[0].store_name;
  let storeInfo = row5[0].store_info;
  res.json( { farm_name: farmName ,farm_info:farmInfo,store_name:storeName,store_info:storeInfo });
  
});


module.exports = app;