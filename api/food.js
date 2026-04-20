// api/food.js
export default async function handler(req, res) {
  const { query } = req.query;

  if (!query) return res.status(400).json({ error: "No query" });

  try {
    // Используем глобальный поиск Open Food Facts
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`,
      {
        headers: {
          'User-Agent': 'BalanseApp - Web - Version 1.0' // OFF просит указывать User-Agent
        }
      }
    );

    const text = await response.text();
    
    // Проверяем, пришел ли нам JSON или HTML-мусор
    if (text.trim().startsWith('<!DOCTYPE')) {
      return res.status(503).json({ error: "База данных временно перегружена. Попробуй через минуту." });
    }

    const data = JSON.parse(text);

    // Маппим данные под твой фронтенд
    const results = (data.products || []).map(p => ({
      food: {
        foodId: p.code || Math.random().toString(),
        label: p.product_name || p.product_name_ru || p.product_name_uk || "Продукт",
        nutrients: {
          ENERC_KCAL: p.nutriments?.["energy-kcal_100g"] || p.nutriments?.["energy-kcal"] || 0
        },
        image: p.image_front_url || p.image_url || ""
      }
    }));

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: "Ошибка сервера", details: error.message });
  }
}
