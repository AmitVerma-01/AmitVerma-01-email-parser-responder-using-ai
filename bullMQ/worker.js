const { Worker } = require('bullmq')


const sendEmail = () => new Promise((resolve) => setTimeout(resolve, 5000));

const worker = new Worker("email-queue", async (job)=>{
    try {
        console.log(`Message received with ID ${job.id}`);
        console.log(`Processing message`);
        console.log(`Sending email to ${job.data.email}`); // Assuming job.data contains an email field
        await sendEmail();
        console.log("Email sent");
    } catch (err) {
        console.error(`Error processing job ${job.id}:`, err);
        throw err; 
    }
},{
    connection : {
        host : "127.0.0.1",
        port : 6379
    }
})
worker.on('completed', job => {
    console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed with error: ${err.message}`);
});
