# 03 — API Data Fetch

Pulls live data from the internet into your spreadsheet automatically. Two examples included: currency exchange rates and a 7-day weather forecast.

## What it does

- Fetches current exchange rates for currencies you choose (relative to USD)
- Fetches a 7-day weather forecast for your location
- Writes the data into separate sheets in your spreadsheet
- Runs on a daily trigger so the data is fresh every morning before you open it

## APIs used

Both are free and require no API key, no signup, no account.

- **Exchange rates:** [ExchangeRate-API](https://www.exchangerate-api.com/docs/free) — open access endpoint, updates daily
- **Weather:** [Open-Meteo](https://open-meteo.com/) — open source weather API, updates hourly

## Setup

1. Open a Google Sheet (new or existing)
2. Go to **Extensions → Apps Script**
3. Delete the default code and paste in `Code.gs`
4. Edit the `CONFIG` section:
   - `CURRENCIES`: add or remove currency codes you want to track
   - `WEATHER_LAT` / `WEATHER_LON`: your city's coordinates (Google "latitude longitude [your city]")
5. Run `fetchExchangeRates()` to test exchange rates
6. Run `fetchWeather()` to test the weather forecast
7. Run `createDailyTrigger()` once to schedule both to run every morning

## Customization

- Change `temperature_unit` from `fahrenheit` to `celsius` in the weather URL if needed
- Add more currencies to the `CURRENCIES` array — full list at [exchangerate-api.com](https://www.exchangerate-api.com/docs/supported-currencies)
- The trigger runs `fetchAll()` which calls both functions — remove one if you only want the other

## Notes

- Creates sheets named "Exchange Rates" and "Weather" automatically
- Works on free Google accounts
- No third-party add-ons or services involved
- First run will ask for authorization (same as previous posts in the series)
