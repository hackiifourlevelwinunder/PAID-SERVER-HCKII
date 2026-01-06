const express = require('express');
const fs = require('fs');

const app = express();
app.use(express.json());
app.use(express.static('public'));

/* ---- LOAD ONLY KEY FILE ---- */
function loadKeys(){
  try{
    return JSON.parse(fs.readFileSync('config/key.json','utf-8')).allowedKeys;
  }catch(e){
    return [];
  }
}

/* ---- IST TIME FUNCTION ---- */
function getIST(){
  const now = new Date();
  return new Date(now.getTime() + 330*60*1000);
}

/* ---- MINUTE COUNT FROM 5:30 RESET ---- */
function currentMinuteFromReset(){

  const ist = getIST();

  let reset = new Date(ist);
  reset.setHours(5,30,0,0);

  /* agar 5:30 se pehle h → yesterday reset */
  if(ist < reset){
    reset.setDate(reset.getDate()-1);
  }

  const diffMinute =
     Math.floor((ist - reset)/60000);

  return diffMinute;       // 0,1,2,3...
}

/* ---- PERIOD MINUTE = town hall rule ---- */
function displayPeriodMinute(){

  const minute = currentMinuteFromReset();

  return minute + 1;      // MOST IMPORTANT +1
}

/* ---- CREATE BASE PERIOD YYYYMMDD10001 ---- */
function createBasePeriod(){

 const d = getIST();

 const y = d.getFullYear();
 const m = String(d.getMonth()+1).padStart(2,'0');
 const day = String(d.getDate()).padStart(2,'0');

 return y + m + day + "10001";
}

/* ---- FINAL PERIOD FULL ---- */
function finalPeriod(){

  const base = createBasePeriod();
  const pMinute =
       String(displayPeriodMinute()).padStart(4,'0');

  return base + pMinute;
}

/* ---- PRNG DIGIT DETERMINISTIC ---- */
function prngDigit(){

  const seed = finalPeriod();

  let h = 0;
  for(let i=0;i<seed.length;i++){
    h += seed.charCodeAt(i);
  }

  const r = Math.sin(h)*9999;

  return Math.floor(Math.abs(r)%10);
}

/* ---- LOGIN VALIDATION ---- */
app.post('/validate',(req,res)=>{

 const {uid, key} = req.body;
 const keys = loadKeys();

 if(!keys.includes(key)){
   return res.status(401).json({ok:false});
 }

 res.json({ok:true});
});

/* ---- RESULT API ---- */
app.get('/result',(req,res)=>{

 const ist = getIST();

 res.json({
   digit: prngDigit(),
   wallClock: ist.toLocaleTimeString(),
   date: ist.toLocaleDateString(),
   period: finalPeriod(),
   periodMinute: displayPeriodMinute(),
   seconds: ist.getSeconds()
 });

});

app.listen(3000,
 ()=>console.log('INDIA IST SERVER READY 5:30 RESET'));
