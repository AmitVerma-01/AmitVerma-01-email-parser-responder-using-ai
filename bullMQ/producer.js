const { Queue } = require('bullmq')
const { getAllEmails , authorize, getEmailsReceivedLast15Minutes, ensureLabels } = require('../emailServices/gmailAPI');
const { getEmailsWithDetails } = require('../services/service');
const emailQueue = new Queue("email-queue",{
    connection : {
        port : 6379,
        host : "127.0.0.1"
    }
})

let emails = []
let auth ;


async function addEmails(email,subject,body,msgId){
    const res = await emailQueue.add("email to the user" , {
        email,
        subject,
        body,
        msgId
    })
    console.log("job is added with id :- ", res.id);
}


const producer = async (val)=>{
    try{
    auth = await authorize();
    await ensureLabels(auth);
    emails = val == 2 ? await getAllEmails(auth) : await getEmailsReceivedLast15Minutes(auth) ;
    // console.log("pro ");
    const emailsWithDetails = await getEmailsWithDetails(emails)
    if(!emailsWithDetails){
        return 0;
    }
    for(const email of emailsWithDetails){
        if(email.email)
       await addEmails(email.email, email.subject,email.body, email.msgId)
    }
    return 1;
} catch(error){
    console.error("Error in producer:", error);
}
}
module.exports ={
    producer
}