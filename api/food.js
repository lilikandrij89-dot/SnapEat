// api/food.js
export default async function handler(req, res) {
  // Добавляем CORS заголовки на всякий случай
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "No query provided" });
  }

  try {
    // Используем OpenFoodFacts (ключи не нужны)
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`OpenFoodFacts responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Форматируем данные так, чтобы твой фронтенд их понял
    const results = (data.products || []).map(p => ({
      food: {
        foodId: p.code || Math.random().toString(),
        label: p.product_name || p.product_name_ru || p.product_name_en || "Unknown Product",
        nutrients: {
          ENERC_KCAL: p.nutriments?.["energy-kcal_100g"] || p.nutriments?.["energy-kcal"] || 0
        },
        image: p.image_front_url || p.image_url || ""
      }
    }));

    return res.status(200).json(results);

  } catch (error) {
    console.error("Server Error:", error.message);
    return res.status(500).json({ error: "Server Error", details: error.message });
  }
}
