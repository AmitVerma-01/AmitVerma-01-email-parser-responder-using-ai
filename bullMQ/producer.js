const { Queue } = require('bullmq')
const { getAllEmails , authorize, readEmail,  addLabels, getEmailsReceivedLast15Minutes } = require('../emailServices/gmailAPI')
const emailQueue = new Queue("email-queue",{
    connection : {
        port : 6379,
        host : "127.0.0.1"
    }
})

let emails = []
let auth ;


function extractEmail(headerValue) {
    const emailRegex = /<([^>]+)>/;
    const match = headerValue.match(emailRegex);
    if (match) {
      return match[1];
    }
    return null;
}

let emailsWithDetails = []
const getEmailsWithDetails = async ( emails ) =>{
    for(let i=0 ;i<emails.length ;i++){
        {let subject,email;
        let res = await readEmail( auth , emails[i].id )
        const body = res.body;
        const msgId = res.id;
        res.headers.forEach((e) => {
            if(e.name === 'Subject') subject = e.value;
            if(e.name === 'From') email = extractEmail(e.value)
        })
        emailsWithDetails.push({
            email,
            subject,
            body,
            msgId
        })}
    }
}


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
    emails = val == 2 ? await getAllEmails(auth) : await getEmailsReceivedLast15Minutes(auth) ;
    await getEmailsWithDetails(emails)
    for(const email of emailsWithDetails){
        if(email.email)
       await addEmails(email.email, email.subject,email.body, email.msgId)
    }
} catch(error){
    console.error("Error in producer:", error);
}
}
module.exports ={
    producer
}