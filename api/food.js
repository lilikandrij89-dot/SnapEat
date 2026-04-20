export default async function handler(req, res) {
  // 1. Получаем поисковое слово из параметров запроса
  const { query } = req.query;
  
  // 2. Берем ключи из переменных окружения Vercel (без VITE_ внутри API)
  const CLIENT_ID = process.env.VITE_FATSECRET_CLIENT_ID;
  const CLIENT_SECRET = process.env.VITE_FATSECRET_CLIENT_SECRET;

  if (!query) {
    return res.status(400).json({ error: "Параметр query обязателен" });
  }

  try {
    // 3. Авторизация (получаем access_token)
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
      return res.status(500).json({ error: "Не удалось получить токен FatSecret", details: tokenData });
    }

    // 4. Поиск продуктов (с поддержкой русского языка)
    const searchRes = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(query)}&format=json&region=RU&language=ru`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const data = await searchRes.json();

    // 5. Отправляем чистые данные обратно на фронтенд
    res.status(200).json(data);
  } catch (error) {
    console.error("Server API Error:", error);
    res.status(500).json({ error: "Ошибка сервера", message: error.message });
  }
}
