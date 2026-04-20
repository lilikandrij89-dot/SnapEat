// api/food.js
export default async function handler(req, res) {
  const { query } = req.query;
  const searchQuery = query ? query.toLowerCase() : "";

  // Временная база данных прямо в коде
  const mockDatabase = [
    { id: "1", name: "Куриное филе", kcal: 165, img: "https://открытый-источник.рф/chicken.jpg" },
    { id: "2", name: "Яблоко красное", kcal: 52, img: "" },
    { id: "3", name: "Гречневая каша", kcal: 132, img: "" },
    { id: "4", name: "Творог 5%", kcal: 121, img: "" },
    { id: "5", name: "Банан", kcal: 89, img: "" },
    { id: "6", name: "Яйцо вареное", kcal: 155, img: "" },
    { id: "7", name: "Овсянка", kcal: 68, img: "" },
    { id: "8", name: "Chicken Breast", kcal: 165, img: "" },
    { id: "9", name: "Apple", kcal: 52, img: "" }
  ];

  // Фильтруем список по твоему запросу
  const filtered = mockDatabase.filter(item => 
    item.name.toLowerCase().includes(searchQuery)
  );

  // Форматируем под структуру, которую ждет твой фронтенд
  const results = filtered.map(item => ({
    food: {
      foodId: item.id,
      label: item.name,
      nutrients: { ENERC_KCAL: item.kcal },
      image: item.img
    }
  }));

  // Имитируем задержку сети (0.5 сек) и отдаем результат
  setTimeout(() => {
    res.status(200).json(results);
  }, 500);
}
