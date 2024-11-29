import axios from 'axios';

export default async function handler(req, res) {
  const { categoryId } = req.query;

  if (!categoryId) {
    return res.status(400).json({ error: 'categoryId is required' });
  }

  try {
    // Récupérer les variables associées à la catégorie
    const response = await axios.get(
      `https://www.speedrun.com/api/v1/categories/${categoryId}/variables`
    );

    const variables = response.data?.data;

    // Filtrer uniquement les variables "sub-catégories"
    const subcategories = variables.filter((variable) => variable['is-subcategory']);

    if (subcategories.length === 0) {
      return res.status(404).json({ error: 'No subcategories found for this category' });
    }

    // Formater les données pour inclure les options des sous-catégories
    const formattedSubcategories = subcategories.map((subcategory) => ({
      id: subcategory.id,
      name: subcategory.name,
      options: Object.entries(subcategory.values?.values || {}).map(([valueId, valueData]) => ({
        id: valueId,
        label: valueData.label,
        rules: valueData.rules,
      })), // Les choix disponibles pour la sous-catégorie
    }));

    res.status(200).json(formattedSubcategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch subcategories' });
  }
}
