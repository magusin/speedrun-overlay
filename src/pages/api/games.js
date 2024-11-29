import axios from 'axios';

export default async function handler(req, res) {
 
  try {
    // Rechercher la série "Souls" dans l'API
    const seriesResponse = await axios.get(
      'https://www.speedrun.com/api/v1/series/wnp06d7m/games'
    );
    res.status(200).json(seriesResponse.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
}
