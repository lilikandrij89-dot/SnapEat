export default async function handler(req, res) {
  // 1. Извлекаем поисковый запрос
  const { query } = req.query;
  
  // 2. Берем ключи из переменных окружения Vercel
  const CLIENT_ID = process.env.VITE_FATSECRET_CLIENT_ID;
  const CLIENT_SECRET = process.env.VITE_FATSECRET_CLIENT_SECRET;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    // 3. Авторизация в FatSecret (получаем токен)
    const authRes = await fetch("https://oauth.fatsecret.com/connect/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      },
      body: "grant_type=client_credentials&scope=basic",
    });

    const tokenData = await authRes.json();
    const access_token = tokenData.access_token;

    if (!access_token) {
      throw new Error("Failed to obtain access token");
    }

    // 4. Поиск продуктов (добавляем русский язык и регион)
    const searchRes = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(query)}&format=json&region=RU&language=ru`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const data = await searchRes.json();

    // 5. Отправляем результат обратно на фронтенд
    res.status(200).json(data);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: error.message });
  }
}
