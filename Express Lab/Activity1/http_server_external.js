// Example from Brad Dayley
// https://github.com/bwdbooks/nodejs-mongodb-angularjs-web-development

var http = require('http');
var url = require('url');
var qstring = require('querystring');
var session = require('express-session');
function sendResponse(weatherData, res, lastCity){
  var page = '<html><head><title>Weather Report</title></head>' +
    '<body>' +
    '<form method="post">' +
    'City: <input name="city" value="' + lastCity + '""><br>' +
    '<input type="submit" name="weather" value="Weather">' +
    '<input type="submit" name="forecast" value="Forecast">' +
    '</form>';
  if(weatherData){
    page += '<h1>Weather Info</h1><p>' + weatherData +'</p>';
  }
  page += '</body></html>';    
  res.end(page);
  
}
function parseWeather(weatherResponse, res, city, fore) {
  var weatherData = '';
  weatherResponse.on('data', function (chunk) {
    weatherData += chunk;
  });
  weatherResponse.on('end', function () {
    if (!fore) {
      weatherData = beautifyWeather(weatherData);
    } else {
      weatherData = beautifyForecast(weatherData)
    }
    sendResponse(weatherData, res, city);
  });
}
//returns a prettier representation of the weather
function beautifyWeather(weatherData) {
    weatherJSON = JSON.parse(weatherData);
    weatherData = "Name: " + weatherJSON.name + "<br>";
    weatherData += "Current Temperature: " + convertTemp(weatherJSON.main.temp) + "F<br>";
    weatherData += "Short Description: " + weatherJSON.weather[0].main + "<br>";
    weatherData += "Expanded Description: " + weatherJSON.weather[0].description + "<br>";
    return weatherData;
}
//returns a prettier representation of the forecast
function beautifyForecast(weatherData) {
    weatherJSON = JSON.parse(weatherData);
    weatherData = "Name: " + weatherJSON.city.name + "<br>";
    //find temp_min over next 24 hours
    var min = weatherJSON.list[0].main.temp_min;
    for (i=1;i<8;i++) {
        if(weatherJSON.list[i].main.temp_min < min) {
          min = weatherJSON.list[i].main.temp_min;
        }
    }
    weatherData += "Temp_Min: " + min + "<br>";
    //find temp_max over next 24 hours
    var max = weatherJSON.list[0].main.temp_max;
    for (i=1;i<8;i++) {
        if(weatherJSON.list[i].main.temp_max > max) {
          max = weatherJSON.list[i].main.temp_max;
        }
    }
    weatherData += "Temp_Max: " + max + "<br>";
    weatherData += "Short Description: " + weatherJSON.list[0].weather[0].main + "<br>";
    weatherData += "Expanded Description: " + weatherJSON.list[0].weather[0].description + "<br>";
    return weatherData;
}
//converts from Kelvin to Fahrenheit
function convertTemp(temp) {
  return (temp * 9 / 5 - 459.67).toFixed(2);
}
function getWeather(city, res){
  var options = {
    host: 'api.openweathermap.org',
    path: '/data/2.5/weather?q=' + city.replace(" ", "%20") + "&APPID=1a30146bf0c05ab7c3bc12366b0b55ff"
  };
  http.request(options, function(weatherResponse){
    parseWeather(weatherResponse, res, city);
  }).end();
  // set cookie to remember the last entered city
  res.writeHead(200, {
	'Content-Type': 'text/html',
        'Set-Cookie': 'last_city=' + city + ';expires=' + new Date (new Date().setMonth(new Date().getMonth() + 1)).toUTCString()
    });
}
function getForecast(city, res){
  var options = {
    host: 'api.openweathermap.org',
    path: '/data/2.5/forecast?q=' + city.replace(" ", "%20") + "&APPID=1a30146bf0c05ab7c3bc12366b0b55ff"
  };
  http.request(options, function(weatherResponse){
    parseWeather(weatherResponse, res, city, true);
  }).end();
  // set cookie to remember the last entered city
  res.writeHead(200, {
  'Content-Type': 'text/html',
        'Set-Cookie': 'last_city=' + city + ';expires=' + new Date (new Date().setMonth(new Date().getMonth() + 1)).toUTCString()
    });
}
//retrieve last city from cookie
function getLastCity(req) {
  if (typeof req.headers.cookie !== 'undefined') {
  var cookie = req.headers.cookie;
  } else {
    cookie = "";
  }
	var last_city = "";
	if(cookie.search("last_city") > -1) {
		last_city=cookie.replace("last_city=", "");
	}
	return last_city;
}

http.createServer(function (req, res) {
  console.log(req.method);
  if (req.method == "POST"){
    var reqData = '';
    req.on('data', function (chunk) {
      reqData += chunk;
    });
    req.on('end', function() {
      var postParams = qstring.parse(reqData);
      if (typeof postParams.weather !== 'undefined') {
        getWeather(postParams.city, res);
      } else if (typeof postParams.forecast !== 'undefined') {
        getForecast(postParams.city, res);
      }
    });
  } else if (req.method == "GET"){
    sendResponse(null, res, getLastCity(req));
  } else {
    var page = '<html><head><title>Weather Report</title></head>' +
    '<body>' +
    '<h1>Error 405: Method not Allowed</h1><p>' +
    '</body></html>'; 
    res.writeHead(405);
    res.end(page);
  }
}).listen(8080);