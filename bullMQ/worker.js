const { Worker } = require('bullmq');
const { sendEmail, authorize, setLabels } = require('../emailServices/gmailAPI');
const { getLabelFunction, getReplyFunction } = require('../AI-service/geminiAPI');

async function startWorker() {
  let auth;
  const worker = new Worker("email-queue", async (job) => {
    try {
      auth = await authorize(); 
      if (job.data.email) {
        console.log(`Message received with ID ${job.id}`);
        const label = (await getLabelFunction(job.data.body)).toUpperCase().trim();
        console.log("Label generated", label);
        const reply = await getReplyFunction(label, job.data.body);
        console.log("Reply also generated");
        console.log(job.data.msgId);
        await setLabels(auth, job.data.msgId, [label.toUpperCase()], []);
        console.log("Label set successfully");
        console.log(`Sending email to ${job.data.email}`);
        await sendEmail(auth,
          `To: ${job.data.email}\r\n` +
          `Subject: Re: ${job.data.subject}\r\n` +
          `Content-Type: text/plain; charset=utf-8\r\n` +
          `\r\n` +
          `${reply}`
        );
        console.log("Email sent");
      }
    } catch (err) {
      console.error(`Error processing job ${job.id}:`, err);
      throw err;
    }
  }, {
    connection: {
      host: "127.0.0.1",
      port: 6379
    }
  });

  worker.on('completed', job => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.log(`Job ${job.id} failed with error: ${err.message}`);
  });
}

module.exports = { startWorker };
