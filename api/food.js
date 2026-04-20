export default async function handler(req, res) {
  const { query } = req.query;
  const appId = process.env.EDAMAM_APP_ID || "d489c93a";
  const apiKey = process.env.EDAMAM_APP_KEY || "1288d4a7c577bd7b092c2618b99451b8";

  if (!query) return res.status(400).json({ error: "No query" });

  try {
    const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${appId}&app_key=${apiKey}&ingr=${encodeURIComponent(query)}&nutrition-type=logging`;
    
    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).json({ error: "Key Error" });

    const data = await response.json();
    
    const results = (data.hints || []).map(item => ({
      food: {
        foodId: item.food.foodId,
        label: item.food.label,
        nutrients: {
          ENERC_KCAL: Math.round(item.food.nutrients.ENERC_KCAL || 0),
          PROCNT: Math.round(item.food.nutrients.PROCNT || 0), // Белки
          FAT: Math.round(item.food.nutrients.FAT || 0),       // Жиры
          CHOCDF: Math.round(item.food.nutrients.CHOCDF || 0)  // Углеводы
        },
        image: item.food.image || ""
      }
    }));

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
