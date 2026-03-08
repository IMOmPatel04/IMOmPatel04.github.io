//  Weather App - app.js
//  Uses the Open Meteo API (https://open-meteo.com/) and the browser Geolocation API to show current weather.


// 1. Return the correct Bootstrap Icon class based on the WMO weather code
// WMO codes are the standard used by the Open Meteo API
function getWeatherIcon(intCode) {
    if (intCode === 0)                          return 'bi bi-sun-fill text-warning weather-icon'         // Clear sky
    if (intCode === 1)                          return 'bi bi-cloud-sun-fill text-warning weather-icon'   // Mainly clear
    if (intCode === 2)                          return 'bi bi-cloud-sun weather-icon'                     // Partly cloudy
    if (intCode === 3)                          return 'bi bi-clouds-fill weather-icon'                   // Overcast
    if (intCode === 45 || intCode === 48)       return 'bi bi-cloud-fog2-fill text-secondary weather-icon'// Fog
    if (intCode >= 51 && intCode <= 55)         return 'bi bi-cloud-drizzle-fill text-info weather-icon'  // Drizzle
    if (intCode >= 61 && intCode <= 65)         return 'bi bi-cloud-rain-fill text-info weather-icon'     // Rain
    if (intCode >= 71 && intCode <= 77)         return 'bi bi-cloud-snow-fill text-light weather-icon'    // Snow
    if (intCode >= 80 && intCode <= 82)         return 'bi bi-cloud-rain-heavy-fill text-info weather-icon'// Rain showers
    if (intCode === 85 || intCode === 86)       return 'bi bi-cloud-snow-fill text-light weather-icon'    // Snow showers
    if (intCode >= 95)                          return 'bi bi-cloud-lightning-rain-fill text-warning weather-icon' // Thunderstorm
    return 'bi bi-cloud-fill weather-icon' // Default fallback
}


// 2. Return a plain English description of the WMO weather code
function getWeatherDescription(intCode) {
    if (intCode === 0)                          return 'Clear Sky'
    if (intCode === 1)                          return 'Mainly Clear'
    if (intCode === 2)                          return 'Partly Cloudy'
    if (intCode === 3)                          return 'Overcast Clouds'
    if (intCode === 45 || intCode === 48)       return 'Foggy'
    if (intCode >= 51 && intCode <= 55)         return 'Drizzle'
    if (intCode >= 61 && intCode <= 65)         return 'Rainy'
    if (intCode >= 71 && intCode <= 77)         return 'Snowy'
    if (intCode >= 80 && intCode <= 82)         return 'Rain Showers'
    if (intCode === 85 || intCode === 86)       return 'Snow Showers'
    if (intCode >= 95)                          return 'Thunderstorm'
    return 'Unknown'
}


// 3. Show an error message on screen and hide the loading weather cards
function showError(strMessage) {
    document.querySelector('#divLoading').style.display = 'none'
    document.querySelector('#divWeather').style.display = 'none'
    document.querySelector('#lblError').textContent = strMessage
    document.querySelector('#divError').style.display = 'block'
}


// 4. Take the API response and put all the values into the weather card
function updateWeatherCard(objData, strCityName) {

    // Pull the values we need out of the on going section of the API response
    const fltTemp       = objData.current.temperature_2m
    const intHumidity   = objData.current.relative_humidity_2m
    const fltFeelsLike  = objData.current.apparent_temperature
    const intWeatherCode = objData.current.weather_code

    // Set the city location name label
    document.querySelector('#lblCity').textContent = strCityName

    // Set rounded temperature and humidity 
    document.querySelector('#lblTemp').textContent     = Math.round(fltTemp)
    document.querySelector('#lblHumidity').textContent = intHumidity
    document.querySelector('#lblFeelsLike').textContent = Math.round(fltFeelsLike)

    // Set the condition description text
    document.querySelector('#lblCondition').textContent = getWeatherDescription(intWeatherCode)

    // Set the Bootstrap Icon on the weather icon element using the WMO code
    document.querySelector('#iWeatherIcon').className = getWeatherIcon(intWeatherCode)

    // Hide the loading card and show the weather card
    document.querySelector('#divLoading').style.display = 'none'
    document.querySelector('#divWeather').style.display = 'block'
}


// 5. Call the Open Meteo API with the given lat/lon coordinates and update the card
function fetchWeather(fltLat, fltLon, strCityName) {

    // Build the API URL requesting current temperature, humidity, feels like temperature, and weather code in Fahrenheit
    const strApiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${fltLat}&longitude=${fltLon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`

    fetch(strApiUrl)
    .then(response => {
        // Make sure the response came back ok before trying to read it
        if(response.ok){
            return response.json()
        } else {
            throw new Error('Weather API returned status: ' + response.status)
        }
    })
    .then(data => {
        // Pass the data and city name to the function that updates the card
        updateWeatherCard(data, strCityName)
    })
    .catch(objError => {
        // Show an error card if the fetch failed for any reason
        console.log(objError)
        showError('Could not load weather data. Please try again later.')
    })
}


// 6. Use the Nominatim (OpenStreetMap) reverse geocoding API to turn lat/lon into a city name,
// Then call fetchWeather() with that city name
function fetchCityName(fltLat, fltLon) {

    const strGeoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${fltLat}&lon=${fltLon}`

    fetch(strGeoUrl)
    .then(response => {
        return response.json()
    })
    .then(data => {
        // The address object contains city, town, village, or county depending on the area
        const strCity = data.address.city || data.address.town || data.address.village || data.address.county || 'Your Location'
        fetchWeather(fltLat, fltLon, strCity)
    })
    .catch(() => {
        // If reverse geocoding fails for any reason, still load the weather with a generic label
        fetchWeather(fltLat, fltLon, 'Your Location')
    })
}


// 7. Ask the browser for the user's current GPS coordinates using the Geolocation API
if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
        (objPosition) => {
            // If success get lat/log from the position object
            const fltLat = objPosition.coords.latitude
            const fltLon = objPosition.coords.longitude
            fetchCityName(fltLat, fltLon)
        },
        (objError) => {
            // If the user denies location access fall back to Cookeville, TN as the default
            console.log('Geolocation error: ' + objError.message)
            fetchWeather(36.1682, -85.5016, 'Cookeville')
        }
    )
} else {
    // If the browser does not support geolocation at all, use the default location
    fetchWeather(36.1682, -85.5016, 'Cookeville')
}

//  Use of AI: Claude (claude-sonnet-4-6) was used to figure out the correct WMO weather code mappings for the Bootstrap Icons, and to write the getWeatherDescription() function that turns WMO codes into plain English descriptions and also used it to wrtite few comments.
