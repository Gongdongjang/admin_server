const express = require('express');
const app = express();
const db = require('./db');
const cors = require('cors');
const upload  = require('./uploads');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//스토어 앱()
app.get("/test", async (req, res, next) => { //md_id=2인 상품 데이터 출력
    try {
       const [test] = await db.execute(`select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id where md.md_id= 2`);
       
       resultCode = 200;
       
       return res.json({
         code: resultCode,
         test : test
       }); 
     } catch (err) {
       console.error(err);
       return res.status(500).json(err);
     }
  });
app.get("/store/items/:store_id", async (req, res, next) => { //특정 스토어에서 진행하는 상품들 출력
      const store_id = req.params.store_id;
    
        const [mdInfo] = await db.execute(
          `select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id  join farm on md.farm_id=farm.farm_id join md_Img on md.md_id=md_Img.md_id
          where store_id  = ?`,[store_id]);
         
          res.send(mdInfo);
      
    });
app.get("/:md_id", async (req, res, next) => { //특정 상품
        
  const md_id = req.params.md_id;
  let [row2, field] = await db.execute(`select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id join md_Img on md.md_id=md_Img.md_id join farm on md.farm_id=farm.farm_id where md.md_id=?`, [md_id]);
  res.send(row2);
         
      
    });
app.get("/pickup/:md_id", async (req, res, next) => { //특정 스토어에서 진행하는 상품의 픽업리스트
  const md_id = req.params.md_id;
      try {
        const [pickupList] = await db.execute(
          `select * from `+"`"+"order"+"`"+` join md on `+"`"+"order"+"`"+`.md_id=md.md_id where `+"`"+"order"+"`"+`.md_id= ${md_id} and order_cancel=0 `
        );
    
        res.send(pickupList);
      } catch (err) {
        console.error(err);
        return res.status(500).json(err);
      }
    });
app.get('/store/:store_id', async (req, res) => {//특정 store만 get
        const store_id = req.params.store_id;
        try {
            const [store] = await db.execute(
              `select * from store  join Hours on store.store_id=Hours.hours_PartnerId   where store.store_id=${store_id} and Hours.hours_partner=1`
            );
            
            res.send(store);
          } catch (err) {
            console.error(err);
            return res.status(500).json(err);
          }
    });
    app.post("/storeDetail", async (req, res, next) => {
      const store_id = parseInt(req.body.id);
      let resultCode = 404;
      let message = "에러가 발생했습니다.";
    
      try {
        //문제 없으면 try문 실행
    
        let d = new Date();
        let weekday = new Array(7);
        weekday[0] = "일";
        weekday[1] = "월";
        weekday[2] = "화";
        weekday[3] = "수";
        weekday[4] = "목";
        weekday[5] = "금";
        weekday[6] = "토";
    
        let n = weekday[d.getDay()];
    
        //스토어 상세정보
        const [store_result] = await db.execute(
          `SELECT * FROM store WHERE store_id= ${store_id}`
        );
    
        //스토어에 있는 제품리뷰
        const [review_result] = await db.execute(
          `SELECT rvw_rating, rvw_content, md.md_id, md.md_name FROM review join md on review.md_id=md.md_id WHERE (store_id=${store_id}) and (md_result is null or md_result=1)`
        );
    
        //스토어 현재 진행중인 공동구매
        const [md_data] = await db.execute(
          `select * from md join pickup on md.md_id=pickup.md_id  join stock on md.md_id=stock.md_id   join payment on md.md_id=payment.md_id  join farm on md.farm_id=farm.farm_id join md_Img on md.md_id=md_Img.md_id
          where store_id  = ?`,[store_id]);
    
        //스토어 운영 시간
        const [store_date] = await db.execute(
          `SELECT * FROM Hours WHERE hours_partner = 1 and hours_partnerId = ${store_id}`
        );
    
        resultCode = 200;
        message = "스토어 상세로 정보보내기 성공";
    
        let pu_start = new Array();
        let pu_end = new Array();
        let dDay = new Array();
        let now = new Date();
    
        for (let i = 0; i < md_data.length; i++) {
          pu_start[i] = new Date(md_data[i].pu_start).toLocaleDateString();
          pu_end[i] = new Date(md_data[i].pu_end).toLocaleDateString();
    
          let distance = new Date(md_data[i].md_end).getTime() - now.getTime();
          dDay[i] = Math.floor(distance / (1000 * 60 * 60 * 24));
        }
    
        return res.json({
          code: resultCode,
          message: message,
          store_result: store_result,
          jp_result: md_data,
          pu_start: pu_start,
          pu_end: pu_end,
          review_result: review_result,
          store_date: store_date,
          dDay: dDay,
          day: n,
        });
      } catch (err) {
        console.error(err);
        return res.status(500).json(err);
      }
    });
    app.get('/time/:store_id', async (req, res) => {//특정 store만 get
      const store_id = req.params.store_id;
      try {
          //스토어 운영 시간
    const [store_date] = await db.execute(
      `SELECT * FROM Hours WHERE hours_partner = 1 and hours_partnerId = ${store_id}`
    );
          
          res.send(store_date);
        } catch (err) {
          console.error(err);
          return res.status(500).json(err);
        }
  });
app.get('/read/store/imgs', async (req, res) => {//특정 상가의 이미지만
        const store_id = req.query.store_id;//`select * from md  where md_id=?`, [md_id]
        try{
          const [storeImgs] = await db.execute(`select store_thumbnail, store_mainImg, store_detailImg from store where store_id = ${store_id}`);
          
          resultCode = 200;
          message = "store get 성공";
          
          return res.json({
            code: resultCode,
            message: message,
            storeImgs : storeImgs
          }); 
        } catch (err) {
          console.error(err);
          return res.status(500).json(err);
        }
  });
app.post('/pickup/user/:order_id', async (req, res) => {//픽업상태 바꾸기
    const order_id =  req.params.order_id;
    try {
        const [update] = await db.execute(
          `UPDATE`+"`"+"order"+"`"+` SET order_md_status =1 WHERE order_id = ${order_id} ;`
          
        )
       res.send(update);
       console.log("done")
      }
      catch (err) {
        console.error(err);
        return res.status(500).json(err);
      }
});
module.exports = app;