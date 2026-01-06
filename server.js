const express = require('express');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(express.static('public'));

function loadKeys(){
  try{
    return JSON.parse(fs.readFileSync('config/key.json')).allowedKeys;
  }catch(e){ return []; }
}

function getRoundIndex(){
  const now = new Date();
  // convert to IST offset 5:30
  const ist = new Date(now.getTime() + (330*60*1000));
  const reset = new Date(ist);
  reset.setHours(5,30,0,0);

  if(ist < reset){
    reset.setDate(reset.getDate()-1);
  }
  const diff = Math.floor((ist - reset)/60000);
  return diff;
}

function createPeriod(){
  const d = new Date(Date.now() + (330*60*1000));
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return y + m + day + '10001';
}

function prngDigit(){
  const period = createPeriod();
  const round = getRoundIndex();
  const seed = crypto.createHash('md5').update(period + round).digest('hex');
  const num = parseInt(seed.replace(/[^0-9]/g,'').slice(0,6));
  const rng = new Math.seedrandom(num);
  return Math.floor(rng()*10);
}

app.post('/validate',(req,res)=>{
  const {key, uid} = req.body;
  const keys = loadKeys();

  if(!keys.includes(key)){
    return res.status(401).json({ok:false});
  }

  res.json({ok:true, token: crypto.randomBytes(16).toString('hex')});
});

app.get('/result',(req,res)=>{
  res.json({
    digit: prngDigit(),
    round: getRoundIndex(),
    period: createPeriod(),
    time: new Date(Date.now() + (330*60*1000))
  });
});

app.listen(3000,()=>console.log('SERVER READY'));
