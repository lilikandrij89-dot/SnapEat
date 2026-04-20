
export const searchFood = async (query) => {
  if (!query || query.length < 2) return [];

try {
    const response = await fetch(`/api/food?query=${encodeURIComponent(query)}`);
    
    // Если статус не 200, выводим текст ошибки в консоль
    if (!response.ok) {
        const errorHtml = await response.text(); 
        console.error("Сервер вернул не JSON, а это:", errorHtml);
        return [];
    }

    const hints = await response.json();
    return hints.map(item => ({
        food_id: item.food.foodId,
        food_name: item.food.label,
        food_description: `${Math.round(item.food.nutrients.ENERC_KCAL)} ккал / 100г`,
        image: item.food.image
    }));
} catch (error) {
    console.error("Критическая ошибка:", error);
    return [];
}
