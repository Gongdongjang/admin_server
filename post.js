const express = require('express');
const app = express();
const db = require('./db');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const cors = require('cors');
let insertId;

app.use(cors());
app.post('/md', async(req, res)=>{

    const body = req.body;
    //MD
    const name =body.mdName;
    const weight =body.weight;
    const start = body.start;
    const end =body.end;
    const dd =body.dd;
    const max = body.maxqty;
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
        const [result1] = await db.execute('INSERT INTO md (md_name,md_weight,md_start,md_end,md_dd,md_maxqty,farm_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
         [name, weight, start, end, dd, max, farmId ]);
        
         //insertId == md_id
        insertId = result1.insertId;

        //insert payment table
        const [result2] = await db.execute('insert into payment(pay_price,pay_qty,pay_comp,pay_dc,pay_schedule,md_id) VALUES (?, ?, ?, ?, ?, ?)',
         [price, 1, comp, dc, paySchedule, insertId ]);

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

module.exports = app;