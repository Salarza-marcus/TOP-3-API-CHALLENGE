const API_KEY = window.TMDB_API_KEY || "";
const BASE_URL = "https://api.themoviedb.org/3";

const movieGrid = document.getElementById("movieGrid");
const resultsCount = document.getElementById("resultsCount");
const searchInput = document.getElementById("searchInput");
const categoryButtons = document.querySelectorAll(".category-btn");
const genreButtons = document.querySelectorAll(".genre-btn");
const heroTrack = document.getElementById("heroTrack");

let currentCategory = "popular";
let currentGenre = "28";

function setStatus(message, isError = false) {
  resultsCount.textContent = message;
  resultsCount.style.color = isError ? "#ff8c8c" : "#9aa9bb";
}

function buildPosterUrl(path) {
  if (!path) {
    return "https://placehold.co/500x750/111827/ffffff?text=No+Poster";
  }

  return `https://image.tmdb.org/t/p/w500${path}`;
}

function renderHeroSlides(movies) {
  if (!movies.length || !heroTrack) return;

  const slides = [...movies, ...movies]
    .map((movie) => {
      const title = movie.title || "Movie";
      const poster = buildPosterUrl(movie.backdrop_path || movie.poster_path);
      return `
        <div class="hero-card">
          <img src="${poster}" alt="${title}" />
          <div class="hero-overlay">
            <h3 class="hero-title">${title}</h3>
          </div>
        </div>
      `;
    })
    .join("");

  heroTrack.innerHTML = slides;
}

function renderMovies(movies) {
  movieGrid.innerHTML = "";

  if (!movies.length) {
    movieGrid.innerHTML = `
      <div class="empty-state">
        <h3>No movies found</h3>
        <p>Try a different search term or filter.</p>
      </div>
    `;
    return;
  }

  movies.forEach((movie) => {
    const card = document.createElement("article");
    card.className = "movie-card";

    const overview = movie.overview || "No overview available.";
    const title = movie.title || "Untitled";
    const year = movie.release_date ? movie.release_date.split("-")[0] : "N/A";

    card.innerHTML = `
      <div class="poster-wrap">
        <img src="${buildPosterUrl(movie.poster_path)}" alt="${title} poster" />
        <span class="rating-badge">★ ${movie.vote_average?.toFixed(1) || "0.0"}</span>
      </div>
      <div class="card-body">
        <div class="card-heading">
          <h2 class="card-title">${title}</h2>
        </div>
        <div class="card-date">${year}</div>
        <p class="card-overview">${overview}</p>
      </div>
    `;

    movieGrid.appendChild(card);
  });
}

async function fetchMovies() {
  const query = searchInput.value.trim();

  if (!API_KEY) {
    setStatus("API key missing", true);
    movieGrid.innerHTML = `
      <div class="empty-state">
        <h3>API key required</h3>
        <p>Add your TMDB API key in config.js before running the app.</p>
      </div>
    `;
    return;
  }

  try {
    let endpoint = "";

    if (query) {
      endpoint = `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;
    } else {
      endpoint = `${BASE_URL}/discover/movie?with_genres=${currentGenre}&sort_by=popularity.desc&page=1`;

      if (currentCategory === "top_rated") {
        endpoint = `${BASE_URL}/discover/movie?with_genres=${currentGenre}&sort_by=vote_average.desc&vote_count.gte=100&page=1`;
      }

      if (currentCategory === "upcoming") {
        endpoint = `${BASE_URL}/discover/movie?with_genres=${currentGenre}&primary_release_date.gte=${new Date().toISOString().slice(0,10)}&sort_by=primary_release_date.asc&page=1`;
      }

      if (currentCategory === "now_playing") {
        endpoint = `${BASE_URL}/discover/movie?with_genres=${currentGenre}&primary_release_date.lte=${new Date().toISOString().slice(0,10)}&sort_by=popularity.desc&page=1`;
      }
    }

    const url = `${endpoint}&api_key=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TMDB request failed: ${response.status}`);
    }

    const data = await response.json();
    const movies = data.results || [];

    renderHeroSlides(movies);
    renderMovies(movies);
    setStatus(`${movies.length} results found`);
  } catch (error) {
    console.error(error);
    setStatus("Unable to load movies", true);
    movieGrid.innerHTML = `
      <div class="empty-state">
        <h3>Something went wrong</h3>
        <p>Please check the API key and network connection.</p>
      </div>
    `;
  }
}

searchInput.addEventListener("input", fetchMovies);

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentCategory = button.dataset.category;

    categoryButtons.forEach((btn) => {
      btn.classList.toggle("active", btn === button);
    });

    fetchMovies();
  });
});

genreButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentGenre = button.dataset.genre;

    genreButtons.forEach((btn) => {
      btn.classList.toggle("active", btn === button);
    });

    fetchMovies();
  });
});

fetchMovies();
