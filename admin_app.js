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
app.get("/pickup", async (req, res, next) => { //특정 스토어에서 진행하는 상품의 픽업리스트
      let md_id = req.query.md_id;
      try {
        const [pickupList] = await db.execute(
          `select * from `+"`"+"order"+"`"+` where md_id= ${md_id}`
        );
    
        resultCode = 200;
        message = "pickupList get 성공";
        
        return res.json({
          code: resultCode,
          message: message,
          pickupList : pickupList
        }); 
      } catch (err) {
        console.error(err);
        return res.status(500).json(err);
      }
    });
app.get('/read/store', async (req, res) => {//특정 store만 get
        const store_id = req.query.store_id;
        try {
            const [store] = await db.execute(
              `select * from store  join Hours on store.store_id=Hours.hours_PartnerId   where store.store_id=${store_id} and Hours.hours_partner=1`
            );
            resultCode = 200;
            message = "store get 성공";
            
            return res.json({
              code: resultCode,
              message: message,
              store : store
            }); 
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
app.get('/pickup/user', async (req, res) => {//픽업상태 바꾸기
    const user_id = req.query.user_id;
    try {
        const [update] = await db.execute(
          `UPDATE`+"`"+"order"+"`"+` SET order_md_status =1 WHERE user_id = ${user_id} ;`
          
        )
        resultCode = 200;
        message = "update 성공";
        
        return res.json({
          code: resultCode,
          message: message,
          update: update
        }); 
      }
      catch (err) {
        console.error(err);
        return res.status(500).json(err);
      }
});
module.exports = app;