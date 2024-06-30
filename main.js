const { producer } = require("./bullMQ/producer");
const { startWorker } = require("./bullMQ/worker");
const prompt = require('prompt-sync')();
const starter = async (val) => {
  // console.log("setinterval");
  const verify = await producer(val);
  if(!verify){
    console.log("No emails");
    return;
  }
  await startWorker()
}
async function main() {
    const val = prompt("choose one option, Press Enter:- \n 1:- Start service on emails which recieved in last 15 minutes and onwards \n 2:- Start service on all previous emails \n ")
    if(val == 2 || val == 1){
      await  starter(val);
    setInterval(async () => {
      await starter(val);
    },900000);
  }else{
    console.log("invalid Input :- ", val)
  }
}
  
main().catch(console.error);