const suspects = ['Reverend Mr. Green','Colonel Mustard','Mrs. Peacock','Professor Plum','Miss Scarlett','Mrs. White'];
const weapons = ['Candlestick','Dagger','Lead Pipe','Revolver','Rope','Wrench'];
const rooms = ['Ballroom','Billiard Room','Conservatory','Dining Room','Hall','Kitchen','Library','Lounge','Study'];
var player;

function listCards(){ 
	sessionStorage.clear();
	var cards = suspects.join(", ");
	document.getElementById("suspectCards").innerHTML = 'Suspects: ' + cards;
	cards = weapons.join(", ");
	document.getElementById("weaponCards").innerHTML = 'Weapons: ' + cards;
	cards = rooms.join(", ");
	document.getElementById("roomCards").innerHTML = 'Rooms: ' + cards;
}

function startGame() {
	sessionStorage.clear();
	player = document.getElementById("nameInput").value;
	console.log("Starting game as " + player);
	//combine cards and distribute them to player and computer
	var cards = suspects.concat(weapons).concat(rooms);
	var j = cards.length;
	//randomly determine the secret triplet and store in the first three sessionStorage memory locations
	var num = Math.floor(Math.random()*suspects.length);
	sessionStorage[0] = cards[num];
	cards.splice(num, 1);
	num = Math.floor(Math.random()*weapons.length)+(suspects.length-1);
	sessionStorage[1] = cards[num];
	cards.splice(num, 1);
	num = Math.floor(Math.random()*rooms.length)+(suspects.length+weapons.length-2);
	sessionStorage[2] = cards[num];
	cards.splice(num, 1);
	//distribute the remaining cards through session storage
	//where 3 through (1+(n-3/2)) are the player's cards
	//and (1+(n-3/2)) through n-1 are the computer's cards
	for(i=3;i<j;i++) {
		num = Math.floor(Math.random()*cards.length);
		sessionStorage[i] = cards[num];
		cards.splice(num, 1);
		//to do: udpate sessionStorage to ensure first three cards include exactly one of each type
	}
	//Welcome player and inform them of the cards in their hand
	var greeting = 'Welcome, ' + document.getElementById("nameInput").value + '. ';
	greeting += "You have the following cards: ";
	for(i=3;i<(3+((j-3)/2));i++) {
		greeting += sessionStorage[i];
		if(i<(2+(j-3)/2)) {
			greeting += ", ";
		} else {
			greeting += ".";
		}
	}
	//inform user of their cards
	var elem = document.createElement("p");
	elem.appendChild(document.createTextNode(greeting));
	elem.setAttribute("id", "greeting")
	document.getElementById("nameForm").removeChild(document.getElementById("name"));
	document.getElementById("nameForm").appendChild(elem);
	//initialize counter for number of turns taken.
	sessionStorage[j] = 0;
	console.log(sessionStorage);
	//enable guess button
	document.getElementById("guess").disabled = false;
	fillChoiceBoxes();
}

function fillChoiceBoxes() {
	//if cards have been distributed, populate option boxes with all cards not in player's hand
	var k = suspects.concat(weapons).concat(rooms).length;
	if (sessionStorage[k-1]) {
		//repopulate suspect choice boxes with only cards not in player's hand
		var box = document.getElementById("suspects");
		box.length = 0;
		for(i=0;i<suspects.length;i++) {
			var flag = false;
			for(j=3;j<(3+((k-3)/2));j++) {
				if (suspects[i] == sessionStorage[j]) {
					flag = true;
				}
			}
			if (!flag) {
				var sus = document.createElement("option");
				sus.text = suspects[i];
				sus.value = suspects[i];
				box.options.add(sus);
			}
		}
		//repeat weapon choice box
		var box = document.getElementById("weapons");
		box.length = 0;
		for(i=0;i<weapons.length;i++) {
			var flag = false;
			for(j=3;j<(3+((k-3)/2));j++) {
				if (weapons[i] == sessionStorage[j]) {
					flag = true;
				}
			}
			if (!flag) {
				var weapon = document.createElement("option");
				weapon.text = weapons[i];
				weapon.value = weapons[i];
				box.options.add(weapon);
			}
		}
		//repeat for room choice box
		var box = document.getElementById("rooms");
		box.length = 0;
		for(i=0;i<rooms.length;i++) {
			var flag = false;
			for(j=3;j<(3+((k-3)/2));j++) {
				if (rooms[i] == sessionStorage[j]) {
					flag = true;
				}
			}
			if (!flag) {
				var room = document.createElement("option");
				room.text = rooms[i];
				room.value = rooms[i];
				box.options.add(room);
			}
		}
	//if cards have not been distributed, fill box with all options
	} else {
		var box = document.getElementById("suspects");
		//populate suspects choice box
		for(i=0;i<suspects.length;i++) {
			var sus = document.createElement("option");
			sus.text = suspects[i];
			sus.value = suspects[i];
			box.options.add(sus);
		}
		box = document.getElementById("weapons");
		//populate weapon choice box
		for(i=0;i<weapons.length;i++) {
			var weapon = document.createElement("option");
			weapon.text = weapons[i];
			weapon.value = weapons[i];
			box.options.add(weapon);
		}
		box = document.getElementById("rooms");
		//populate room choice box
		for(i=0;i<rooms.length;i++) {
			var room = document.createElement("option");
			room.text = rooms[i];
			room.value = rooms[i];
			box.options.add(room);
		}
	}
}
//make guess based on current selection in option boxes
function makeGuess() {
	//increment turn counter
	var k = suspects.concat(weapons).concat(rooms).length;
	sessionStorage[k] = parseInt(sessionStorage[k])+1;
	//fetch player's guess
	var sus = document.getElementById("suspects");
	sus = sus.options[sus.selectedIndex].value;
	var weapon = document.getElementById("weapons");
	weapon = weapon.options[weapon.selectedIndex].value;
	var room = document.getElementById("rooms");
	room = room.options[room.selectedIndex].value;
	var lastPGuess = "You guessed: " + sus + " with the " + weapon + " in the " + room + ".";
	//add player's guess to history
	var turn = parseInt(sessionStorage[k]);
	sessionStorage[k+(2*turn-1)] = sessionStorage[k] + ": " + lastPGuess;
	//if guess is correct, inform user they won
	if(sus == sessionStorage[0] && weapon == sessionStorage [1] && room == sessionStorage[2]) {
		var winText = "Correct! You win!";
		var elem = document.createElement("p");
		elem.appendChild(document.createTextNode(winText));
		document.getElementById("nameForm").removeChild(document.getElementById("greeting"));
		document.getElementById("nameForm").appendChild(elem);
		//record game results in local storage
		//first update win count for player
		if(!localStorage[0]) {
			localStorage[0] = 1;
		} else {
			localStorage[0] = parseInt(localStorage[0]) + 1;
		}
		//determine number of games played
		var games;
		if(localStorage[0] && localStorage[1]) {
			games = parseInt(localStorage[0]) + parseInt(localStorage[1])
		} else {
			games = parseInt(localStorage[0]);
		}
		//record results
		var currentDate = new Date();
		var month = currentDate.getMonth() + 1;
		var day = currentDate.getDate();
		var year = currentDate.getFullYear();
		currentDate = month + "/" + day + "/" + year;
		localStorage[games+1] = "CPU played " + player + " on " + currentDate + ". " + player + " won.";
		console.log(localStorage);
		//change onclick to start a new game
		document.getElementById("continue").onclick = function(){location.reload();};
	//if not, print the user's guess and inform them of one random option that was wrong
	} else {
		if (document.body.contains(document.getElementById("lastPGuess"))) {
			document.getElementById("nameForm").removeChild(document.getElementById("lastPGuess"));
		}
		//determine a random incorrect option to inform user of
		var wrong = new Array();
		if(sus != sessionStorage[0]) {
			wrong.push(sus);
		}
		if(weapon != sessionStorage[1]) {
			wrong.push(weapon);
		}
		if(room != sessionStorage[2]) {
			wrong.push(room);
		}
		lastPGuess += " " + wrong[Math.floor(Math.random()*wrong.length)] + " is not correct.";
		var elem = document.createElement("p");
		elem.appendChild(document.createTextNode(lastPGuess));
		elem.setAttribute("id", "lastPGuess")
		document.getElementById("nameForm").appendChild(elem);
		//remove history if currently showing
		if (document.body.contains(document.getElementById("history"))) {
			document.getElementById("hisForm").removeChild(document.getElementById("history"));
			document.getElementById("hisButton").value = "Show History";
		}
		console.log(sessionStorage);
	}
	//disable guess button until continue button is clicked
	document.getElementById("guess").disabled = true;
	document.getElementById("continue").disabled = false;
}
function cpuGuess() {
	var k = suspects.concat(weapons).concat(rooms).length;
	var cpuCards = new Array();
	var cpuOptions = new Array();
	var sus, weapon, room
	//grab all suspects in cpu's hand
	for(i=(3+((k-3)/2));i<k;i++) {
		if (suspects.includes(sessionStorage[i])) {
			cpuCards.push(sessionStorage[i]);
		}
	}
	//determine cpu options from suspects not in cpu's hand
	for(i=0;i<suspects.length;i++) {
		if(!cpuCards.includes(suspects[i])) {
			cpuOptions.push(suspects[i])
		}
	}
	//determine a random suspect guess from cpu's options
	sus = cpuOptions[Math.floor(Math.random()*cpuOptions.length)];
	//grab all weapons in cpu's hand
	cpuCards = [];
	cpuOptions = [];
	for(i=(3+((k-3)/2));i<k;i++) {
		if (weapons.includes(sessionStorage[i])) {
			cpuCards.push(sessionStorage[i]);
		}
	}
	//determine cpu options from weapons not in cpu's hand
	for(i=0;i<weapons.length;i++) {
		if(!cpuCards.includes(weapons[i])) {
			cpuOptions.push(weapons[i])
		}
	}
	//determine a random weapon guess from cpu's options
	weapon = cpuOptions[Math.floor(Math.random()*cpuOptions.length)];
	//grab all rooms in cpu's hand
	cpuCards = [];
	cpuOptions = [];
	for(i=(3+((k-3)/2));i<k;i++) {
		if (rooms.includes(sessionStorage[i])) {
			cpuCards.push(sessionStorage[i]);
		}
	}
	//determine cpu options from rooms not in cpu's hand
	for(i=0;i<rooms.length;i++) {
		if(!cpuCards.includes(rooms[i])) {
			cpuOptions.push(rooms[i])
		}
	}
	//determine a random weapon guess from cpu's options
	room = cpuOptions[Math.floor(Math.random()*cpuOptions.length)];
	//update user with CPU guess information
	var lastCPUGuess = "The CPU Opponent guessed: " + sus + " with the " + weapon + " in the " + room + ".";
	//add cpu's guess to history
	var turn = parseInt(sessionStorage[k]);
	sessionStorage[k+(2*turn)] = sessionStorage[k] + ": " + lastCPUGuess;
	//if guess is correct, inform user the cpu won
	if(sus == sessionStorage[0] && weapon == sessionStorage [1] && room == sessionStorage[2]) {
		var winText = "The CPU Opponent guess correctly. You lose!";
		var elem = document.createElement("p");
		elem.appendChild(document.createTextNode(winText));
		document.getElementById("nameForm").removeChild(document.getElementById("greeting"));
		document.getElementById("nameForm").appendChild(elem);
		//record game results in local storage
		//first update win count for computer
		if(!localStorage[1]) {
			localStorage[1] = 1;
		} else {
			localStorage[1] = parseInt(localStorage[1]) + 1;
		}
		//determine number of games played
		var games;
		if(localStorage[0] && localStorage[1]) {
			games = parseInt(localStorage[0]) + parseInt(localStorage[1])
		} else {
			games = parseInt(localStorage[1]);
		}
		//record results
		var currentDate = new Date();
		var month = currentDate.getMonth() + 1;
		var day = currentDate.getDate();
		var year = currentDate.getFullYear();
		currentDate = month + "/" + day + "/" + year;
		localStorage[games+1] = "CPU played " + player + " on " + currentDate + ". CPU won.";
		console.log(localStorage);
		//change onclick to start a new game
		document.getElementById("continue").onclick = function(){location.reload();};
	//if not, inform user of the CPU guess
	} else {
		if (document.body.contains(document.getElementById("lastCPUGuess"))) {
			document.getElementById("nameForm").removeChild(document.getElementById("lastCPUGuess"));
		}
		var elem = document.createElement("p");
		elem.appendChild(document.createTextNode(lastCPUGuess));
		elem.setAttribute("id", "lastCPUGuess")
		document.getElementById("nameForm").appendChild(elem);
		//disable continue button until guess button is clicked
		document.getElementById("guess").disabled = false;
		document.getElementById("continue").disabled = true;
	}
}
function showHistory() {
	var k = suspects.concat(weapons).concat(rooms).length;
	//if no guess has been made, tell user to make a guess to see history
	if(!sessionStorage[k+1]) {
		if (document.body.contains(document.getElementById("noHis"))) {
			//intentionally left blank
		} else {
			var elem = document.createElement("p");
			elem.appendChild(document.createTextNode("Make a guess to see the history"));
			elem.setAttribute("id", "noHis")
			document.getElementById("hisForm").appendChild(elem);
		}
	//otherwise, print all guess by user and cpu
	} else {
		//remove any warning about no history
		if (document.body.contains(document.getElementById("noHis"))) {
			document.getElementById("hisForm").removeChild(document.getElementById("noHis"));
		}
		//if history is currently displayed, remove history and replace with Show History button
		if (document.body.contains(document.getElementById("history"))) {
			document.getElementById("hisForm").removeChild(document.getElementById("history"));
			document.getElementById("hisButton").value = "Show History";
		//otherwise, fetch history and change button to Hide History
		} else {
			//fetch history
			var elem = document.createElement("p");
			for (i=k+1;sessionStorage[i];i++) {
				elem.appendChild(document.createTextNode(sessionStorage[i]));
				elem.appendChild(document.createElement("br"));
				if(Math.abs(i % 2) == 1) {
					elem.appendChild(document.createElement("br"));
				}
			}
			elem.setAttribute("id", "history")
			document.getElementById("hisForm").appendChild(elem);
			document.getElementById("hisButton").value = "Hide History";
		}
	}
}
function showRecord() {
	//if no games have been recorded, inform user as much
	if (!localStorage[0] && !localStorage[1]) {
		if (document.body.contains(document.getElementById("noRec"))) {
			//intentionally left blank
		} else {
			//print message
			var elem = document.createElement("p");
			elem.appendChild(document.createTextNode("No games have been recorded"));
			elem.setAttribute("id", "noRec")
			document.getElementById("recForm").appendChild(elem);
		}
	//otherwise print records
	} else {
		//remove any warning about no records
		if (document.body.contains(document.getElementById("noRec"))) {
			document.getElementById("recForm").removeChild(document.getElementById("noRec"));
		}
		//if records are currently displayed, remove them and return to Show record button
		} if (document.body.contains(document.getElementById("record"))) {
				document.getElementById("recForm").removeChild(document.getElementById("record"));
				document.getElementById("recButton").value = "Show Record";
		} else {
			//fetch number of games place and win/loss ratio
			var games, ratio;
			if(localStorage[0] && localStorage[1]) {
				games = parseInt(localStorage[0]) + parseInt(localStorage[1])
				ratio = localStorage[0] + ":" + localStorage[1];
			} else if (localStorage[0]) {
				games = parseInt(localStorage[0]);
				ratio = localStorage[0] + ":0";
			} else {
				games = parseInt(localStorage[1]);
				ratio = "0:" + localStorage[1];
			}
			//print message
			var elem = document.createElement("p");
			elem.appendChild(document.createTextNode("Ratio = " + ratio));
			elem.appendChild(document.createElement("br"));
			for(i=2;localStorage[i];i++) {
				elem.appendChild(document.createTextNode(localStorage[i]));
				elem.appendChild(document.createElement("br"));
			}
			elem.setAttribute("id", "record")
			document.getElementById("recForm").appendChild(elem);
			document.getElementById("recButton").value = "Hide Record";
		}
}
