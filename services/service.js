const { readEmail, authorize } = require("../emailServices/gmailAPI");

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
    const auth = await authorize();
    console.log("ext1");
    if(emails.length === 0 ) {
        console.log("extract emails",emails.length);
        return 0;
    }
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
    return emailsWithDetails;
}

module.exports = {
    getEmailsWithDetails
}