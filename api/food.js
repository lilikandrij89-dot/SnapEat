// Serverless function для Vercel
export default async function handler(req, res) {
  const { query } = req.query;
  
  const CLIENT_ID = process.env.VITE_FATSECRET_CLIENT_ID;
  const CLIENT_SECRET = process.env.VITE_FATSECRET_CLIENT_SECRET;

  try {
    // 1. Получаем токен от FatSecret
    const authRes = await fetch("https://oauth.fatsecret.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      },
      body: "grant_type=client_credentials&scope=basic",
    });
    const { access_token } = await authRes.json();

    // 2. Ищем еду
    const searchRes = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(query)}&format=json`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );
    const data = await searchRes.json();

    // 3. Возвращаем результат в приложение
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
}