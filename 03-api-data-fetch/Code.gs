/**
 * API Data Fetch
 * 
 * Pulls live data from the internet into your spreadsheet.
 * Two examples included:
 *   1. Currency exchange rates (updates daily)
 *   2. Weather forecast (updates daily)
 * 
 * Both APIs are free and require no API key or signup.
 * 
 * Setup:
 * 1. Open a Google Sheet (or create a new one)
 * 2. Go to Extensions > Apps Script
 * 3. Paste this code
 * 4. Run fetchExchangeRates() or fetchWeather() to test
 * 5. Run createDailyTrigger() once to auto-refresh every morning
 */

// ── CONFIG ──────────────────────────────────────────────────

var CONFIG = {
  // Exchange rates: which currencies to track (relative to USD)
  CURRENCIES: ["EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "MXN"],
  RATES_SHEET: "Exchange Rates",

  // Weather: latitude/longitude for your city
  // (Google "latitude longitude [your city]" to find yours)
  WEATHER_LAT:  37.34,   // San Jose, CA
  WEATHER_LON: -121.89,
  WEATHER_SHEET: "Weather"
};

// ── EXCHANGE RATES ──────────────────────────────────────────
// Data from ExchangeRate-API (free, no key required)
// https://www.exchangerate-api.com/docs/free

function fetchExchangeRates() {
  var url = "https://open.er-api.com/v6/latest/USD";
  var response = UrlFetchApp.fetch(url);
  var data = JSON.parse(response.getContentText());

  if (data.result !== "success") {
    Logger.log("API error: " + JSON.stringify(data));
    return;
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, CONFIG.RATES_SHEET);

  // Header row
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "MMM d, yyyy h:mm a");
  var headers = [["Currency", "Rate (per 1 USD)", "Last Updated"]];
  sheet.getRange(1, 1, 1, 3).setValues(headers).setFontWeight("bold");

  // Data rows
  var rows = [];
  for (var i = 0; i < CONFIG.CURRENCIES.length; i++) {
    var code = CONFIG.CURRENCIES[i];
    var rate = data.rates[code];
    rows.push([code, rate || "N/A", today]);
  }

  sheet.getRange(2, 1, rows.length, 3).setValues(rows);

  // Format the rate column
  sheet.getRange(2, 2, rows.length, 1).setNumberFormat("0.0000");

  // Auto-fit columns
  sheet.autoResizeColumns(1, 3);

  Logger.log("Exchange rates updated for " + CONFIG.CURRENCIES.length + " currencies.");
}

// ── WEATHER FORECAST ────────────────────────────────────────
// Data from Open-Meteo (free, no key required)
// https://open-meteo.com/

function fetchWeather() {
  var url = "https://api.open-meteo.com/v1/forecast"
    + "?latitude=" + CONFIG.WEATHER_LAT
    + "&longitude=" + CONFIG.WEATHER_LON
    + "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode"
    + "&temperature_unit=fahrenheit"
    + "&timezone=auto"
    + "&forecast_days=7";

  var response = UrlFetchApp.fetch(url);
  var data = JSON.parse(response.getContentText());

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(ss, CONFIG.WEATHER_SHEET);

  // Header row
  var headers = [["Date", "High", "Low", "Rain %", "Conditions"]];
  sheet.getRange(1, 1, 1, 5).setValues(headers).setFontWeight("bold");

  // Data rows
  var daily = data.daily;
  var rows = [];
  for (var i = 0; i < daily.time.length; i++) {
    rows.push([
      daily.time[i],
      daily.temperature_2m_max[i] + "°F",
      daily.temperature_2m_min[i] + "°F",
      daily.precipitation_probability_max[i] + "%",
      weatherCodeToText(daily.weathercode[i])
    ]);
  }

  sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  sheet.autoResizeColumns(1, 5);

  Logger.log("Weather forecast updated for " + daily.time.length + " days.");
}

// ── FETCH ALL ───────────────────────────────────────────────
// Runs both fetches. This is what the daily trigger calls.

function fetchAll() {
  fetchExchangeRates();
  fetchWeather();
}

// ── TRIGGER SETUP ───────────────────────────────────────────
// Run once. Schedules fetchAll() every morning between 6-7am.

function createDailyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "fetchAll") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger("fetchAll")
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();

  Logger.log("Daily trigger created. fetchAll() will run between 6-7am.");
}

function removeDailyTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "fetchAll") {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }
  Logger.log(removed > 0 ? "Trigger removed." : "No trigger found.");
}

// ── HELPERS ─────────────────────────────────────────────────

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function weatherCodeToText(code) {
  var codes = {
    0: "Clear sky",
    1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Fog", 48: "Freezing fog",
    51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
    61: "Light rain", 63: "Rain", 65: "Heavy rain",
    71: "Light snow", 73: "Snow", 75: "Heavy snow",
    80: "Light showers", 81: "Showers", 82: "Heavy showers",
    95: "Thunderstorm", 96: "Thunderstorm + hail", 99: "Severe thunderstorm"
  };
  return codes[code] || "Unknown (" + code + ")";
}
