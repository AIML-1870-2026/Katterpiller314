// ==================== CONSTANTS ====================
const API_KEY = '59145db01134d7fbf8d1d4cbfab1e9c1';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';
const AQ_URL = 'https://api.openweathermap.org/data/2.5/air_pollution';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';

// ==================== STATE ====================
let currentUnit = 'metric';
let currentWeatherData = null;
let currentForecastData = null;
let currentAQIData = null;

// ==================== PRESET DATA ====================
function makePreset(name, country, timezone, temp, feels, humidity, windMs, weatherId, icon, desc, aqi, pm25, pm10, no2, o3, hourlyTemps) {
  const now = Math.floor(Date.now() / 1000);
  return {
    weather: {
      name, sys: { country }, timezone,
      weather: [{ id: weatherId, icon, description: desc }],
      main: { temp, feels_like: feels, humidity },
      wind: { speed: windMs },
      visibility: 10000
    },
    forecast: {
      list: hourlyTemps.map((t, i) => ({
        dt: now + (i + 1) * 10800,
        main: { temp: t },
        weather: [{ icon, description: desc }]
      }))
    },
    aqi: {
      list: [{ main: { aqi }, components: { pm2_5: pm25, pm10, no2, o3 } }]
    }
  };
}

const PRESETS = {
  'New York':  makePreset('New York',  'US', -14400, 18,  16,  62, 4.5, 801, '02d', 'few clouds',     2, 12.3, 18.5,  8.2, 45.1, [17, 19, 21, 20, 18, 16, 15, 14]),
  'London':    makePreset('London',    'GB',   3600, 12,  10,  78, 5.2, 804, '04d', 'overcast clouds', 2,  9.1, 14.2, 15.3, 38.7, [11, 12, 13, 13, 12, 11, 10,  9]),
  'Tokyo':     makePreset('Tokyo',     'JP',  32400, 22,  21,  55, 3.1, 800, '01d', 'clear sky',       1,  6.2, 10.1,  4.5, 52.3, [21, 23, 25, 24, 22, 20, 18, 17]),
  'Sydney':    makePreset('Sydney',    'AU',  36000, 26,  25,  45, 6.3, 800, '01d', 'clear sky',       1,  5.1,  8.3,  3.2, 48.9, [25, 27, 28, 27, 26, 24, 22, 21]),
  'Paris':     makePreset('Paris',     'FR',   7200, 14,  12,  82, 4.8, 500, '10d', 'light rain',      3, 18.5, 25.7, 22.1, 35.4, [13, 14, 14, 13, 12, 11, 10, 10]),
  'Dubai':     makePreset('Dubai',     'AE',  14400, 38,  40,  28, 3.8, 800, '01d', 'clear sky',       2, 15.2, 22.0,  6.1, 41.0, [37, 39, 41, 40, 38, 36, 34, 33]),
};

// ==================== INIT ====================
function init() {
  document.getElementById('search-btn').addEventListener('click', handleSearch);
  document.getElementById('city-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
  });
  document.getElementById('unit-toggle').addEventListener('click', toggleUnit);

  // Wire up preset buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => loadPreset(btn.dataset.city));
  });
}

// ==================== LOAD PRESET ====================
function loadPreset(cityName) {
  const preset = PRESETS[cityName];
  if (!preset) return;

  showError('');
  currentWeatherData = preset.weather;
  currentForecastData = preset.forecast;
  currentAQIData = preset.aqi;

  renderCurrentWeather();
  renderHourly();
  renderAQI();

  document.getElementById('weather-content').classList.remove('hidden');
  setBackground(currentWeatherData);

  // Highlight active preset button
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.city === cityName);
  });
}

// ==================== SEARCH ====================
function handleSearch() {
  const input = document.getElementById('city-input').value.trim();
  if (!input) return;

  // Clear active preset highlight
  document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));

  fetchWeather(input);
}

async function fetchWeather(city) {
  showError('');
  try {
    const geoRes = await fetch(`${GEO_URL}?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`);
    const geoData = await geoRes.json();

    if (!geoData || geoData.length === 0) {
      showError(`City "${city}" not found. Please check the spelling and try again.`);
      return;
    }

    const { lat, lon } = geoData[0];

    const [weatherRes, forecastRes, aqiRes] = await Promise.all([
      fetch(`${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
      fetch(`${FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
      fetch(`${AQ_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
    ]);

    const [weatherData, forecastData, aqiData] = await Promise.all([
      weatherRes.json(),
      forecastRes.json(),
      aqiRes.json()
    ]);

    if (weatherData.cod && weatherData.cod !== 200) {
      showError(weatherData.message || 'Failed to fetch weather data.');
      return;
    }

    currentWeatherData = weatherData;
    currentForecastData = forecastData;
    currentAQIData = aqiData;

    renderCurrentWeather();
    renderHourly();
    renderAQI();

    document.getElementById('weather-content').classList.remove('hidden');
    setBackground(weatherData);

  } catch (err) {
    showError('Live search requires a local server. Use the city presets below, or run the app via a server.');
    console.error(err);
  }
}

// ==================== RENDER CURRENT WEATHER ====================
function renderCurrentWeather() {
  const d = currentWeatherData;

  document.getElementById('city-name').textContent = `${d.name}, ${d.sys.country}`;

  const localMs = Date.now() + (d.timezone * 1000) - (new Date().getTimezoneOffset() * 60 * 1000);
  const localDate = new Date(localMs);
  const dateStr = localDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = localDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  document.getElementById('local-datetime').textContent = `${dateStr} · ${timeStr}`;

  const icon = d.weather[0].icon;
  document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
  document.getElementById('weather-icon').alt = d.weather[0].description;
  document.getElementById('weather-desc').textContent = d.weather[0].description;

  const temp = currentUnit === 'metric' ? d.main.temp : celsiusToFahrenheit(d.main.temp);
  const feelsLike = currentUnit === 'metric' ? d.main.feels_like : celsiusToFahrenheit(d.main.feels_like);
  const unitSymbol = currentUnit === 'metric' ? '°C' : '°F';
  document.getElementById('temperature').textContent = `${Math.round(temp)}${unitSymbol}`;
  document.getElementById('feels-like').textContent = `Feels like ${Math.round(feelsLike)}${unitSymbol}`;

  document.getElementById('humidity').textContent = `${d.main.humidity}%`;

  const windSpeed = currentUnit === 'metric'
    ? `${(d.wind.speed * 3.6).toFixed(1)} km/h`
    : `${(d.wind.speed * 2.237).toFixed(1)} mph`;
  document.getElementById('wind-speed').textContent = windSpeed;

  const visKm = (d.visibility / 1000).toFixed(1);
  const visMi = (d.visibility / 1609).toFixed(1);
  document.getElementById('visibility').textContent = currentUnit === 'metric'
    ? `${visKm} km`
    : `${visMi} mi`;
}

// ==================== RENDER HOURLY FORECAST ====================
function renderHourly() {
  const row = document.getElementById('hourly-row');
  row.innerHTML = '';

  const slots = currentForecastData.list.slice(0, 8);
  const unitSymbol = currentUnit === 'metric' ? '°C' : '°F';

  slots.forEach(slot => {
    const rawTemp = slot.main.temp;
    const temp = currentUnit === 'metric' ? rawTemp : celsiusToFahrenheit(rawTemp);
    const icon = slot.weather[0].icon;
    const dateObj = new Date(slot.dt * 1000);
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });

    const tile = document.createElement('div');
    tile.className = 'hourly-tile';
    tile.innerHTML = `
      <span class="hourly-time">${timeStr}</span>
      <img src="https://openweathermap.org/img/wn/${icon}.png" alt="${slot.weather[0].description}" />
      <span class="hourly-temp">${Math.round(temp)}${unitSymbol}</span>
    `;
    row.appendChild(tile);
  });
}

// ==================== RENDER AQI ====================
function renderAQI() {
  if (!currentAQIData || !currentAQIData.list || currentAQIData.list.length === 0) return;

  const aqi = currentAQIData.list[0].main.aqi;
  const components = currentAQIData.list[0].components;

  const { label, color } = getAQILabel(aqi);
  const aqiLabelEl = document.getElementById('aqi-label');
  aqiLabelEl.textContent = label;
  aqiLabelEl.style.color = color;

  document.getElementById('aqi-value').textContent = `AQI ${aqi}`;
  document.getElementById('pm25').textContent = `${components.pm2_5.toFixed(1)} µg/m³`;
  document.getElementById('pm10').textContent = `${components.pm10.toFixed(1)} µg/m³`;
  document.getElementById('no2').textContent = `${components.no2.toFixed(1)} µg/m³`;
  document.getElementById('o3').textContent = `${components.o3.toFixed(1)} µg/m³`;
}

// ==================== UNIT TOGGLE ====================
function toggleUnit() {
  currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';

  document.getElementById('unit-c').classList.toggle('active', currentUnit === 'metric');
  document.getElementById('unit-f').classList.toggle('active', currentUnit === 'imperial');

  if (currentWeatherData) {
    renderCurrentWeather();
    renderHourly();
  }
}

// ==================== HELPERS ====================
function celsiusToFahrenheit(c) {
  return (c * 9 / 5) + 32;
}

function getAQILabel(index) {
  const map = {
    1: { label: 'Good',      color: '#4ade80' },
    2: { label: 'Fair',      color: '#a3e635' },
    3: { label: 'Moderate',  color: '#facc15' },
    4: { label: 'Poor',      color: '#fb923c' },
    5: { label: 'Very Poor', color: '#f87171' },
  };
  return map[index] || { label: 'Unknown', color: '#fff' };
}

function setBackground(weatherData) {
  const code = weatherData.weather[0].id;
  const isNight = weatherData.weather[0].icon.endsWith('n');

  let bgClass = 'bg-default';
  if (isNight)                    bgClass = 'bg-night';
  else if (code >= 200 && code < 300) bgClass = 'bg-thunder';
  else if (code >= 300 && code < 600) bgClass = 'bg-rain';
  else if (code >= 600 && code < 700) bgClass = 'bg-snow';
  else if (code >= 700 && code < 800) bgClass = 'bg-mist';
  else if (code === 800)              bgClass = 'bg-clear';
  else if (code > 800)                bgClass = 'bg-clouds';

  document.body.className = bgClass;
}

function showError(msg) {
  const el = document.getElementById('error-msg');
  if (msg) {
    el.textContent = msg;
    el.classList.remove('hidden');
    document.getElementById('weather-content').classList.add('hidden');
  } else {
    el.classList.add('hidden');
  }
}

// ==================== START ====================
document.addEventListener('DOMContentLoaded', init);
