export default async function handler(req, res) {
  const { query } = req.query;
  const appId = process.env.EDAMAM_APP_ID;
  const apiKey = process.env.EDAMAM_APP_KEY;

  // Проверка: а есть ли ключи вообще?
  if (!appId || !apiKey) {
    return res.status(500).json({ error: "Ключи Edamam не найдены в переменных окружения Vercel!" });
  }

  try {
    const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${appId.trim()}&app_key=${apiKey.trim()}&ingr=${encodeURIComponent(query)}&nutrition-type=logging`;
    
    const response = await fetch(url);

    // Если Edamam прислал не 200 OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Edamam API Error Text:", errorText); // Это появится в логах Vercel
      return res.status(response.status).json({ error: "Edamam ответил ошибкой", details: errorText });
    }

    const data = await response.json();
    res.status(200).json(data.hints || []);
  } catch (error) {
    console.error("Server Crash:", error);
    res.status(500).json({ error: error.message });
  }
}
