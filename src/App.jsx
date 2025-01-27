import React, { useState } from 'react';
import { Search, ArrowUpDown, ChevronLeft } from 'lucide-react';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [genres, setGenres] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const searchMovies = async (query) => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=59b84e54&s=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      
      if (data.Response === 'True') {
        setMovies(data.Search);
        // Extract unique genres from detailed movie data
        const genrePromises = data.Search.map(movie =>
          fetch(`https://www.omdbapi.com/?apikey=59b84e54&i=${movie.imdbID}`)
            .then(res => res.json())
        );
        
        const detailedMovies = await Promise.all(genrePromises);
        const allGenres = new Set();
        detailedMovies.forEach(movie => {
          movie.Genre?.split(', ').forEach(genre => allGenres.add(genre));
        });
        setGenres(allGenres);
      } else {
        setError(data.Error || 'No results found');
        setMovies([]);
      }
    } catch (err) {
      setError('Failed to fetch movies');
    } finally {
      setLoading(false);
    }
  };

  const getMovieDetails = async (imdbID) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=59b84e54&i=${imdbID}`
      );
      const data = await response.json();
      if (data.Response === 'True') {
        setSelectedMovie(data);
      }
    } catch (err) {
      setError('Failed to fetch movie details');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchMovies(searchTerm);
  };

  const sortedAndFilteredMovies = () => {
    let filtered = [...movies];
    if (selectedGenre !== 'all') {
      filtered = filtered.filter(movie => {
        const movieDetails = movies.find(m => m.imdbID === movie.imdbID);
        return movieDetails?.Genre?.includes(selectedGenre);
      });
    }
    
    return filtered.sort((a, b) => {
      if (sortOrder === 'asc') {
        return parseInt(a.Year) - parseInt(b.Year);
      }
      return parseInt(b.Year) - parseInt(a.Year);
    });
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {!selectedMovie ? (
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
            Movie Search
          </h1>
          
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for movies..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
              </div>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {movies.length > 0 && (
            <div className="mb-6 flex gap-4">
              <button
                onClick={toggleSortOrder}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50"
              >
                <ArrowUpDown size={16} />
                Sort by Year ({sortOrder === 'asc' ? 'Ascending' : 'Descending'})
              </button>
              
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50"
              >
                <option value="all">All Genres</option>
                {Array.from(genres).map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-center py-4">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAndFilteredMovies().map((movie) => (
              <div
                key={movie.imdbID}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => getMovieDetails(movie.imdbID)}
              >
                <img
                  src={movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster'}
                  alt={movie.Title}
                  className="w-full h-[400px] object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{movie.Title}</h3>
                  <p className="text-gray-600">Year: {movie.Year}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => setSelectedMovie(null)}
            className="flex items-center gap-2 p-4 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ChevronLeft size={20} />
            Back to Results
          </button>
          
          <div className="grid md:grid-cols-2 gap-8 p-8">
            <img
              src={selectedMovie.Poster !== 'N/A' ? selectedMovie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster'}
              alt={selectedMovie.Title}
              className="w-full h-[500px] object-cover rounded-lg"
            />
            
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">{selectedMovie.Title}</h2>
              <div className="space-y-4">
                <p><span className="font-semibold">Year:</span> {selectedMovie.Year}</p>
                <p><span className="font-semibold">Genre:</span> {selectedMovie.Genre}</p>
                <p><span className="font-semibold">Director:</span> {selectedMovie.Director}</p>
                <p><span className="font-semibold">Runtime:</span> {selectedMovie.Runtime}</p>
                <p><span className="font-semibold">IMDb Rating:</span> {selectedMovie.imdbRating}</p>
                <div>
                  <p className="font-semibold mb-2">Plot:</p>
                  <p className="text-gray-600 leading-relaxed">{selectedMovie.Plot}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;