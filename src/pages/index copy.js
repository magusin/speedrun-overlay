import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Home() {
  const [games, setGames] = useState(null); // Liste des jeux
  const [selectedGame, setSelectedGame] = useState(null); // Jeu sélectionné
  const [categories, setCategories] = useState(null); // Liste des catégories
  const [selectedCategory, setSelectedCategory] = useState(null); // Catégorie sélectionnée
  const [subCategories, setSubCategories] = useState(null); // Liste des sous-catégories
  const [leaderboard, setLeaderboard] = useState(null); // Données du leaderboard
  const [currentPage, setCurrentPage] = useState(0); // Page actuelle pour le leaderboard
  const [intervalId, setIntervalId] = useState(null); // ID de l'intervalle pour changer de page
  const [selectedVariable, setSelectedVariable] = useState(null); // Variable sélectionnée

  const LEADERBOARD_PAGE_SIZE = 10; // Nombre d'entrées par page
  const PAGE_SWITCH_INTERVAL = 5000; // Temps en millisecondes pour changer de page

  console.log('leaderboard:', leaderboard);
  console.log('currentPage:', currentPage);
  console.log('subCategories:', subCategories);
  console.log('selectedVariable:', selectedVariable);


  useEffect(() => {
    axios.get('/api/games')
      .then((res) => setGames(res.data))
      .catch((err) => console.error(err));
  }, []);

  const fetchLeaderboard = (gameId, categoryId, variableId = null, valueId = null) => {
    let url = `/api/leaderboard?gameId=${gameId}&categoryId=${categoryId}`;
    if (variableId && valueId) {
      url += `&variableId=${variableId}&valueId=${valueId}`;
    }

    axios
      .get(url)
      .then((res) => {
        setLeaderboard(res.data); // Charger le leaderboard
      })
      .catch((err) => {
        console.error(err);
        setLeaderboard([]); // Si une erreur se produit
      });
  };

  const startLeaderboardRotation = () => {
    if (!leaderboard || leaderboard.length <= LEADERBOARD_PAGE_SIZE) return;

    const id = setInterval(() => {
      setCurrentPage((prevPage) => (prevPage + 1) % Math.ceil(leaderboard.length / LEADERBOARD_PAGE_SIZE));
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
    setSelectedCategory(category);
    setSubCategories(null);
    setLeaderboard(null);

    axios
      .get(`/api/variables?categoryId=${category.id}`) // Récupère les variables
      .then((res) => {
        if (res.data) {
          setSelectedVariable(res.data[0].id);
          setSubCategories(res.data); // Stockez l'objet complet avec `values`
        } else {
          // Pas de sous-catégorie, charger directement le leaderboard
          fetchLeaderboard(selectedGame.id, category.id);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handleSubCategoryClick = (variableId, value) => {
    fetchLeaderboard(selectedGame.id, selectedCategory.id, variableId, value.id);
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

  if (!games) {
    return <p>Loading...</p>; // Gestion du cas où les jeux ne sont pas encore chargés.
  }

  if (!Array.isArray(games.data)) {
    return <p>No games available.</p>; // Gestion du cas où `games.data` n'est pas un tableau.
  }

  return (
    <div className="p-4">
      {selectedGame && categories ? (
        selectedCategory ? (
          selectedVariable && subCategories && subCategories.length > 0 ? (
            // Vue des sous-catégories
            <div>
              <button
                onClick={handleBackToCategories}
                className="mb-4 px-4 py-2 bg-gray-200 rounded shadow hover:bg-gray-300"
              >
                Back to Categories
              </button>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {subCategories[0].options.map((option) => (
                  <div
                    key={option.id}
                    onClick={() =>
                      handleSubCategoryClick(subCategories.id, { id: option.id, name: option.label })
                    }
                    className="border rounded-lg shadow-lg cursor-pointer hover:shadow-2xl transition-shadow duration-300 p-4"
                  >
                    <h3 className="text-lg font-semibold text-center">{option.label}</h3>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
            </div>
          )
        ) : (
          // Vue du jeux
          <>
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
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Select a Category</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    className="border rounded-lg shadow-lg cursor-pointer hover:shadow-2xl transition-shadow duration-300 p-4"
                  >
                    <h3 className="text-lg font-semibold text-center">
                      {category.name}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          </>
        )
      ) : (
        // Liste des jeux
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
    </div>
  );
};
