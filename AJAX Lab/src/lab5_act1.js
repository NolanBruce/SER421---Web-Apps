const cells = ['name', 'time', 'temp', 'hum', 'wind', 'cloud'];
//returns requets object
//source: Dr. Gary github AJAX examples: https://github.com/kgary/ser421public/tree/master/ajax
function getRequestObject() {
  if (window.XMLHttpRequest) {
    return(new XMLHttpRequest());
  } else {
    return(null);
  }
}
//converts from Fahrenheit to Celcius
function convertTemp(temp) {
  return ((temp - 32)*5/9).toFixed(2);
}
//builds first to rows in table
function initialize() {
	console.log("Starting");
	getWeather("London");
	getWeather("Phoenix");
}
//get weather information
function getWeather(city) {
  var address = 'http://api.openweathermap.org/data/2.5/forecast?q=' + city.replace(" ", "%20") + '&units=imperial&APPID=1a30146bf0c05ab7c3bc12366b0b55ff';	
  console.log(address);
  var request = getRequestObject();
  request.onreadystatechange = function() {
  	request.onloadend = function() {
	    if(request.status == 404) {
	        document.getElementById('error').innerHTML = "404: Information for " + city + " not found. Are you sure it still exists?";
		} else if (request.status == 401) {
			document.getElementById('error').innerHTML = "401: Key expired or invalid. Contact dev to replace key.";
		} else if (request.status == 403) {
			document.getElementById('error').innerHTML = "403: Forbidden. Key may be invalid or expired. Contact dev for more information.";
		} else if (request.status == 500 || request.status == 501 || request.status == 502 || request.status == 503 || request.status == 504 || request.status == 505) {
			document.getElementById('error').innerHTML = "5xx: api.openweatherapp.org is having server errors. If problem persists, try contacting dev.";
		} else {
	  		parseWeather(request);
	  	}
 	 }
 	}
  request.open("GET", address, true);
  request.send(null);
}
//updates third table with selected option
function updateOpt() {
	var opt = document.getElementById("option");
	var opt = opt.options[opt.selectedIndex].value;
	console.log(opt);
	getWeather(opt);
}

//parse weather information and pass to putWeather
function parseWeather(request) {
	if ((request.readyState == 4) && (request.status == 200)) {
		var weatherJSON = JSON.parse(request.responseText);
		console.log(weatherJSON);
		//determine which row to populate
		var i;
		if(weatherJSON.city.name == "London") {
			i = 1;
		} else if (weatherJSON.city.name == "Phoenix") {
			i = 2;
		} else {
			i = 3;
			//build table, if it is not already on page
			if(!document.getElementById("city3")) {
				var tbl = document.getElementById("table");
				var row = tbl.insertRow(tbl.rows.length)
				row.setAttribute("id", "city3");
				for (j=0;j<cells.length;j++) {
					var cell = row.insertCell(j);
					cell.setAttribute("id", cells[j] + "3");
				}
			}
		}
		//if the city being updated is the option city, wait for row to be built in DOM
		//if not, just put the values in the tables
		if(i==3) {
			document.getElementById("cloud3").onload = putWeather(weatherJSON, i);
		} else {
			putWeather(weatherJSON, i);
		}
		compare();
	}
}
//inserts weather into the appropriate cell
function putWeather(weatherJSON, i) {
	//put results in the table
	document.getElementById("name" + i).innerHTML = weatherJSON.city.name + ", " + weatherJSON.city.country;
	document.getElementById("time" + i).innerHTML = weatherJSON.list[0].dt_txt.replace(" ", ":").replace("-",":").replace("-",":");
	document.getElementById("temp" + i).innerHTML = convertTemp(weatherJSON.list[0].main.temp);
	document.getElementById("hum" + i).innerHTML = weatherJSON.list[0].main.humidity + '%';
	document.getElementById("wind" + i).innerHTML = weatherJSON.list[0].wind.speed;
	document.getElementById("cloud" + i).innerHTML = weatherJSON.list[0].clouds.all + '%';
	//get cookie for time of last call
	var cookie = getCookie(document.getElementById(cells[0]+i).innerText + "time" + i);
	//if cookie is already stored, compare current weather to stored cookies
	if(cookie) {
		//if row does not already exist for city's delta, create a row
		if(!document.getElementById("city" + i + "delta")) {
			var tbl = document.getElementById("table");
			var row = tbl.insertRow(document.getElementById("city" + i).rowIndex + 1)
			row.setAttribute("id", "city" + i + "delta");
			for (j=0;j<cells.length;j++) {
				var cell = row.insertCell(j);
				cell.setAttribute("id", "city" + i + cells[j] + "delta");
			}
		}
		//if the time of the current call does not match, the time of the last,
		if((cookie != document.getElementById("time" + i).innerHTML) && (document.getElementById("city" + i + "namedelta").innerText == document.getElementById("name" + i))) {
			console.log("Weather updated since last call");
			//print deltas in delta table
			document.getElementById("city" + i + "namedelta").innerHTML = weatherJSON.city.name + ", " + weatherJSON.city.country;
			document.getElementById("city" + i + "timedelta").innerHTML = calcUTCdiff(document.getElementById("time" + i).innerHTML, getCookie(document.getElementById("name" + i).innerText + "time" + i)) + " minutes ago";
			document.getElementById("city" + i + "tempdelta").innerHTML = convertTemp(weatherJSON.list[0].main.temp) - getCookie(document.getElementById("name" + i).innerText + "temp" + i);
			document.getElementById("city" + i + "humdelta").innerHTML = weatherJSON.list[0].main.humidity - getCookie(document.getElementById("name" + i).innerText + "hum" + i).replace('%', "");
			document.getElementById("city" + i + "winddelta").innerHTML = weatherJSON.list[0].wind.speed - getCookie(document.getElementById("name" + i).innerText + "wind" + i);
			document.getElementById("city" + i + "clouddelta").innerHTML = weatherJSON.list[0].clouds.all - getCookie(document.getElementById("name" + i).innerText + "cloud" + i).replace('%', "");
			//update deltas in cookies
			document.getElementById("city" + i + "clouddelta").onload = storeDeltas(i);
		} else {
			//otherwise, if delta cookies exist, restore from cookies
			if (getCookie(document.getElementById(cells[0]+i).innerText + cells[0] + i + "delta")) {
				console.log("Restoring deltas from cookies");
				document.getElementById("city" + i + "namedelta").innerHTML = weatherJSON.city.name + ", " + weatherJSON.city.country;
				document.getElementById("city" + i + "timedelta").innerHTML = getCookie(document.getElementById(cells[0]+i).innerText + "time" + i + "delta");
				document.getElementById("city" + i + "tempdelta").innerHTML = getCookie(document.getElementById(cells[0]+i).innerText + "temp" + i + "delta");
				document.getElementById("city" + i + "humdelta").innerHTML = getCookie(document.getElementById(cells[0]+i).innerText + "hum" + i + "delta");
				document.getElementById("city" + i + "winddelta").innerHTML = getCookie(document.getElementById(cells[0]+i).innerText + "wind" + i + "delta");
				document.getElementById("city" + i + "clouddelta").innerHTML = getCookie(document.getElementById(cells[0]+i).innerText + "cloud" + i + "delta");
			//if delta cookies don't exist, print 0 in deltas and store cookies
			} else {
				console.log("Deltas not found. Saving 0's for deltas");
				document.getElementById("city" + i + "namedelta").innerHTML = weatherJSON.city.name + ", " + weatherJSON.city.country;
				document.getElementById("city" + i + "timedelta").innerHTML = 0 + " minutes ago";
				document.getElementById("city" + i + "tempdelta").innerHTML = 0;
				document.getElementById("city" + i + "humdelta").innerHTML = 0;
				document.getElementById("city" + i + "winddelta").innerHTML = 0;
				document.getElementById("city" + i + "clouddelta").innerHTML = 0;
				document.getElementById("city" + i + "clouddelta").onload = storeDeltas(i);
			}
		}
		document.getElementById("city" + i + "clouddelta").onload = storeCookies(i);
	} else {
		document.getElementById("cloud" + i).onload = storeCookies(i);
	}

}
//store the results in the specified table as a cookie
function storeCookies(i) {
	var expires = new Date (new Date().setMonth(new Date().getMonth() + 1)).toUTCString();
	for(k=1;k<cells.length;k++){
		var cname = document.getElementById(cells[0]+i).innerText + cells[k] + i;
		var cvalue = document.getElementById(cells[k] + i).innerText;
		document.cookie = cname + "=" + cvalue + ";" + "expires=" + expires;
	}
}
//store deltas
function storeDeltas(i) {
	console.log("Storing Deltas");
	var expires = new Date (new Date().setMonth(new Date().getMonth() + 1)).toUTCString();
	for(m=1	;m<cells.length;m++){
		var cname = document.getElementById(cells[0]+i).innerText + cells[m] + i + "delta";
		var cvalue = document.getElementById("city" + i + cells[m] + "delta").innerText;
		document.cookie = cname + "=" + cvalue + ";" + "expires=" + expires;
	}
}
//retrieve the specified cookie
function getCookie(cname) {
	var cookies = document.cookie.split(';');
	for(a=0;a<cookies.length;a++) {
		if(cookies[a].startsWith(" ")){
			cookies[a] = cookies[a].substring(1);
		}
	}
	for(b=0;b<cookies.length;b++) {
		if(cookies[b].startsWith(cname +'=')) {
			return cookies[b].substring(cname.length + 1);
		}
	}
	return null;
}
//returns the difference between two UTC times, t1 and t2
function calcUTCdiff(t1, t2) {
	t1 = t1.split(':');
	t2 = t2.split(':');
	var diff = 0;
	if (t1[2] > t2[2]) {
		diff += ((t1[2] - t2[2])*24*60);
	} else if (t1[2] < t2[2]) {
		diff += ((30-(t2[2]-t1[2]))*24*60)
	}
	if (t1[3] > t2[3]) {
		diff += ((t1[3] - t2[3])*60);
	} else if (t1[3] < t2[3]) {
		diff += ((24-(t2[3]-t1[3]))*60);
	}
	diff += ((t1[4] - t2[4]));
	return diff;
}
//refresh results
function refresh() {
	getWeather("London");
	getWeather("Phoenix");
	updateOpt();
	compare();
}
//compare results and print analysis at bottom of page
function compare() {
	document.getElementById("compare1").innerHTML = "The average temperature is " + computeAvgTemp() + "C, and the hottest city is " + computeHighTemp();
	document.getElementById("compare2").innerHTML = "The average humidity is " + computeAvgHum() + "%, and the most humid city is " + computeHighHum();
	var res = computeScore();
	console.log(res);
	document.getElementById("compare3").innerHTML = "The city with the best weather is " + res[0];
	document.getElementById("compare4").innerHTML = "The city with the worst weather is " + res[1];
}
//return the average temp
function computeAvgTemp(){
	var temp = parseFloat(document.getElementById("temp1").innerText);
	temp += parseFloat(document.getElementById("temp2").innerText);
	if (document.getElementById("temp3")){
		temp += parseFloat(document.getElementById("temp3").innerText)
		temp = (temp/3);
	} else {
		temp = (temp/2);
	}
	return temp.toFixed(2);
}
//returns the city with the highest temp out of the temps currently listed in the table
function computeHighTemp() {
	var temp = parseFloat(document.getElementById("temp1").innerText)
	var city = document.getElementById("name1").innerText;
	if(temp < parseFloat(document.getElementById("temp2").innerText)) {
		temp = parseFloat(document.getElementById("temp2").innerText)
		city = document.getElementById("name2").innerText;
	}
	if (document.getElementById("temp3")) {
		if(temp < parseFloat(document.getElementById("temp3").innerText)) {
			city = document.getElementById("name3").innerText;
		}
	}
	return city;
}
//return the average humidity
function computeAvgHum(){
	var hum = parseFloat(document.getElementById("hum1").innerText.replace('%', ''));
	hum += parseFloat(document.getElementById("hum2").innerText.replace('%', ''));
	if (document.getElementById("hum3")){
		hum += parseFloat(document.getElementById("hum3").innerText.replace('%', ''))
		hum = (hum/3);
	} else {
		hum = (hum/2);
	}
	return hum;
}
//returns the city with the highest humidity out of the temps currently listed in the table
function computeHighHum() {
	var hum = parseFloat(document.getElementById("hum1").innerText)
	var city = document.getElementById("name1").innerText;
	if(hum < parseFloat(document.getElementById("hum2").innerText)) {
		hum = parseFloat(document.getElementById("hum2").innerText)
		city = document.getElementById("name2").innerText;
	}
	if (document.getElementById("hum3")) {
		if(hum < parseFloat(document.getElementById("hum3").innerText)) {
			city = document.getElementById("name3").innerText;
		}
	}
	return city;
}
//returns a weather score for each city
function computeScore() {
	var city1 = 0;
	var city2 = 0;
	var city3 = 0;
	//note: obviously this is subjective, so I will go with my preferred weather:
	//temp in the 40s-50sF (~5-15C)
	var temp = Math.abs(10 - parseFloat(document.getElementById("temp1").innerText));
	var best = 1;
	if(temp > Math.abs(10 - parseFloat(document.getElementById("temp2").innerText))) {
		temp = Math.abs(10 - parseFloat(document.getElementById("temp2").innerText))
		best = 2;
	}
	if (document.getElementById("temp3")) {
		if(temp > Math.abs(10 - parseFloat(document.getElementById("temp3").innerText))) {
			best = 3;
		}
	}
	switch(best) {
		case 1:
			city1 += 5;
			break;
		case 2:
			city2 += 5;
			break;
		case 3:
			city3 += 5;
			break;
	}
	//relatively indifferent as far as humidity goes, but if it's hot, I hate if it's humid
	for(i=1;i<3;i++) {
		if(parseFloat(document.getElementById("temp" + i).innerText > 25)) {
			if (parseFloat(document.getElementById("hum" + i).innerText.replace('%', '')) > 60) {
				switch(i) {
					case 1:
						city1 -= 5;
						break;
					case 2:
						city2 -= 5;
						break;
					case 3:
						city3 -= 5;
						break;
				}
			}
		}
	}
	//I'm also indifferent as far as wind goes, but I would prefer no winddelta if it's cold, and like it if it's hot.
	for(i=1;i<3;i++) {
		if(parseFloat(document.getElementById("temp" + i).innerText < 5)) {
			if (parseFloat(document.getElementById("wind" + i).innerText > 10)) {
				switch(i) {
					case 1:
						city1 -= 5;
						break;
					case 2:
						city2 -= 5;
						break;
					case 3:
						city3 -= 5;
						break;
				}
			}
		} else if(parseFloat(document.getElementById("temp" + i).innerText > 25)) {
			if (parseFloat(document.getElementById("wind" + i).innerText > 10)) {
				switch(i) {
					case 1:
						city1 += 5;
						break;
					case 2:
						city2 += 5;
						break;
					case 3:
						city3 += 5;
						break;
				}
			}
		}
	}
	//similarly, I'm relatively indifferent about cloudiness, but I appreciate it when it's hot
	for(i=1;i<3;i++) {
		if(parseFloat(document.getElementById("temp" + i).innerText > 25)) {
			if (parseFloat(document.getElementById("cloud" + i).innerText.replace('%', '')) > 50) {
				switch(i) {
					case 1:
						city1 += 5;
						break;
					case 2:
						city2 += 5;
						break;
					case 3:
						city3 += 5;
						break;
				}
			}
		}
	}
	//calculate best city
	best = document.getElementById("name1").innerText;
	if (city1 < city2) {
		best = document.getElementById("name2").innerText;
	}
	if (city2 < city3) {
		best = document.getElementById("name3").innerText;
	}
	//calculate worst city
	worst = document.getElementById("name1").innerText;
	if (city1 > city2) {
		worst = document.getElementById("name2").innerText;
	}
	if (city2 > city3) {
		worst = document.getElementById("name3").innerText;
	}
	//return an array containing results
	return [best, worst];
}