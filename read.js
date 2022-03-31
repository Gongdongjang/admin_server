const express = require('express');
const app = express();
const db = require('./db');
const cors = require('cors');

app.use(cors());
app.use(express.json());

const cc = async () => {    
   try {
    let [rows, fields] = await db.execute("SELECT * FROM md");
    console.log(rows);
    } 
    catch (e) {
        console.log(error);
    }
};

app.get('/', async(req, res) => {
  
try {
  let [rows, fields] = await db.execute("SELECT * FROM md");
  //console.log(rows);
  res.send(rows);
  } 
  catch (e) {
      console.log(e);
  }

});
//cc();
module.exports = app;