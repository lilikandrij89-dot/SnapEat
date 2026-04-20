const CLIENT_ID = import.meta.env.VITE_FATSECRET_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_FATSECRET_CLIENT_SECRET;

let accessToken = '';

const getAccessToken = async () => {
  const authDoc = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  try {
    const response = await fetch('https://corsproxy.io/?' + encodeURIComponent('https://oauth.fatsecret.com/connect/token'), {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authDoc}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials&scope=basic'
    });
    const data = await response.json();
    accessToken = data.access_token;
    return accessToken;
  } catch (error) {
    console.error('FatSecret Auth Error:', error);
  }
};

export const searchFood = async (query) => {
  if (!accessToken) await getAccessToken();

  const url = `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(query)}&format=json&language=ru`;

  try {
    const response = await fetch('https://corsproxy.io/?' + encodeURIComponent(url), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const data = await response.json();
    const foodResults = data.foods?.food || [];
    return Array.isArray(foodResults) ? foodResults : [foodResults];
  } catch (error) {
    console.error('FatSecret Search Error:', error);
    return [];
  }
};