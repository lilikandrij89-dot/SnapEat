
export default async function handler(req, res) {
  const { query } = req.query;
  const appId = process.env.EDAMAM_APP_ID;
  const apiKey = process.env.EDAMAM_APP_KEY;

  if (!query) return res.status(400).json({ error: "No query" });

  try {
    // Edamam API запрос
    const response = await fetch(
      `https://api.edamam.com/api/food-database/v2/parser?app_id=${appId}&app_key=${apiKey}&ingr=${encodeURIComponent(query)}&nutrition-type=logging`
    );

    const data = await response.json();
    
    // Возвращаем "hints" — это список найденных продуктов
    res.status(200).json(data.hints || []);
  } catch (error) {
    console.error("Edamam Error:", error);
    res.status(500).json({ error: error.message });
  }
}
