import axios from 'axios';

export default async function handler(req, res) {
  const { gameId } = req.query;
  try {
    const response = await axios.get(
      `https://www.speedrun.com/api/v1/games/${gameId}/categories`
    );
    res.status(200).json(response.data.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}