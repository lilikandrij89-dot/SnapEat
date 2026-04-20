export default async function handler(req, res) {
  const { query } = req.query;

  // ВСТАВЬ СВОИ КЛЮЧИ СЮДА ПРЯМО ТЕКСТОМ ДЛЯ ПРОВЕРКИ
  const appId = "1fb00675"; 
  const apiKey = "8b6eb41b1a47542ae8d5ad8705e1cff2";

  try {
    const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${appId}&app_key=${apiKey}&ingr=${encodeURIComponent(query)}&nutrition-type=logging`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: "Edamam всё еще не пускает", details: errorText });
    }

    const data = await response.json();
    res.status(200).json(data.hints || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
