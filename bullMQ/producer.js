const { Queue } = require('bullmq')

const emailQueue = new Queue("email-queue",{
    connection : {
        port : 6379,
        host : "127.0.0.1"
    }
})

async function addEmails(){
    const res = await emailQueue.add("email to the user" , {
        email : "amitvermaup57@gmail.com",
        subject : "hello this test is done by bullMQ",
        body : "this this an ai generated email"
    })
    console.log("job is added with id :- ", res.id);
}

addEmails()