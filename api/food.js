export default async function handler(req, res) {
  const { query } = req.query;
  const id = process.env.VITE_FATSECRET_CLIENT_ID;
  const secret = process.env.VITE_FATSECRET_CLIENT_SECRET;

  if (!query) return res.status(400).json({ error: "No query" });

  try {
    // 1. Получаем токен
    const authRes = await fetch("https://oauth.fatsecret.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      },
      body: "grant_type=client_credentials&scope=basic",
    });

    const tokenData = await authRes.json();
    const access_token = tokenData.access_token;

    // 2. Ищем еду
    const searchRes = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(query)}&format=json&region=RU&language=ru`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const data = await searchRes.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
