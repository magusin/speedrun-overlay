import axios from 'axios';

export default async function handler(req, res) {
  const { gameId, categoryId, variableId, valueId } = req.query;

  if (!gameId || !categoryId) {
    return res.status(400).json({ error: 'Game ID and Category ID are required.' });
  }

  try {
    let url = `https://www.speedrun.com/api/v1/leaderboards/${gameId}/category/${categoryId}`;
    if (variableId && valueId) {
      url += `?var-${variableId}=${valueId}`;
    }

    const response = await axios.get(url);

    const runs = response.data.data.runs;

    // Récupération des informations des joueurs
    const playerDetails = await Promise.all(
        runs.map(async (run) => {
          const player = run.run.players[0];
          if (player.rel === 'user') {
            const playerResponse = await axios.get(player.uri);
            return {
              id: player.id,
              name: playerResponse.data.data.names.international,
              style: playerResponse.data.data['name-style'],
              country: playerResponse.data.data.location?.country?.code || null,
            };
          } else {
            return {
              id: null,
              name: player.name || 'Anonymous',
              style: null,
              country: null,
            };
          }
        })
      );
  
      // Construction du leaderboard enrichi
      const leaderboard = runs.map((run, index) => ({
        rank: index + 1,
        player: playerDetails[index].name,
        style: playerDetails[index].style,
        country: playerDetails[index].country,
        time: new Date(run.run.times.primary_t * 1000).toISOString().substr(11, 8)
      }));

      console.log('leaderboard:', leaderboard);

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch leaderboard data.' });
  }
}
