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
  if (!query || query.length < 2) return [];

  try {
    // Стучимся в наш "мостик", который мы создали в api/food.js
    const response = await fetch(`/api/food?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    
    // FatSecret возвращает либо массив, либо один объект, либо ничего.
    // Обрабатываем все случаи, чтобы всегда возвращать массив.
    const foodResults = data.foods?.food || [];
    return Array.isArray(foodResults) ? foodResults : [foodResults];
    
  } catch (error) {
    console.error('FatSecret Search Error (via API):', error);
    return [];
  }
};