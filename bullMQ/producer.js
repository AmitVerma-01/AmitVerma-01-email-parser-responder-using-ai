const { Queue } = require('bullmq')
const { getAllEmails , authorize, readEmail } = require('../emailServices/gmailAPI')
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
        let subject,email;
        let res = await readEmail( auth , emails[i].id )
        const body = res.body;
        const labels = res.labelIds;
        res.headers.forEach((e) => {
            if(e.name === 'Subject') subject = e.value;
            if(e.name === 'From') email = extractEmail(e.value)
        })
        emailsWithDetails.push({
            email,
            subject,
            labels,
            body
        })
    }
}


async function addEmails(email,subject,body,labels){
    const res = await emailQueue.add("email to the user" , {
        email,
        subject,
        body,
        labels
    })
    console.log("job is added with id :- ", res.id);
}


const main = async ()=>{
    auth = await authorize();
    emails = await getAllEmails(auth);
    await getEmailsWithDetails(emails)
    emailsWithDetails.forEach((email) => {
        addEmails(email.email, email.subject,email.body, email.labels)
    })
}

main();