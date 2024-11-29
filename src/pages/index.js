import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [games, setGames] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [categories, setCategories] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subCategories, setSubCategories] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const [selectedVariable, setSelectedVariable] = useState(null);

  console.log('subCategories:', subCategories);
  console.log('leaderboard:', leaderboard);

  const LEADERBOARD_PAGE_SIZE = 8; // Nombre d'entrées par page
  const PAGE_SWITCH_INTERVAL = 5000; // Temps en millisecondes pour changer de page

  useEffect(() => {
    axios.get('/api/games')
      .then((res) => setGames(res.data))
      .catch((err) => console.error(err));
  }, []);

  const fetchLeaderboard = (gameId, categoryId, selectedVariable, valueId = null) => {
    let url = `/api/leaderboard?gameId=${gameId}&categoryId=${categoryId}`;
    if (selectedVariable && valueId) {
      url += `&variableId=${selectedVariable}&valueId=${valueId}`;
    }

    axios
      .get(url)
      .then((res) => {
        setLeaderboard(res.data);
        setCurrentPage(0); // Reset pagination
        startLeaderboardRotation(res.data.length); // Start rotation if applicable
      })
      .catch((err) => {
        console.error(err);
        setLeaderboard([]); // Empty leaderboard on error
      });
  };

  const startLeaderboardRotation = (totalEntries) => {
    if (intervalId) clearInterval(intervalId); // Clear previous interval
    if (!totalEntries || totalEntries <= LEADERBOARD_PAGE_SIZE) return; // Skip if not enough data

    const id = setInterval(() => {
      setCurrentPage((prevPage) => (prevPage + 1) % Math.ceil(totalEntries / LEADERBOARD_PAGE_SIZE));
    }, PAGE_SWITCH_INTERVAL);

    setIntervalId(id);
  };

  const stopLeaderboardRotation = () => {
    if (intervalId) clearInterval(intervalId);
  };

  const handleGameClick = (game) => {
    setSelectedGame(game);
    setCategories(null);
    setSelectedCategory(null);
    setSubCategories(null);
    setLeaderboard(null);
    axios
      .get(`/api/categories?gameId=${game.id}`)
      .then((res) => setCategories(res.data))
      .catch((err) => console.error(err));
  };

  const handleCategoryClick = (category) => {
    console.log('category:', category);
    setSelectedCategory(category);
    setSubCategories(null);
    setLeaderboard(null);
    axios
      .get(`/api/variables?categoryId=${category.id}`)
      .then((res) => {
        console.log('variables:', res.data);
        if (res.data.length > 0) {
          setSelectedVariable(res.data[0].id);
          setSubCategories(res.data);
        } else {
          fetchLeaderboard(selectedGame.id, category.id);
        }
      })
      .catch((err) => console.error(err));
  };

  const handleSubCategoryClick = (value) => {
    if (!selectedVariable) return;
    fetchLeaderboard(selectedGame.id, selectedCategory.id, selectedVariable, value.id);
  };

  const handleBackToGames = () => {
    stopLeaderboardRotation();
    setSelectedGame(null);
    setCategories(null);
    setSelectedCategory(null);
    setSubCategories(null);
    setLeaderboard(null);
    setCurrentPage(0);
  };

  const handleBackToCategories = () => {
    stopLeaderboardRotation();
    setSelectedCategory(null);
    setSubCategories(null);
    setLeaderboard(null);
    setCurrentPage(0);
  };

  const formatTime = (time) => {
    // Formater le temps en h:mm:ss ou mm:ss si h === 0
    const parts = time.split(':');
    return parts[0] === '00' ? parts.slice(1).join(':') : time;
  };

  if (!games) {
    return <p>Loading...</p>;
  }

  if (!Array.isArray(games.data)) {
    return <p>No games available.</p>;
  }

  const paginatedLeaderboard = leaderboard
    ? leaderboard.slice(
      currentPage * LEADERBOARD_PAGE_SIZE,
      (currentPage + 1) * LEADERBOARD_PAGE_SIZE
    )
    : [];

  return (
    <>
      {/* Étape 1 : Afficher la liste des jeux si aucun jeu n'est sélectionné */}
      {!selectedGame && games && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Select a Game</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {games.data.map((game) => (
              <div
                key={game.id}
                onClick={() => handleGameClick(game)}
                className="border rounded-lg shadow-lg cursor-pointer hover:shadow-2xl transition-shadow duration-300"
              >
                <img
                  src={game.assets['background']?.uri || '/placeholder.png'}
                  alt={game.names.international}
                  className="w-full h-40 object-cover rounded-t-lg"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-center">
                    {game.names.international}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Étape 2 : Afficher la liste des catégories si un jeu est sélectionné mais pas de catégorie */}
      {selectedGame && !selectedCategory && categories && (
        <div>
          <button
            onClick={handleBackToGames}
            className="mb-4 px-4 py-2 bg-gray-200 rounded shadow hover:bg-gray-300"
          >
            Back to Games
          </button>
          <div className="max-w-md mx-auto border rounded-lg shadow-lg p-4">
            <img
              src={selectedGame.assets['background']?.uri || '/placeholder.png'}
              alt={selectedGame.names.international}
              className="w-full h-60 object-cover rounded-lg"
            />
            <h2 className="text-2xl font-bold text-center mt-4">
              {selectedGame.names.international}
            </h2>
            <p className="text-center mt-2">
              Released: {selectedGame.released || 'Unknown'}
            </p>
          </div>
          <h2 className="text-2xl font-bold mb-4">Select a Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className="border rounded-lg shadow-lg cursor-pointer hover:shadow-2xl transition-shadow duration-300 p-4"
              >
                <h3 className="text-lg font-semibold text-center">{category.name}</h3>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Étape 3 : Afficher les sous-catégories si une catégorie est sélectionnée mais pas de leaderboard */}
      {selectedCategory && subCategories && subCategories.length > 0 && subCategories[0]?.options && !leaderboard && (
        <div>
          <button
            onClick={handleBackToCategories}
            className="mb-4 px-4 py-2 bg-gray-200 rounded shadow hover:bg-gray-300"
          >
            Back to Categories
          </button>
          <h2 className="text-2xl font-bold mb-4">{subCategories[0]?.name || 'Subcategories'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subCategories[0]?.options.map((option) => (
              <div
                key={option.id}
                onClick={() => handleSubCategoryClick(option)}
                className="border rounded-lg shadow-lg cursor-pointer hover:shadow-2xl transition-shadow duration-300 p-4"
              >
                <h3 className="text-lg font-semibold text-center">{option.label}</h3>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Étape 4 : Afficher le leaderboard si tout est sélectionné */}
      {leaderboard && leaderboard.length > 0 && (
        <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center">
          <div className="bg-transparent w-[500px] min-h-[400px] flex flex-col ">
            {/* Top 3 : Fixes */}
            <div className="text-center">
              {leaderboard.slice(0, 3).map((entry, index) => (
                <div
                  key={entry.rank}
                  className="flex justify-between items-center mb-1 p-1"
                >
                  <div className="flex items-center">
                    {/* Trophée selon le rang */}
                    {index === 0 && (
                      <img
                        src="https://www.speedrun.com/images/1st.png"
                        alt="1st"
                        className="w-6 h-6 mr-1"
                      />
                    )}
                    {index === 1 && (
                      <img
                        src="https://www.speedrun.com/images/2nd.png"
                        alt="2nd"
                        className="w-6 h-6 mr-1"
                      />
                    )}
                    {index === 2 && (
                      <img
                        src="https://www.speedrun.com/images/3rd.png"
                        alt="3rd"
                        className="w-6 h-6 mr-1"
                      />
                    )}
                    {/* Pays et nom */}
                    {entry.country ? (
                      <img
                        src={`https://flagcdn.com/w40/${entry.country.toLowerCase()}.png`}
                        alt={entry.country}
                        className="inline-block w-6 h-4 mx-1"
                      />
                    ) : (
                      <img
                        src={`https://flagcdn.com/w40/us.png`}
                        alt="Default"
                        className="inline-block w-6 h-4 mx-1"
                      />
                    )}
                    <span
                      style={{
                        background:
                          entry.style?.style === 'gradient'
                            ? `linear-gradient(to right, ${entry.style['color-from'].light}, ${entry.style['color-to'].light})`
                            : 'none',
                        color: entry.style?.style === 'solid' ? entry.style.color.light : 'inherit',
                        WebkitBackgroundClip:
                          entry.style?.style === 'gradient' ? 'text' : 'unset',
                        WebkitTextFillColor:
                          entry.style?.style === 'gradient' ? 'transparent' : 'unset',
                      }}
                      className="text-lg font-bold"
                    >
                      {entry.player}
                    </span>
                  </div>
                  <div className="text-lg font-semibold ml-2">
                    {formatTime(entry.time)}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination pour les rangs suivants */}
            <div className="bg-transparent">
              {paginatedLeaderboard.slice(3).map((entry, index) => (
                <div
                  key={entry.rank}
                  className="flex justify-between items-center mb-1 p-1"
                >
                  <div className="flex items-center">
                    <span className="text-md font-bold w-6 text-center">
                      {entry.rank}
                    </span>
                    {entry.country ? (
                      <img
                        src={`https://flagcdn.com/w40/${entry.country.toLowerCase()}.png`}
                        alt={entry.country}
                        className="inline-block w-6 h-4 mx-1"
                      />
                    ) : (
                      <img
                        src={`https://flagcdn.com/w40/us.png`}
                        alt="Default"
                        className="inline-block w-6 h-4 mx-1"
                      />
                    )}
                    <span
                      style={{
                        background:
                          entry.style?.style === 'gradient'
                            ? `linear-gradient(to right, ${entry.style['color-from'].light}, ${entry.style['color-to'].light})`
                            : 'none',
                        color: entry.style?.style === 'solid' ? entry.style.color.light : 'inherit',
                        WebkitBackgroundClip:
                          entry.style?.style === 'gradient' ? 'text' : 'unset',
                        WebkitTextFillColor:
                          entry.style?.style === 'gradient' ? 'transparent' : 'unset',
                      }}
                      className="text-md font-medium"
                    >
                      {entry.player}
                    </span>
                  </div>
                  <div className="text-md ml-2">{formatTime(entry.time)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Étape finale : Chargement ou pas de données */}
      {!games && <p>Loading...</p>}
      {selectedGame && !categories && <p>Loading categories...</p>}
      {selectedCategory && !subCategories && !leaderboard && <p>Loading subcategories...</p>}
      {leaderboard && leaderboard.length === 0 && <p>No leaderboard data available.</p>}
    </>
  );

}
