const express = require('express');
const app = express();
const db = require('./db');
app.use(express.json());
const cors = require('cors');
const upload  = require('./uploads');
let insertId;

app.use(cors());
app.post('/md', async(req, res)=>{

    const body = req.body;
    console.log(body);
    //MD
    const name =body.mdName;
    const date =body.mdDate;
    const weight =body.weight;
    const start = body.start;
    const end =body.end;
    const dd =body.dd;
    const max = body.maxqty;
    const isFridge = body.isFridge;
    //paypent
    const price =body.price ;
    const dc =body.dc ;
    const comp =body.comp ;
    const paySchedule =body.paySchedule ;
    const farmName =body.farmName ;
    //stock
    const goal =body.goal ;
    const stkMax =body.stkMax ;
    const storeName =body.storeName ;
    //pu
    const puStart =body.puStart ;
    const puEnd =body.puEnd ;

    try{
        //search id
        let [rows1, fields] = await db.execute("SELECT farm_id FROM farm where farm_name='"+farmName+"'");
        let [rows2, fields2] = await db.execute("SELECT store_id FROM store where store_name='"+storeName+"'");
        let farmId = rows1[0].farm_id;
        let storeId = rows2[0].store_id;
        
        //insert MD table
        const [result1] = await db.execute('INSERT INTO md (md_name,md_weight,md_start,md_end,md_dd,md_maxqty,md_isFridge,md_date, farm_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
         [name, weight, start, end, dd, max, isFridge, date, farmId ]);
        
         //insertId == md_id
        insertId = result1.insertId;
        console.log("md"+insertId);
        //insert payment table
        const [result2] = await db.execute('insert into payment(pay_price,pay_comp,pay_dc,pay_schedule,md_id) VALUES (?, ?, ?, ?, ?, ?)',
         [price, comp, dc, paySchedule, insertId ]);

        //insert pickup table
        const [result3] = await db.execute('INSERT INTO pickup(pu_start,pu_end,md_id,store_id) VALUES (?, ?, ?, ?)',
         [puStart, puEnd, insertId, storeId ]);
        
        //insert stock table
        const [result4] = await db.execute('insert into stock(stk_goal,stk_remain,stk_total,stk_confirm,stk_max,md_id) VALUES (?, ?, ?, ?, ?, ?)',
         [goal, 1, 2, 0, stkMax, insertId ]);
        
        console.log('insert 완료');
    }
    catch(err){
        console.log(err);
        res.send( "server error");
    }
    
})
app.get('/farm', async (req, res) => {//md_id에 따라 상점,농장 이름 출력
    
    const [row3, field] = await db.execute('select farm_name from farm');
    res.send(row3);
    
  });
app.get('/store', async (req, res) => {//md_id에 따라 상점,농장 이름 출력
    
    const [row3, field] = await db.execute('select store_name from store');
    res.send(row3);
    
  });

const uploadFiles=upload.fields([{name: 'thumbnail', maxCount: 1},{name:'slides',maxCount:5},{name: 'detail', maxCount: 1}]);
app.post('/md/imgs',uploadFiles, async (req,res)=>{ //상품 이미지 업로드
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


module.exports = app;