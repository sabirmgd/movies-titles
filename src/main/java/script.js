/**
 * Note:
 * This script is used to fix the navitaire agent is pointing to different person that the corresponding SSO user points to.
 * Reference: https://airasia.atlassian.net/wiki/spaces/~323154524/pages/2625045914/SSO-2815+Fix+SSO+user+and+navitaire+agent+is+pointing+to+different+persons
 *
 * Steps-
 * 1. Get a csv file containing the list of users having miss match, with 'sso id' and 'sso username'.
 * 2. Add the csv file into the same directory as this file with name data.csv or as override.
 * 3. Run this file in a GCP VM instance (for high numbers) or run locally (for less entries).
 */

const {
  ACTIVATIONS_PER_INTERVAL = 1,
  INTERVAL_BETWEEN_ACTIVATIONS_IN_MILLISECONDS = 2500,
  CHUNK_SIZE = 200,
  ADMIN_EMAIL = 'sso_singapod@airasia.com',
  ADMIN_PASSWORD,
  NAVITAIRE_USERNAME = 'TOPSSOPRD',
  NAVITAIRE_DOMAIN = 'TOP',
  NAVITAIRE_PASSWORD,
  ORIGIN = 'https://www.airasia.com',
  SSO_BASE_URL = 'https://ssor.airasia.com',
  NAVITAIRE_BASE_URL = 'https://dotrez-proxy.airasia.com/api/nsk',
  FILENAME = 'data',
  USERS_COLLECTION = 'users',
} = process.env;

const fs = require('fs');
const axios = require('axios');
const pThrottle = require('p-throttle');
const parser = require('csv-parser');
const admin = require('firebase-admin');
const { HEADERS } = require('../src/const');
const FirebaseAdmin = require('../src/helpers/FirebaseConfig');

const csvFile = `one-off-scripts/${FILENAME}.csv`;
const db = FirebaseAdmin.firestore();

const throttle = pThrottle({
  limit: ACTIVATIONS_PER_INTERVAL,
  interval: INTERVAL_BETWEEN_ACTIVATIONS_IN_MILLISECONDS,
});

const throttledActivation = throttle(
  async (client, admin, navitaireToken, userId) => {
    try {
      console.log(`Starting clean up for user with ID ${userId}`);
      const user = await getUser(client, admin, userId);
      const agents = await findAgent(navitaireToken, user.username);
      if (!agents.length) {
        console.log('Could not find agent with the email');
        return;
      }
      const agentKey = agents[0].userKey;
      const existingAgent = await getAgent(navitaireToken, agentKey);
      await markAgentAsTerminated(navitaireToken, existingAgent);
      await removeNavitaireDetailsFromSso(client, admin, user.id);
      await initiateUserNavitaireActivation(client, admin, user.id);
    } catch (error) {
      console.error(
        `Failed to initiate activation for user ${userId}`,
        error.response.data
      );
    }
  }
);

async function main() {
  console.log(
    'One-off fix navitaire agent person pointing issue script is starting...'
  );
  const usersToBeActivated = await getCsvData(csvFile);
  let cursorStart = 0;
  let cursorEnd = CHUNK_SIZE;
  printConfigurations();
  console.log(
    `Number of users to initiate activation:  ${usersToBeActivated.length}`
  );

  do {
    const client = await getClientCredentials();
    const admin = await getAdminCredentials(client);
    const navitaireToken = await getNavitaireToken();
    const chunk = usersToBeActivated.slice(cursorStart, cursorEnd);

    for (const entry of chunk) {
      await throttledActivation(client, admin, navitaireToken, entry.userId);
    }

    cursorStart = cursorEnd;
    cursorEnd += CHUNK_SIZE;
  } while (cursorEnd < usersToBeActivated.length + CHUNK_SIZE);
}

main().then(() => {
  console.log(
    'One-off fix navitaire agent person pointing issue script has ended...'
  );
});

function printConfigurations() {
  console.log('----SCRIPT CONFIGURATIONS----');
  console.log('ACTIVATIONS_PER_INTERVAL: ', ACTIVATIONS_PER_INTERVAL);
  console.log(
    'INTERVAL_BETWEEN_ACTIVATIONS_IN_MILLISECONDS: ',
    INTERVAL_BETWEEN_ACTIVATIONS_IN_MILLISECONDS
  );
  console.log('CHUNK_SIZE: ', CHUNK_SIZE);
  console.log('ADMIN_EMAIL: ', ADMIN_EMAIL);
  console.log('ORIGIN: ', ORIGIN);
  console.log('SSO_BASE_URL: ', SSO_BASE_URL);
  console.log('-----------------------------');
}

function getCsvData(filename) {
  console.log('Reading data from CSV file...');
  const users = [];
  return new Promise((resolve) => {
    fs.createReadStream(filename)
      .pipe(parser())
      .on('data', (data) => users.push(data))
      .on('end', () => {
        resolve(users);
      });
  });
}

async function getClientCredentials() {
  try {
    const url = `${SSO_BASE_URL}/config/v2/clients/by-origin`;
    const headers = {
      [HEADERS.ORIGIN]: ORIGIN,
    };

    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error(
      'oneOffActivationScript.getClientCredentials',
      error.response.data
    );
    throw error;
  }
}

async function getAdminCredentials(client) {
  try {
    const payload = {
      username: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    };
    const headers = {
      [HEADERS.API_KEY]: client.apiKey,
    };
    const params = { clientId: client.id };
    const url = `${SSO_BASE_URL}/sso/v2/authorization/admin/by-credentials`;

    const response = await axios.post(url, payload, { headers, params });
    return response.data;
  } catch (error) {
    console.error(
      'oneOffActivationScript.getAdminCredentials',
      error.response.data
    );
    throw error;
  }
}

async function getNavitaireToken() {
  try {
    const payload = {
      credentials: {
        username: NAVITAIRE_USERNAME,
        password: NAVITAIRE_PASSWORD,
        domain: NAVITAIRE_DOMAIN,
      },
    };
    const url = `${NAVITAIRE_BASE_URL}/v1/token`;

    const response = await axios.post(url, payload, {});
    return response.data.data.token;
  } catch (error) {
    console.error(
      'oneOffActivationScript.getAdminCredentials',
      error.response.data
    );
    throw error;
  }
}

async function getUser(client, adminCredentials, userId) {
  const headers = {
    [HEADERS.API_KEY]: client.apiKey,
    [HEADERS.CLIENT_ID]: client.id,
    [HEADERS.AUTHORIZATION]: adminCredentials.accessToken,
  };
  const url = `${SSO_BASE_URL}/um/v2/admin/users/byId/${userId}`;
  const response = await axios.get(url, { headers });
  return response.data;
}

async function removeNavitaireDetailsFromSso(client, adminCredentials, userId) {
  const ref = db.collection(USERS_COLLECTION).doc(userId);
  await ref.set(
    {
      navitairePersonId: admin.firestore.FieldValue.delete(),
      navitaireCustomerNumber: admin.firestore.FieldValue.delete(),
      navitaireRegistrationCompletedAt: null,
    },
    { merge: true }
  );
}

async function initiateUserNavitaireActivation(
  client,
  adminCredentials,
  userId
) {
  console.log(`Initiating activation for user ${userId}`);
  const headers = {
    [HEADERS.API_KEY]: client.apiKey,
    [HEADERS.CLIENT_ID]: client.id,
    [HEADERS.AUTHORIZATION]: adminCredentials.accessToken,
  };
  const url = `${SSO_BASE_URL}/um/v2/admin/users/${userId}/activate-navitaire`;
  await axios.post(url, {}, { headers });
}

async function findAgent(navitaireToken, username) {
  console.log(`Finding agent details with email ${username}`);
  const headers = {
    [HEADERS.AUTHORIZATION]: navitaireToken,
  };
  const params = {
    Username: username,
    UsernameMatching: 'ExactMatch',
    DomainCode: 'WWW',
    OrganizationCode: 'AK',
    RoleCode: 'WWWM',
    Status: 'Default',
  };
  const url = `${NAVITAIRE_BASE_URL}/v2/users`;
  const response = await axios.get(url, { headers, params });
  return response.data.data;
}

async function getAgent(navitaireToken, agentKey) {
  console.log(`Getting agent details with key ${agentKey}`);
  const headers = {
    [HEADERS.AUTHORIZATION]: navitaireToken,
  };
  const url = `${NAVITAIRE_BASE_URL}/v1/users/${agentKey}`;
  const response = await axios.get(url, { headers });
  return response.data.data;
}

async function markAgentAsTerminated(navitaireToken, agent) {
  console.log(`Marking agent terminated ${agent.userKey}`);
  const headers = {
    [HEADERS.AUTHORIZATION]: navitaireToken,
  };
  const url = `${NAVITAIRE_BASE_URL}/v1/users/${agent.userKey}`;
  const data = {
    ...agent,
    username: `${agent.username}.terminated.${Date.now()}`,
    status: 4, //Terminated
    terminationDate: new Date().toISOString(),
  };
  await axios.put(url, data, { headers });
}
