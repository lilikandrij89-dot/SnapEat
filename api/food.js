// api/food.js
export default async function handler(req, res) {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "No query" });

  try {
    // Добавляем параметры региона (ua) и языков (ru,uk)
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&cc=ua&lc=ru`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'BalanseApp/1.0' }
    });
    const data = await response.json();

    const results = (data.products || []).map(p => ({
      food: {
        foodId: p.code || Math.random().toString(),
        // Проверяем все варианты названий
        label: p.product_name_ru || p.product_name_uk || p.product_name || "Продукт",
        nutrients: {
          ENERC_KCAL: p.nutriments?.["energy-kcal_100g"] || p.nutriments?.["energy-kcal"] || 0
        },
        // Берем маленькое превью (thumb), оно грузится быстрее
        image: p.image_front_small_url || p.image_small_url || p.image_url || ""
      }
    }));

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
