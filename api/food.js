export default async function handler(req, res) {
  const { query } = req.query;

  if (!query) return res.status(400).json({ error: "No query" });

  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`;
    
    const response = await fetch(url);
    const data = await response.json();

    // Маппим данные под твой интерфейс
    const results = (data.products || []).map(p => ({
      food: {
        foodId: p.code || Math.random().toString(),
        label: p.product_name || p.product_name_ru || "Продукт",
        nutrients: {
          ENERC_KCAL: p.nutriments?.["energy-kcal_100g"] || 0
        },
        image: p.image_front_url || ""
      }
    }));

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
