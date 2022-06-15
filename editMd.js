const express = require('express');
const app = express();
const db = require('./db');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const cors = require('cors');

app.use(cors());
app.delete('/delete/:md_id', async(req, res)=>{
    const md_id = req.params.md_id;

    try {
        // md 삭제(외래키때문에 마지막으로 md테이블 삭제)
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
  })

app.post("/update/:md_id", async(req, res) => {

    const MDID = req.params.md_id;
    const body = req.body
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
    console.log("날짜 : "+start+" "+end+" "+paySchedule+" "+puStart+" "+puEnd);
    try{
        //search id
        let [rows1, fields] = await db.execute("SELECT farm_id FROM farm where farm_name='"+farmName+"'");
        let [rows2, fields2] = await db.execute("SELECT store_id FROM store where store_name='"+storeName+"'");
        let farmId = rows1[0].farm_id;
        let storeId = rows2[0].store_id;
        
        //	UPDATE example SET name = "First" WHERE id =1;
        //edit MD table
        const [result1] = await db.execute('update md set md_name=?, md_weight=?, md_start=?, md_end=?, md_dd=?, md_maxqty=?, farm_id=? where md_id=?',
         [name, weight, start, end, dd, max, farmId ,MDID]);

        //edit payment table
        const [result2] = await db.execute('update payment set pay_price=?, pay_qty=?, pay_comp=?, pay_dc=?, pay_schedule=? where md_id=?',
         [price, 1, comp, dc, paySchedule, MDID ]);

        //edit pickup table
        const [result3] = await db.execute('update pickup set pu_start=?, pu_end=?, store_id=? where md_id=?',
         [puStart, puEnd, storeId ,MDID]);
        
        //edit stock table
        const [result4] = await db.execute('update stock set stk_goal=?, stk_remain=?, stk_total=?, stk_confirm=?, stk_max=? where md_id=?',
         [goal, 1, 2, 0, stkMax, MDID ]);
        
        console.log('insert 완료');
    }
    catch(err){
        console.log(err);
        res.send( "server error");
    }
})

module.exports = app;