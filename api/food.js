// api/food.js
export default async function handler(req, res) {
  const { query } = req.query;
  // Твои новые ключи со скрина
  const appId = "d489c93a"; 
  const apiKey = "1288d4a7c577bd7b092c2618b99451b8";

  if (!query) return res.status(400).json({ error: "No query" });

  try {
    // ПОПЫТКА №1: Edamam
    const edamamUrl = `https://api.edamam.com/api/food-database/v2/parser?app_id=${appId}&app_key=${apiKey}&ingr=${encodeURIComponent(query)}&nutrition-type=logging`;
    const edamamRes = await fetch(edamamUrl);

    if (edamamRes.ok) {
      const data = await edamamRes.json();
      const results = (data.hints || []).map(item => ({
        food: {
          foodId: item.food.foodId,
          label: item.food.label,
          nutrients: {
            ENERC_KCAL: Math.round(item.food.nutrients.ENERC_KCAL || 0),
            PROCNT: Math.round(item.food.nutrients.PROCNT || 0),
            FAT: Math.round(item.food.nutrients.FAT || 0),
            CHOCDF: Math.round(item.food.nutrients.CHOCDF || 0)
          },
          image: item.food.image || ""
        }
      }));
      return res.status(200).json(results);
    }

    // ПОПЫТКА №2: Если Edamam подвел (401/403), идем в OpenFoodFacts
    console.log("Edamam failed, switching to OpenFoodFacts...");
    const offUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`;
    const offRes = await fetch(offUrl, { headers: { 'User-Agent': 'BalanseApp/1.0' } });
    const offData = await offRes.json();

    const results = (offData.products || []).map(p => ({
      food: {
        foodId: p.code || Math.random().toString(),
        label: p.product_name_ru || p.product_name_uk || p.product_name || "Продукт",
        nutrients: {
          ENERC_KCAL: p.nutriments?.["energy-kcal_100g"] || 0,
          PROCNT: p.nutriments?.proteins_100g || 0,
          FAT: p.nutriments?.fat_100g || 0,
          CHOCDF: p.nutriments?.carbohydrates_100g || 0
        },
        image: p.image_front_small_url || p.image_url || ""
      }
    }));

    res.status(200).json(results);

  } catch (error) {
    res.status(500).json({ error: "All services failed", details: error.message });
  }
}
