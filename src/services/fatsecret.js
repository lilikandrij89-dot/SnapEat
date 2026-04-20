export const searchFood = async (query) => {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(`/api/food?query=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      console.error("Ошибка API");
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
    console.error("Search error:", error);
    return [];
  }
};
