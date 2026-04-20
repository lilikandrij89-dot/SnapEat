// api/food.js
export default async function handler(req, res) {
  const { query } = req.query;

  if (!query) return res.status(400).json({ error: "No query" });

  try {
    // Используем альтернативный API, который сейчас стабилен
    const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=1fb00675&app_key=8b6eb41b1a47542ae8d5ad8705e1cff2&ingr=${encodeURIComponent(query)}&nutrition-type=logging`;
    
    const response = await fetch(url);
    
    if (response.status === 401 || response.status === 403) {
        // Если мои тестовые ключи выше сдохли, используем резервный OpenFoodFacts, но с другим зеркалом
        const offUrl = `https://uk.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`;
        const offRes = await fetch(offUrl);
        const offData = await offRes.json();
        
        const results = (offData.products || []).map(p => ({
            food: {
                foodId: p.code,
                label: p.product_name_uk || p.product_name || "Продукт",
                nutrients: { ENERC_KCAL: p.nutriments?.["energy-kcal_100g"] || 0 },
                image: p.image_url
            }
        }));
        return res.status(200).json(results);
    }

    const data = await response.json();
    res.status(200).json(data.hints || []);

  } catch (error) {
    res.status(500).json({ error: "All services busy", details: error.message });
  }
}
