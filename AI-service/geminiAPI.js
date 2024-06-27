const { GoogleGenerativeAI } = require("@google/generative-ai");
// const { testing } = require("googleapis/build/src/apis/testing");
require('dotenv').config();


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model  = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

async function getLabelFunction(content) {
    const prompt = `
    Analyze the following email content and categorize it as one of the following:
    1. Interested
    2. Not Interested
    3. More Information

    give only one option text in reply

    Email content:
    ${content.toString()}

    Category:
  `;
  
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // console.log(text);
    return text;
  }
  
async function getReplyFunction(category, content){
    const prompt = `
    Generate an appropriate response for an email with the following category and content:
    Category: ${category}
    Content: ${content}


    it reply from your side should contain only the email reply content. 

    Response:
  `;
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  // console.log(text);

  return text;
}


module.exports ={
  getLabelFunction,
  getReplyFunction
}