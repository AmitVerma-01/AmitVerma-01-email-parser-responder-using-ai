const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const { authenticate } = require('@google-cloud/local-auth');
const { google } = require('googleapis');


// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];


const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  const oAuth2Client = new google.auth.OAuth2(
    key.client_id,
    key.client_secret,
    key.redirect_uris
  )
  oAuth2Client.setCredentials({ refresh_token: client.credentials.refresh_token })
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

const REQUIRED_LABELS = ["INTERESTED", "NOT INTERESTED", "MORE INFORMATION"];

async function ensureLabels(auth) {
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    // Fetching existing labels
    const res = await gmail.users.labels.list({
      userId: 'me',
    });

    const existingLabels = res.data.labels.map(label => label.name);
    const missingLabels = REQUIRED_LABELS.filter(label => !existingLabels.includes(label));

    if (missingLabels.length === 0) {
      console.log('All required labels are already present.');
      return;
    }

    // Add missing labels
    const results = [];
    for (const labelName of missingLabels) {
      const request = {
        userId: 'me',
        requestBody: {
          name: labelName,
        },
      };

      try {
        const response = await gmail.users.labels.create(request);
        results.push(response.data);
        console.log(`Label created: ${labelName}`);
      } catch (error) {
        console.error(`Error creating label "${labelName}":`, error);
      }
    }

    return results;
  } catch (error) {
    console.error('Error retrieving labels:', error);
    throw error;
  }
}

async function addLabels(auth, labelNames) {
  const gmail = google.gmail({ version: 'v1', auth });

  const results = [];
  for (const labelName of labelNames) {
    const request = {
      userId: 'me',
      requestBody: {
        name: labelName
      }
    };

    try {
      const response = await gmail.users.labels.create(request);
      results.push(response.data);
      console.log(`Label created: ${labelName}`);
    } catch (error) {
      console.error(`Error creating label "${labelName}":`, error);
    }
  }

  return results;
}
async function sendEmail(auth, content) {
  const gmail = google.gmail({ version: 'v1', auth });

  const encodedMessage = Buffer.from(content)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, ''); // Escaped + character


  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage
    },
  });

  return res.data;

}

async function getLabelId(auth, labelName) {
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    const res = await gmail.users.labels.list({
      userId: 'me',
    });

    const labels = res.data.labels;
    const label = labels.find((lbl) => lbl.name === labelName);
    if (label) {
      return label.id;
    } else {
      throw new Error(`Label "${labelName}" not found`);
    }
  } catch (error) {
    console.error('Error retrieving labels:', error);
    throw error;
  }
} 
async function setLabels(auth, messageId, labelsToAdd, labelsToRemove = []) {
  const gmail = google.gmail({ version: 'v1', auth });

  // Convert label names to label IDs
  const addLabelIds = [];
  for (const labelName of labelsToAdd) {
    try {
      const labelId = await getLabelId(auth, labelName);
      addLabelIds.push(labelId);
    } catch (error) {
      console.error(`Error finding label ID for "${labelName}":`, error);
    }
  }

  const removeLabelIds = [];
  for (const labelName of labelsToRemove) {
    try {
      const labelId = await getLabelId(auth, labelName);
      removeLabelIds.push(labelId);
    } catch (error) {
      console.error(`Error finding label ID for "${labelName}":`, error);
    }
  }

  try {
    const res = await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds,
        removeLabelIds,
      },
    });

    console.log('Labels updated:', res.data);
    return res.data;
  } catch (error) {
    console.error('Error updating labels:', error);
    throw error;
  }
}


async function getAllEmails(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  let emails = [];
  let nextPageToken = null;

  const res = await gmail.users.messages.list({
    userId: 'me',
    maxResults: 20,
    pageToken: nextPageToken,
  });

  if (res.data.messages && res.data.messages.length > 0) {
    emails = emails.concat(res.data.messages);
  }
  nextPageToken = res.data.nextPageToken;

  return emails
}
async function readEmail(auth, messageId) {
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    const res = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
    });

    const emailData = res.data;
    const headers = emailData.payload.headers;
    let body = '';

    // Extracting the email body from the payload parts
    if (emailData.payload.parts) {
      for (const part of emailData.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        } else if (part.mimeType === 'text/html' && part.body.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        } else if (part.parts && part.parts[0] && part.parts[0].body.data) {
          body = Buffer.from(part.parts[0].body.data, 'base64').toString('utf-8');
          break;
        }
      }
    } else if (emailData.payload.body.data) {
      body = Buffer.from(emailData.payload.body.data, 'base64').toString('utf-8');
    }

    return {
      id: emailData.id,
      headers,
      body,
    };
  } catch (error) {
    console.error('Error reading email:', error);
    throw error;
  }
}

async function getEmailsReceivedLast15Minutes(auth) {
  const gmail = google.gmail({ version: 'v1', auth });

  // Calculate the timestamp for 15 minutes ago
  const fiveMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const fiveMinutesAgoTimestamp = Math.floor(fiveMinutesAgo.getTime() / 1000);

  // Construct the query to fetch emails received in the last 15 minutes
  const query = `after:${fiveMinutesAgoTimestamp}`;

  // Fetching emails which recieved in last 15Minutes
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: query,
  });
  console.log(res.data.resultSizeEstimate);
  if(res.data.resultSizeEstimate === 0){
    return [];
  }

  const messageIds = res.data.messages.map(message => message.id);

  const emails = [];
  for (const messageId of messageIds) {
    const email = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
    });

    // Extracting relevant information from the email
    const headers = email.data.payload.headers;
    let body = '';


    // console.log(email)

    if (email.data.payload.parts) {
      for (const part of email.data.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        } else if (part.mimeType === 'text/html' && part.body.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        }
        // else  body = Buffer.from(part.parts[0].body.data, 'base64').toString('utf-8');
      }
    } else if (email.data.payload.body.data) {
      body = Buffer.from(email.data.payload.body.data, 'base64').toString('utf-8');
    }


    emails.push({
      id: email.data.id,
      threadId: email.data.threadId,
      labelIds: email.data.labelIds,
      headers,
      body,
    });
  }
  console.log("emails");
  return emails;
}


module.exports = {
  getAllEmails,
  readEmail,
  authorize,
  setLabels,
  sendEmail,
  getEmailsReceivedLast15Minutes,
  addLabels,
  ensureLabels
}