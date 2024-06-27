const { getAllEmails, readEmail , authorize, sendEmail, getEmailsReceivedLast15Minutes } = require("./emailServices/gmailAPI");
const { getLabelFunction, getReplyFunction } = require("./AI-service/geminiAPI");

async function main() {
 
    const replyResponse = await sendEmail(auth,
      `To: ${recipentEmail}\r\n` +
      `Subject: Re: ${subject}\r\n` +
      `Content-Type: text/plain; charset=utf-8\r\n` +
      `\r\n` +
      `${replyMail}`
    );
    
  }
  
  main().catch(console.error);