// api/food.js

export default async function handler(req, res) {
  const { query } = req.query;
  const searchQuery = query ? query.toLowerCase() : "";

  // 1. Наша локальная мини-база (чтобы всегда был результат)
  const mockDatabase = [
    { id: "m1", name: "Куриное филе (грудка)", kcal: 113, img: "https://img.freepik.com/free-photo/raw-chicken-fillet_1339-3831.jpg" },
    { id: "m2", name: "Яблоко", kcal: 52, img: "https://img.freepik.com/free-photo/red-apple-isolated_144627-55.jpg" },
    { id: "m3", name: "Гречневая каша (вареная)", kcal: 110, img: "" },
    { id: "m4", name: "Яйцо куриное (1 шт)", kcal: 155, img: "" },
    { id: "m5", name: "Банан", kcal: 89, img: "" },
    { id: "m6", name: "Творог 5%", kcal: 121, img: "" },
    { id: "m7", name: "Рис белый", kcal: 130, img: "" },
    { id: "m8", name: "Овсянка на воде", kcal: 68, img: "" }
  ];

  try {
    // 2. Пробуем достучаться до реальной базы (OpenFoodFacts)
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`,
      { headers: { 'User-Agent': 'BalanseApp/1.0' } }
    );

    const text = await response.text();
    
    // Если пришел нормальный JSON (не ошибка 503)
    if (response.ok && !text.trim().startsWith('<!DOCTYPE')) {
      const data = JSON.parse(text);
      if (data.products && data.products.length > 0) {
        const realResults = data.products.map(p => ({
          food: {
            foodId: p.code || Math.random().toString(),
            label: p.product_name_ru || p.product_name || p.product_name_uk || "Продукт",
            nutrients: { ENERC_KCAL: p.nutriments?.["energy-kcal_100g"] || 0 },
            image: p.image_front_url || p.image_url || ""
          }
        }));
        return res.status(200).json(realResults);
      }
    }

    // 3. Если база лежит или ничего не нашла — используем локальный поиск
    const filteredMock = mockDatabase.filter(item => 
      item.name.toLowerCase().includes(searchQuery)
    );

    const mockResults = filteredMock.map(item => ({
      food: {
        foodId: item.id,
        label: item.name,
        nutrients: { ENERC_KCAL: item.kcal },
        image: item.img
      }
    }));

    return res.status(200).json(mockResults);

  } catch (error) {
    // Если всё совсем плохо — отдаем пустой массив, но не ошибку 500
    res.status(200).json([]);
  }
}
