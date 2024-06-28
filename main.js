const { producer } = require("./bullMQ/producer");
const { startWorker } = require("./bullMQ/worker");
const prompt = require('prompt-sync')();

async function main() {
    const val = prompt("choose one option, Press Enter:- \n 1:- Start service on email which from Now \n 2:- Start service previour email as well \n ")
    if(val == 2 || val == 1){
    setTimeout(async () => {
      const verify = await producer(val);
      if(!verify){
        console.log("No emails");
        return;
      }
      await startWorker()
    },15000);
  }else{
    console.log("invalid Input :- ", val)
  }
}
  
main().catch(console.error);