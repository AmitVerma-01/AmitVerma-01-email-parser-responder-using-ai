const { getAllEmails, readEmail , authorize, sendEmail } = require("./emailServices/gmailAPI");
const { getLabelFunction, getReplyFunction } = require("./AI-service/geminiAPI");

async function main() {
    const auth = await authorize();
  
    const messageId = '19059263ca321626';

    const email = await readEmail(auth, messageId);
    const content = email.body;

    const label =  await getLabelFunction(content);
    console.log(label);
    const replyMail = await getReplyFunction(label,content)

    console.log(replyMail);

    const replyResponse = await sendEmail(auth, {
      to: 'amitvermax7390@gmail.com',
      subject: 'Hello',
      text: replyMail
    }
    );
    console.log(replyResponse);
  }
  
  main().catch(console.error);