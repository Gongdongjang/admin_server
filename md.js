const express = require('express');
const app = express();
const db = require('./db');
const cors = require('cors');
const upload  = require('./uploads');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let insertId;

//읽어오기
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
app.get('/imgs/:md_id', async (req, res) => {//특정 md의 이미지
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
app.get('/name/:md_id', async (req, res) => {//md_id에 따라 상점,농장 이름 출력
    const md_id = req.params.md_id;
    const [row, field] = await db.execute(`select  md.farm_id ,pickup.store_id from md join pickup  using (md_id) where md_id=?`, [md_id]);
    /*console.log(row[0].farm_id);
    let farmId = row[0].farm_id;
    console.log(farmId);
    
    let farmId = row[0].farm_id;
    let storeId = row[0].store_id;
  
    const [row4, field2] = await db.execute(`select  farm_name from farm  where farm_id=?`, [farmId]);
    const [row5, field3] = await db.execute(`select  store_name from store  where store_id=?`, [storeId]);
    let farmName = row4[0].farm_name;
    let storeName = row5[0].store_name;
    res.json( { farm_name: farmName ,store_name:storeName });
    */
  });
app.get('/pickup/:md_id', async (req, res) => {//특정 md의 픽업리스트 출력
    const md_id = req.params.md_id;
    
    try{
      
      let [row2, field] = await db.execute("select * from "+"`"+"order"+"`"+` where md_id=? and order_cancel=0`, [md_id]);
      res.send(row2);
      
    }
    catch (e) {
      consoe.log(e);
  }
  });
app.get('/all/farm', async (req, res) => {//모든 농가 이름만 출력
    
    const [row3, field] = await db.execute('select farm_name from farm');
    res.send(row3);
    
  });//***
app.get('/all/store', async (req, res) => {//모든 상점 이름만 출력
    
    const [row3, field] = await db.execute('select store_name from store');
    res.send(row3);
    
  });//***


//수정,삭제,종료
app.delete('/delete/:md_id', async(req, res)=>{ //특정 md 삭제
    const md_id = req.params.md_id;

    try {
        // md 삭제(외래키때문에 마지막으로 md테이블 삭제)
        const [result_keep] = await db.execute('DELETE FROM keep WHERE md_id=?', [md_id]);
        const [result_payment] = await db.execute('DELETE FROM payment WHERE md_id=?', [md_id]);
        const [result_pickup] = await db.execute('DELETE FROM pickup WHERE md_id=?', [md_id]);
        const [result_stock] = await db.execute('DELETE FROM stock WHERE md_id=?', [md_id]);
        const [result_md] = await db.execute('DELETE FROM md WHERE md_id=?', [md_id]);
        
        if (result_payment&&result_pickup&&result_stock&&result_md) {
            res.send({md_id: md_id, msg: '삭제 성공'});
        } else {
            res.status(400).send({msg: '삭제 실패'});
        }
    } catch (e) {
        console.log(e);
        res.status(400).send({msg: '삭제 오류'});
    }
  });
app.post("/update/:md_id", async(req, res) => { //특정 md 수정

    const MDID = req.params.md_id;
    const body = req.body
    //MD
    const name =body.mdName;
    const type =body.type;
    const start = body.start;
    const end =body.end;
    const dd =body.dd;
    const fridge=body.isFridge;
    
    //paypent
    const price =body.price ;
    const dc =body.dc ;
    const comp =body.comp ;
    
    const farmName =body.farmName ;
    //stock
    const goal =body.goal ;
    const storeName =body.storeName ;
    const stkConfirm =body.stkConfirm;
    //pu
    const puStart =body.puStart ;
    const puEnd =body.puEnd ;
    const puWaybill=body.puWaybill;
    const puTimeStart=body.puTimeStart;
    const puTimeEnd=body.puTimeEnd;
    console.log("날짜 : "+start+" "+end+" "+puStart+" "+puEnd+" "+puWaybill);
    try{
        //search id
        let [rows1, fields] = await db.execute("SELECT farm_id FROM farm where farm_name='"+farmName+"'");
        let [rows2, fields2] = await db.execute("SELECT store_id FROM store where store_name='"+storeName+"'");
        let farmId = rows1[0].farm_id;
        let storeId = rows2[0].store_id;
        
        //	UPDATE example SET name = "First" WHERE id =1;
        //edit MD table
        const [result1] = await db.execute('update md set md_name=?, md_type=?, md_start=?, md_end=?, md_dd=?,md_isFridge=?,  farm_id=? where md_id=?',
         [name,type,start, end, dd,fridge,farmId ,MDID]);

        //edit payment table
        const [result2] = await db.execute('update payment set pay_price=?,  pay_comp=?, pay_dc=?  where md_id=?',
         [price, comp, dc,  MDID ]);

        //edit pickup table
        const [result3] = await db.execute('update pickup set pu_start=?, pu_end=?, store_id=? ,pu_waybill=? ,pu_timeStart=?, pu_timeEnd=? where md_id=?',
         [puStart, puEnd, storeId ,puWaybill,puTimeStart,puTimeEnd, MDID]);
        
        //edit stock table
        const [result4] = await db.execute('update stock set stk_goal=?,  stk_confirm=? where md_id=?',
         [goal,  stkConfirm,  MDID ]);
        
        console.log('insert 완료');
    }
    catch(err){
        console.log(err);
        res.send( "server error");
    }
});
app.post("/cancle/:md_id", async(req, res) => { //특정 md 종료시키기

    const MDID = req.params.md_id;
    
    try{
        //edit MD table
        const [result1] = await db.execute('update md set md_result=2 where md_id=?', [MDID]);  
        console.log("종료");
    }
    catch(err){
        console.log(err);
        res.send( "server error");
    }
});

//등록
app.post('/post', async(req, res)=>{ //md 등록

    const body = req.body;
    console.log(body);
    //MD
    const name =body.mdName;
    const date =body.mdDate;
    const type =body.type;
    const start = body.start;
    const end =body.end;
    const dd =body.dd;
    
    const isFridge = body.isFridge;
    //paypent
    const price =body.price ;
    const dc =body.dc ;
    const comp =body.comp ;
    
    const farmName =body.farmName ;
    //stock
    const goal =body.goal ;
    const storeName =body.storeName ;
    const stkConfirm =body.stkConfirm;
    
    //pu
    const puStart =body.puStart ;
    const puEnd =body.puEnd ;
    const puWaybill=body.puWaybill;
    const puTimeStart=body.puTimeStart;
    const puTimeEnd=body.puTimeEnd;

    try{
        //search id
        let [rows1, fields] = await db.execute("SELECT farm_id FROM farm where farm_name='"+farmName+"'");
        let [rows2, fields2] = await db.execute("SELECT store_id FROM store where store_name='"+storeName+"'");
        let farmId = rows1[0].farm_id;
        let storeId = rows2[0].store_id;
        
        //insert MD table
        const [result1] = await db.execute('INSERT INTO md (md_name,md_type,md_start,md_end,md_dd,md_isFridge,md_date, farm_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
         [name, type, start, end, dd,  isFridge, date, farmId ]);
        
         //insertId == md_id
        insertId = result1.insertId;
        console.log("md"+insertId);
        //insert payment table
        const [result2] = await db.execute('insert into payment(pay_price,pay_comp,pay_dc,md_id) VALUES (?, ?, ?, ?)',
         [price, comp, dc, insertId ]);

        //insert pickup table
        const [result3] = await db.execute('INSERT INTO pickup(pu_start,pu_end,md_id,store_id,pu_waybill,pu_timeStart,pu_timeEnd) VALUES (?, ?, ?, ?, ?,?,?)',
         [puStart, puEnd, insertId, storeId ,puWaybill,puTimeStart,puTimeEnd]);
        
        //insert stock table                                          //남은 재고 //주문 총량//성공 여부
        const [result4] = await db.execute('insert into stock(stk_goal,stk_remain,stk_total,stk_confirm,md_id) VALUES (?, ?, ?, ?,  ?)',
         [goal, goal, 0, stkConfirm,  insertId ]);
        
        console.log('insert 완료');
    }
    catch(err){
        console.log(err);
        res.send( "server error");
    }
    
});
const uploadFiles=upload.fields([{name: 'thumbnail', maxCount: 1},{name:'slides',maxCount:5},{name: 'detail', maxCount: 1}]);
app.post('/post/imgs',uploadFiles, async (req,res)=>{ //상품 이미지 업로드
  console.log("img "+insertId);
  let thumbnail,detail;
  let slides = new Array();
  if (req.files['thumbnail'] !== undefined) {
      thumbnail = req.files['thumbnail'][0].key;
  } else {
      thumbnail = null;
  }
  
  for(let i=0;i<5;i++){
    if (req.files['slides'][i] !== undefined) {
      slides[i] = req.files['slides'][i].key;
      console.log("if "+slides[i]);
   } else {
      slides[i] = null;
      console.log("else "+slides[i]);
   }
  }
  
  if (req.files['detail'] !== undefined) {
    detail = req.files['detail'][0].key;
  } else {
    detail = null; 
  }

  //insert MD_img table
  const [result1] = await db.execute('INSERT INTO md_Img (mdimg_thumbnail, mdImg_slide01, mdImg_slide02, mdImg_slide03, mdImg_slide04, mdImg_slide05,  mdImg_detail, md_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  [thumbnail, slides[0],slides[1] ,slides[2] ,slides[3] ,slides[4] ,detail,insertId  ]);

  
  });
//검색
app.get('/sort/:sort', async(req, res) => { // md 정렬
 
    const sort = req.params.sort;
    switch(sort){
      case 'recent':
        try {//최근등록순 
          //제일 처음 출력-초기화과정
         // 공구 성공 기준 넘으면 공구결과 성공으로 수정
         //진행기간이 끝나지않은 상품은 공구 종료되지않음
         // select case md_result when stk_total>=(stk_goal*0.3) then 0 else 1 end from md join stock on md.md_id=stock.md_id;
          await db.execute("set sql_safe_updates=0");
          await db.execute("update md inner join stock on md.md_id=stock.md_id set  md_result= case when md_end >= now() then null when md_result=2 then 2 when stk_total>=(stk_goal*0.3) then 1 else 0 end ");
          //공구 진행단계 수정(상품준비중,배송중과 스토어 도착은 적용되지않음,,) //when pu_waybill is not null then "상품배송중"
          await db.execute('update stock inner join md on md.md_id=stock.md_id join pickup on md.md_id=pickup.md_id set  stk_confirm = case when md_result = 0 then "공구 취소" when pu_end<now() then "픽업완료"  when md_end<now() then "공동구매 완료" else "공동구매 진행중"end ');
  
          //등록순 출력
          let [rows, fields] = await db.execute("select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id where md.md_result is null || md.md_result =1 ORDER BY md.md_id desc");
          res.send(rows);
          } 
          catch (e) {
              console.log(e);
          }
        break;
  
      case 'alphabet':
        try {//가나다라순
          let [rows, fields] = await db.execute("select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id where md.md_result is null || md.md_result =1 ORDER BY md.md_name ASC");
          res.send(rows);
          } 
          catch (e) {
              console.log(e);
          }
        break;
      
      case 'deadline':
        try {//마감임박순
          let [rows, fields] = await db.execute("select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id where md.md_result is null || md.md_result =1 ORDER BY md.md_end asc");
          res.send(rows);
          } 
          catch (e) {
              console.log(e);
          }
        break;
  
        case 'number':
          try {//상품번호순
            let [rows, fields] = await db.execute("select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id where md.md_result is null || md.md_result =1");
            res.send(rows);
            } 
            catch (e) {
                console.log(e);
            }
          break;
        
          case 'pickup':
            try {//픽업중
              let [rows, fields] = await db.execute("select * from md join pickup on md.md_id=pickup.md_id join stock on md.md_id=stock.md_id join payment on md.md_id=payment.md_id where pu_start<=now() and pu_end>=now() and md_result=1;");
              res.send(rows);
              } 
              catch (e) {
                  console.log(e);
              }
            break;
            
          case 'done':
            try {//진행확정
              let [rows, fields] = await db.execute("select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id where md_result=1;");
              res.send(rows);
              } 
              catch (e) {
                  console.log(e);
              }
            break;
        
    }
  });
  app.get('/MDResult/:sort', async(req, res) => { //md 완료페이지 정렬
   
      const sort = req.params.sort;
      switch(sort){
        case 'recent':
          try {
            //최근등록순 출력
            let [rows, fields] = await db.execute("select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id where md.md_result =0 || md.md_result =2 ORDER BY md.md_id desc");
            res.send(rows);
            } 
            catch (e) {
                console.log(e);
            }
          break;
    
       
    
          case 'cancle':
            try {//진행취소
              let [rows, fields] = await db.execute("select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id where md_result=0;");
              res.send(rows);
              } 
              catch (e) {
                  console.log(e);
              }
            break;
      
          case 'out':
            try {//진행종료
              let [rows, fields] = await db.execute("select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id where md_result=2;");
              res.send(rows);
              } 
              catch (e) {
                  console.log(e);
              }
            break;
          
      }   
  });
  
  app.get('/:search/:search_value', async(req, res) => { //md 검색
   
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
  
      case 'farm2':
        try {//농가
          console.log(search_value);
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
  app.get('/MDResult/:search/:search_value', async(req, res) => { //md 검색
   
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
  
      case 'farm2':
        try {//농가
          console.log(search_value);
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
  });//***
  app.get('/name/:farm_id/:store_id', async (req, res) => {//특정 상점,농장 이름/소개 출력
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