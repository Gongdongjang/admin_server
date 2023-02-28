const express = require('express');
const app = express();
const db = require('./db');
const upload  = require('./uploads');
const cors = require('cors');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let insertId;

//읽어오기
/*
app.get('/farm', async(req, res) => { //모든 농가

    try {//모든 상점
      let [rows, fields] = await db.execute(`select * from farm  join Hours on farm.farm_id=Hours.hours_PartnerId   where  Hours.hours_partner=0`);
      res.send(rows);
      } 
      catch (e) {
          console.log(e);
      }
    
    });
app.get('/store', async(req, res) => { //모든 상점

      try {//모든 상점
        let [rows, fields] = await db.execute(`select * from store  join Hours on store.store_id=Hours.hours_PartnerId   where  Hours.hours_partner=1`);
        res.send(rows);
        } 
        catch (e) {
            console.log(e);
        }
      
      });
*/
app.get('/read/farm/:farm_id', async (req, res) => {//특정 농가만 get
    const farm_id = req.params.farm_id;
    
    try{
      //농가별 진행한 공구 횟수 count
      let [row1, field1] = await db.execute(`SELECT COUNT(case when farm_id=? then 1 end) as farmCount  FROM md;`, [farm_id]);
      let farmCount=row1[0].farmCount;
      console.log(row1);
      await db.execute('update farm set farm_saleQty=? where farm_id=?', [farmCount,farm_id]);
      let [row2, field] = await db.execute(`select * from farm join Hours on farm.farm_id=Hours.hours_PartnerId   where farm.farm_id=? and Hours.hours_partner=0`, [farm_id]);
      res.send(row2);
      console.log(row2);
    }
    catch (e) {
      console.log(e);
  }
  }); 
app.get('/read/farm/imgs/:farm_id', async (req, res) => {//특정 농가의 이미지만
    const farm_id = req.params.farm_id;//`select * from md  where md_id=?`, [md_id]
    try{
      //농가별 진행한 공구 횟수 count
    let [row1, field1] = await db.execute(`SELECT COUNT(case when farm_id=? then 1 end) as farmCount  FROM md;`, [farm_id]);
    let farmCount=row1[0].farmCount;
    await db.execute('update farm set farm_saleQty=? where farm_id=?', [farmCount,farm_id]);
      const [row23, field] = await db.execute(`select farm_saleQty,farm_thumbnail, farm_mainImg, farm_detailImg from farm where farm_id = ?`,[farm_id]);
      res.send(row23);
      //console.log(row23);
    }
    catch (e) {
      console.log(e);
    }
  });  //***
  
app.get('/read/store/:store_id', async (req, res) => {//특정 store만 get
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
app.get('/read/store/imgs/:store_id', async (req, res) => {//특정 상가의 이미지만
    const store_id = req.params.store_id;//`select * from md  where md_id=?`, [md_id]
    try{
      const [row23, field] = await db.execute(`select store_thumbnail, store_mainImg, store_detailImg from store where store_id = ?`,[store_id]);
      res.send(row23);
      console.log(store_id);
    }
    catch (e) {
      console.log(e);
    }
  }); //****
  app.get('/md/farm/:farm_id', async (req, res) => {//농가에서 진행했던 md
    
    const farm_id = req.params.farm_id;
    
    const [row3, field] = await db.execute(`select md_name,md.md_id,stk_confirm from md  join stock on md.md_id=stock.md_id where farm_id=?`,[farm_id]);
    
    res.send(row3);
    
  });
  app.get('/md/store/:store_id', async (req, res) => {//상점에서 진행했던 md
    const store_id = req.params.store_id;
    const [row3, field] = await db.execute(`select md_name,md.md_id,stk_confirm from md  join stock on md.md_id=stock.md_id join pickup on md.md_id=pickup.md_id where pickup.store_id=?`,[store_id]);
    
    res.send(row3);
    
  });
//수정
app.post("/farm/update/:farm_id", async(req, res) => { //특정 농가 수정

    const FarmID = req.params.farm_id;
    const body = req.body
    
     //farm
     const name =body.farm_name;
     const info =body.farm_info;
     const loc =body.farm_loc;
     const detailLoc =body.farm_detailLoc;
     const zonecode =body.farm_zonecode;
     const size = body.farm_size;
   
     const farmer =body.farm_farmer;
     const phone =body.farm_phone;
     const email =body.farm_email;
     const mainItem =body.farm_mainItem;
     const saleItem = body.farm_saleItem;
 
     const start = body.farm_start;
     const end =body.farm_end;
     const term =body.farm_contractTerm;
     const isContract =body.farm_isContract;
     const saleQty =body.farm_saleQty;
     //const img = body.farm_img;
     const businessNum =body.farm_businessNum;
     const memo = body.farm_memo;

     //운영시간
    const mon1 = body.hours_mon1; const mon2 = body.hours_mon2;
    const tue1 = body.hours_tue1; const tue2 = body.hours_tue2;
    const wed1 = body.hours_wed1; const wed2 = body.hours_wed2;
    const thu1 = body.hours_thu1; const thu2 = body.hours_thu2;
    const fri1 = body.hours_fri1; const fri2 = body.hours_fri2;
    const sat1 = body.hours_sat1; const sat2 = body.hours_sat2;
    const sun1 = body.hours_sun1; const sun2 = body.hours_sun2;
    const week= body.hours_week;
     console.log(body);
     try{
        
         //insert farm table
         const [result1] = await db.execute('update farm set farm_name=?, farm_info=? ,farm_loc=? ,farm_detailLoc=?, farm_zonecode=?,  farm_mainItem=?, farm_saleItem=?, farm_saleQty=?, farm_farmer=?, farm_phone=?, farm_email =?, farm_size=?, farm_start=?, farm_end=?, farm_contractTerm=?, farm_isContract=?, farm_businessNum=?, farm_memo=? where farm_id=?',
          [name, info, loc , detailLoc, zonecode ,  mainItem, saleItem,saleQty, farmer, phone, email, size, start, end, term, isContract, businessNum, memo,FarmID]);
         //hours_partner : 농가는 0,
        const [result2] = await db.execute('update  Hours set hours_mon1=?,hours_mon2=?,hours_tue1=?,hours_tue2=?,hours_wed1=?,hours_wed2=?,hours_thu1=?,hours_thu2=?,hours_fri1=?,hours_fri2=?,hours_sat1=?,hours_sat2=?,hours_sun1=?,hours_sun2=?,hours_week=?   where hours_partnerId=?',
        [mon1,mon2,tue1,tue2,wed1,wed2,thu1,thu2,fri1,fri2,sat1,sat2,sun1,sun2,week,FarmID]);
         console.log('insert 완료');
     }
     catch(err){
         console.log(err);
         res.send( "server error");
     }
});
app.post("/store/update/:store_id", async(req, res) => { //특정 상점 수정

    const StoreID = req.params.store_id;
    const body = req.body
    
    //store
    const name =body.store_name;
    const info =body.store_info;
    const loc =body.store_loc;
    const detailLoc =body.store_detailLoc;
    const zonecode =body.store_zonecode;

    const size = body.store_size;
  
    const owner =body.store_owner;
    const phone =body.store_phone;
    const email =body.store_email;
    const start = body.store_start;
    const end =body.store_end;
    const term =body.store_contractTerm;
    const isContract =body.store_isContract;

    const memo = body.store_memo;
    const type = body.store_type;
    const fridge= body.store_fridge;
    const number = body.store_number;
    const businessNum = body.store_businessNum;

    //운영시간
    const mon1 = body.hours_mon1; const mon2 = body.hours_mon2;
    const tue1 = body.hours_tue1; const tue2 = body.hours_tue2;
    const wed1 = body.hours_wed1; const wed2 = body.hours_wed2;
    const thu1 = body.hours_thu1; const thu2 = body.hours_thu2;
    const fri1 = body.hours_fri1; const fri2 = body.hours_fri2;
    const sat1 = body.hours_sat1; const sat2 = body.hours_sat2;
    const sun1 = body.hours_sun1; const sun2 = body.hours_sun2;
    const week= body.hours_week;

     console.log(body);
     try{
        
         //insert farm table
         const [result1] = await db.execute('update store set store_name=?, store_info=? ,store_loc=? ,store_detailLoc=?, store_zonecode=?,  store_owner=?, store_phone=?, store_email=? , store_size=?, store_start=?, store_end=?, store_contractTerm=?, store_isContract=?,  store_memo=?,store_type=?, store_fridge=?,store_number=?,store_businessNum=? where store_id=?',
          [name, info, loc , detailLoc, zonecode ,  owner, phone, email, size, start, end, term, isContract,  memo , type, fridge,number,businessNum,StoreID]);
         //hours_partner : 스토어는 1,
        const [result2] = await db.execute('update  Hours set hours_mon1=?,hours_mon2=?,hours_tue1=?,hours_tue2=?,hours_wed1=?,hours_wed2=?,hours_thu1=?,hours_thu2=?,hours_fri1=?,hours_fri2=?,hours_sat1=?,hours_sat2=?,hours_sun1=?,hours_sun2=?,hours_week=?   where hours_partnerId=?',
        [mon1,mon2,tue1,tue2,wed1,wed2,thu1,thu2,fri1,fri2,sat1,sat2,sun1,sun2,week,StoreID]);
        console.log('insert 완료');
     }
     catch(err){
         console.log(err);
         res.send( "server error");
     }
});
  
//등록
app.post('/post/farm', async(req, res)=>{ //농가 등록

    const body = req.body;
    console.log(body);
    //farm
    const name =body.farm_name;
    const info =body.farm_info;
    const loc =body.farm_loc;
    const detailLoc =body.farm_detailLoc;
    const zonecode =body.farm_zonecode;
    const size = body.farm_size;
  
    const farmer =body.farm_farmer;
    const phone =body.farm_phone;
    const email =body.farm_email;
    const mainItem =body.farm_mainItem;
    const saleItem = body.farm_saleItem;

    const start = body.farm_start;
    const end =body.farm_end;
    const term =body.farm_contractTerm;
    const isContract =body.farm_isContract;
    const saleQty =body.farm_saleQty;
    //const img = body.farm_img;
    const businessNum=body.farm_businessNum;
    const memo = body.farm_memo;

    //운영시간
    const mon1 = body.hours_mon1; const mon2 = body.hours_mon2;
    const tue1 = body.hours_tue1; const tue2 = body.hours_tue2;
    const wed1 = body.hours_wed1; const wed2 = body.hours_wed2;
    const thu1 = body.hours_thu1; const thu2 = body.hours_thu2;
    const fri1 = body.hours_fri1; const fri2 = body.hours_fri2;
    const sat1 = body.hours_sat1; const sat2 = body.hours_sat2;
    const sun1 = body.hours_sun1; const sun2 = body.hours_sun2;
    const week= body.hours_week;
    
    try{

        //insert farm table
        const [result1] = await db.execute('INSERT INTO farm (farm_name, farm_info ,farm_loc ,farm_detailLoc, farm_zonecode,  farm_mainItem, farm_saleItem, farm_saleQty, farm_farmer, farm_phone, farm_email , farm_size, farm_start, farm_end, farm_contractTerm, farm_isContract, farm_businessNum, farm_memo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
         [name, info, loc , detailLoc, zonecode ,  mainItem, saleItem,saleQty, farmer, phone, email, size, start, end, term, isContract, businessNum, memo]);
         insertId = result1.insertId;

        //hours_partner : 농가는 0,
        const [result2] = await db.execute('INSERT INTO Hours (hours_partner,hours_partnerId,hours_mon1,hours_mon2,hours_tue1,hours_tue2,hours_wed1,hours_wed2,hours_thu1,hours_thu2,hours_fri1,hours_fri2,hours_sat1,hours_sat2,hours_sun1,hours_sun2,hours_week) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
         [0,insertId,mon1,mon2,tue1,tue2,wed1,wed2,thu1,thu2,fri1,fri2,sat1,sat2,sun1,sun2,week]);
         console.log('insert 완료');
    }
    catch(err){
        console.log(err);
        res.send( "server error");
    }
    
});
const farmUploadFiles=upload.fields([{name: 'thumbnail', maxCount: 1},{name:'main',maxCount:1},{name: 'detail', maxCount: 1}]);
app.post('/post/farm/img',farmUploadFiles, async (req,res)=>{ //농가 이미지 업로드
  
let thumbnail,main,detail;

  if (req.files['thumbnail'] !== undefined) {
      thumbnail = req.files['thumbnail'][0].key;
  } else {
      thumbnail = null;
  }
  
  
  if (req.files['main']!== undefined) {
      main = req.files['main'][0].key;
      
  } else {
      main= null;
 }
  
  
  if (req.files['detail'] !== undefined) {
    detail = req.files['detail'][0].key;
  } else {
    detail = null; 
  }

  //insert store table    UPDATE store SET store_type= '식료품' WHERE store_id =11;
  const [result1] = await db.execute('UPDATE farm SET farm_thumbnail=?, farm_mainImg=?,  farm_detailImg=? where farm_id=?',
  [thumbnail, main,detail,insertId ]);
  
});
  app.post('/post/store', async(req, res)=>{ //상점 등록
  
    const body = req.body;
    console.log(body);
    //store
    const name =body.store_name;
    const info =body.store_info;
    const loc =body.store_loc;
    const detailLoc =body.store_detailLoc;
    const zonecode =body.store_zonecode;

    const size = body.store_size;
  
    const owner =body.store_owner;
    const phone =body.store_phone;
    const email =body.store_email;
    const start = body.store_start;
    const end =body.store_end;
    const term =body.store_contractTerm;
    const isContract =body.store_isContract;

    const memo = body.store_memo;
    const type = body.store_type;
    const fridge= body.store_fridge;
    const number = body.store_number;
    const businessNum = body.store_businessNum;

    //운영시간
    const mon1 = body.hours_mon1; const mon2 = body.hours_mon2;
    const tue1 = body.hours_tue1; const tue2 = body.hours_tue2;
    const wed1 = body.hours_wed1; const wed2 = body.hours_wed2;
    const thu1 = body.hours_thu1; const thu2 = body.hours_thu2;
    const fri1 = body.hours_fri1; const fri2 = body.hours_fri2;
    const sat1 = body.hours_sat1; const sat2 = body.hours_sat2;
    const sun1 = body.hours_sun1; const sun2 = body.hours_sun2;
    const week= body.hours_week;

    try{

        //insert store table
        const [result1] = await db.execute('INSERT INTO store (store_name, store_info ,store_loc ,store_detailLoc, store_zonecode,  store_owner, store_phone, store_email , store_size, store_start, store_end, store_contractTerm, store_isContract,  store_memo,store_type, store_fridge,store_number,store_businessNum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)',
         [name, info, loc , detailLoc, zonecode ,  owner, phone, email, size, start, end, term, isContract,  memo , type, fridge,number,businessNum]);
         insertId = result1.insertId;
        

        //hours_partner : 스토어는 1,
        const [result2] = await db.execute('INSERT INTO Hours (hours_partner,hours_partnerId,hours_mon1,hours_mon2,hours_tue1,hours_tue2,hours_wed1,hours_wed2,hours_thu1,hours_thu2,hours_fri1,hours_fri2,hours_sat1,hours_sat2,hours_sun1,hours_sun2,hours_week) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
         [1,insertId,mon1,mon2,tue1,tue2,wed1,wed2,thu1,thu2,fri1,fri2,sat1,sat2,sun1,sun2,week]);
         console.log('insert 완료');
      }
    catch(err){
        console.log(err);
        res.send( "server error");
    }
    
});
const storeUploadFiles=upload.fields([{name: 'thumbnail', maxCount: 1},{name:'main',maxCount:1},{name: 'detail', maxCount: 1}]);
app.post('/post/store/popo',storeUploadFiles, async (req,res)=>{ //상점 이미지 업로드

  let thumbnail,main,detail;

  if (req.files['thumbnail'] !== undefined) {
      thumbnail = req.files['thumbnail'][0].key;
  } else {
      thumbnail = null;
  }
  
  
  if (req.files['main']!== undefined) {
      main = req.files['main'][0].key;
      
  } else {
      main= null;
 }
  
  
  if (req.files['detail'] !== undefined) {
    detail = req.files['detail'][0].key;
  } else {
    detail = null; 
  }

  //insert store table    UPDATE store SET store_type= '식료품' WHERE store_id =11;
  const [result1] = await db.execute('UPDATE store SET store_thumbnail=?, store_mainImg=?,  store_detailImg=? where store_id=?',
  [thumbnail, main,detail,insertId ]);


  
  }); //****
//검색
app.get('/:partner/:sort', async(req, res) => { //파트너 정렬
 
  
    const partner = req.params.partner;//농가면 0 스토어는 1
    const sort = req.params.sort;
    if(partner=='store')//1이면 스토어
    {
      switch(sort){
        case 'recent':
          try {//최근등록순                            
            let [rows, fields] = await db.execute("select * from store  join Hours on store.store_id=Hours.hours_PartnerId   where  Hours.hours_partner=1  ORDER BY store.store_id desc");
            res.send(rows);
            } 
            catch (e) {
                console.log(e);
            }
          break;
    
        case 'building':
          try {//협업기획중
            let [rows, fields] = await db.execute("select * from store  join Hours on store.store_id=Hours.hours_PartnerId   where  Hours.hours_partner=1 and store_isContract='협업기획중' ");
            res.send(rows);
            } 
            catch (e) {
                console.log(e);
            }
          break;
        
        case 'proceeding':
          try {//공동구매 진행중
            let [rows, fields] = await db.execute("select * from store  join Hours on store.store_id=Hours.hours_PartnerId   where  Hours.hours_partner=1 and store_isContract='공동구매진행'");
            res.send(rows);
            } 
            catch (e) {
                console.log(e);
            }
          break;
    
          case 'keep':
            try {//미활동
              let [rows, fields] = await db.execute("select * from store  join Hours on store.store_id=Hours.hours_PartnerId   where  Hours.hours_partner=1 and store_isContract='미활동'");
              res.send(rows);
              } 
              catch (e) {
                  console.log(e);
              }
            break;
          
      }
    }
    else if (partner=='farm')//농가
    {
      switch(sort){
        case 'recent':
          try {//최근등록순                            
            let [rows, fields] = await db.execute("select * from farm  join Hours on farm.farm_id=Hours.hours_PartnerId   where  Hours.hours_partner=0  ORDER BY farm.farm_id desc");
            res.send(rows);
            } 
            catch (e) {
                console.log(e);
            }
          break;
    
        case 'building':
          try {//협업기획중
            let [rows, fields] = await db.execute("select * from farm  join Hours on farm.farm_id=Hours.hours_PartnerId   where  Hours.hours_partner=0 and farm_isContract='협업기획중' ");
            res.send(rows);
            } 
            catch (e) {
                console.log(e);
            }
          break;
        
        case 'proceeding':
          try {//공동구매 진행중
            let [rows, fields] = await db.execute("select * from farm  join Hours on farm.farm_id=Hours.hours_PartnerId   where  Hours.hours_partner=0 and farm_isContract='공동구매진행'");
            res.send(rows);
            } 
            catch (e) {
                console.log(e);
            }
          break;
    
          case 'keep':
            try {//미활동
              let [rows, fields] = await db.execute("select * from farm  join Hours on farm.farm_id=Hours.hours_PartnerId   where  Hours.hours_partner=0 and farm_isContract='미활동'");
              res.send(rows);
              } 
              catch (e) {
                  console.log(e);
              }
            break;
          
      }
    }
    
  });
  app.get('/:partner/:search/:search_value', async(req, res) => { //파트너 검색
   
    const partner = req.params.partner;//농가, 스토어
    const search = req.params.search;
    const search_value ='%'+ req.params.search_value+'%';
  
    if(partner=='store')// 스토어
      {
        switch(search){
    
          case 'name':
              try {//가게이름
                let [rows, fields] = await db.execute('select * from store where store_name like ?',[search_value]);
                res.send(rows);
                } 
                catch (e) {
                  console.log(e);
                }
              break;
      
          case 'owner':
            try {//가게주
              console.log(search_value);
              let [rows, fields] = await db.execute('select * from store where store_owner like ?',[search_value]);
                res.send(rows);
              } 
              catch (e) {     
                console.log(e);
            }
            break;  
        }
      }
      else if (partner=='farm')//농가
      {
        switch(search){
    
        case 'name':
            try {//농가이름
              let [rows, fields] = await db.execute('select * from farm where farm_name like ?',[search_value]);
              res.send(rows);
              } 
              catch (e) {
                console.log(e);
              }
            break;
    
        case 'owner':
          try {//농장주
            console.log(search_value);
            let [rows, fields] = await db.execute('select * from farm where farm_farmer like ?',[search_value]);
              res.send(rows);
            } 
            catch (e) {     
              console.log(e);
          }
          break;
        
        case 'item':
          try {//주거래품목
            console.log(search_value);
            let [rows, fields] = await db.execute('select * from farm where farm_saleItem like ?',[search_value]);
              res.send(rows);
            } 
            catch (e) {     
              console.log(e);
          }
          break;
        
      }
          }
    
      
     
  });

module.exports = app;