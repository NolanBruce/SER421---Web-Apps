var express = require('express');
var app = express();
var fs = require('fs')
var xml2js = require('xml2js');
var session = require('express-session');
var bodyParser = require('body-parser');
app.listen(8080);
//sets up session
app.use(session({
	secret: 'idk',
	resave: false,
	saveUninitialized: true

}))
//used to parse post parameters
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));
//reject put methods
app.put('*', function(req, res) {
	var page = 'Error 405: Put method not Allowed';
    res.writeHead(405);
    res.end(page);
});
//reject delete methods
app.delete('*', function(req, res) {
	var page = 'Error 405: Delete method not Allowed';
    res.writeHead(405);
    res.end(page);
});
//reject options methods
app.options('*', function(req, res) {
	var page = 'Error 405: Options method not Allowed';
    res.writeHead(405);
    res.end(page);
});
//reject connect methods
app.connect('*', function(req, res) {
	var page = 'Error 405: Connect method not Allowed';
    res.writeHead(405);
    res.end(page);
});
//redirect to landing page 
app.get('/', function(req, res) {
	res.redirect('/NewNews/news');
});
//redirect to landing page
app.get('/NewNews', function(req, res) {
	res.redirect('/NewNews/news');
});
//redirect to landing page
app.post('/NewNews/news', function(req, res) {
	res.redirect('/NewNews/news');
});
//build landing page
app.get('/NewNews/news', function(req, res) {
	getNews(req, function(news) {
		var page = ""
		if (req.session.userName) {
			page += '<h2>Welcome, ' + req.session.userName +
				'. You are logged in as a ' + req.session.role + '.</h2>';
			page += logoutForm();
			if (req.session.role == 'Reporter') {
				page += addLink();
			}
		} else {
			page += '<h2>Welcome, guest.</h2>';
			page += loginForm();
		}
		page += news;
		res.send(page);
	});
});
//print passed article
app.get('/NewNews/view', function(req, res) {
	getArticle(req.query['Title'], function(content) {
		var page = backForm();
		page += content;
	  	res.send(page);
	});
});
//adds an article to the persistent store
app.post('/NewNews/view', function(req,res) {
	var newsXML = "news.xml";
	//read xml file
	fs.readFile(newsXML, "utf-8", function(error, articles) {
		if (error) {
			return "Error retrieving articles";
		} else {
			var parser = new xml2js.Parser();
			//parse xml file to object
			parser.parseString(articles, function(error, json) {
				if (error) {
					console.log("Error parsing articles from xml");
				}
				//push article onto parsed object
				var i = json['NEWS']['ARTICLE'].length + 1;
				json['NEWS']['ARTICLE'].push({"TITLE": req.body.title, "AUTHOR": req.session.userName, "PUBLIC": req.body.visibility, "CONTENT": req.body.content});
				var builder = new xml2js.Builder()
				//return object back to xml
				var xml = builder.buildObject(json);
				//write to
				fs.writeFile(newsXML, xml, function(error, data){
	            	if (error) {
	            		console.log(error);
	            	} else {
	            		console.log('Added "' + req.body.title + '" to persistent store.');
	            	}
	        	});
			});
		}
	});
	
	res.redirect('/NewNews/news');
});
//write error status if user attempts a get at /logger
app.get('/NewNews/logger', function(req, res) {
	var page = 'Error 400: Cannot get /NewNews/logger';
    res.writeHead(400);
    res.end(page);
});
//either print login form or 
//save username and roles to session and redirects to landing page
app.post('/NewNews/logger', function(req,res) {
	//if a userName is not passed, print login form
	if (req.body.userName == undefined) {
		var page = backForm();
		page += '<form action method ="POST">';
		page += 'User Name:' + '<br>';
		page += '<input type="text" name="userName" cols="50" required>' + '<br>';
		page += 'User Role:' + '<br>';
		page += 'Subscriber';
		page += '<input type="radio" name="role" value="Subscriber" checked>' + '<br>';
		page += 'Reporter';
		page += '<input type="radio" name="role" value="Reporter">' + '<br>';
		page += '<input type="submit" value="Submit">';
		page += '</form>';
		res.send(page);
	//if userName is passed, user is attempting to log in
	} else {
		var json = 'newsusers.json';
		fs.readFile(json, "utf-8", function(error, articles) {
			if (error) {
				return "Error retrieving users";
			} else {
				var users = fs.readFileSync(json);
				var usersJSON = JSON.parse(users);
				var session = req.session;
				session.userName = req.body.userName;
				session.role = req.body.role;
				var exists = false;
				//if user already exists, sign them in under saved role, regardless of submitted role
				for(i=0;i<usersJSON.users.length;i++) {
					if(usersJSON.users[i].name == session.userName) {
						session.role = usersJSON.users[i].role;
						exists = true;
					}
				}
				//if user did not previously exist, add them to the persistent store
				if(!exists) {
					usersJSON.users.push({"name":session.userName,"role":session.role});
					fs.writeFile(json, JSON.stringify(usersJSON), function(error) {
						if (error) {
							throw error;
						}
						console.log("Added " + session.userName + " to persistent store.");
					});
				}
				session.save();
			}
		});
		res.redirect('/NewNews/news');
	}
});
//write error status if user attempts a get at /logout
app.get('/NewNews/logout', function(req, res) {
	var page = 'Error 400: Cannot get /NewNews/logout';
    res.writeHead(400);
    res.end(page);
});
//logout user and redirect to landing page
app.post('/NewNews/logout', function(req,res) {
	var session = req.session;
	session.destroy();
	res.redirect('/NewNews/news');
});
//write error status if user attempts a get at /remove
app.get('/NewNews/remove', function(req, res) {
	var page = 'Error 400: Cannot get /NewNews/remove';
    res.writeHead(400);
    res.end(page);
});
//post page after article removal confirmation that deletes article
//and then redirects to landing page
app.post('/NewNews/remove', function(req,res) {
	if(req.body.confirm == 'T') {
		console.log('Call to delete article "' + req.body.title + '"' );
		var newsXML = "news.xml";
		//load articles from xml file
		fs.readFile(newsXML, "utf-8", function(error, articles) {
		if (error) {
			return "Error retrieving articles";
		} else {
			var parser = new xml2js.Parser();
			//parse xml file to object
			parser.parseString(articles, function(error, json) {
				if (error) {
					console.log("Error parsing articles from xml");
				}
				//find article in object
				for(i=0;i<json['NEWS']['ARTICLE'].length;i++) {
					if (req.body.title == json['NEWS']['ARTICLE'][i]['TITLE'])
					{
						//remove article
						console.log('Located article at position ' + i + '.');
						if(req.session.userName != json['NEWS']['ARTICLE'][i]['AUTHOR']) {
							var page = 'Error 403: Forbidden';
						    res.status(405);
						    res.end(page);
						} else {
							delete json['NEWS']['ARTICLE'][i];
							//return object back to xml
							var builder = new xml2js.Builder()
							var xml = builder.buildObject(json);
							//write to file
							fs.writeFile(newsXML, xml, function(error, data){
				            	if (error) {
				            		console.log(err);
				            	} else {
				            		console.log('Removed "' + req.body.title + '" from persistent store.');
				            		res.redirect('/NewNews/news');
				            	}
				        	});
				        	res.redirect('/NewNews/news');
						}
					}
				}
			});
		}
	});
	} else {
		page = backForm();
		page += 'Do you wish to delete "' + req.body.title + '"?'
		page += '<form action method ="POST">';
		page += '<input type="hidden" name="title" value="' + req.body.title+ '">';
		page += '<input type="hidden" name="confirm" value="T">';
		page += '<input type="submit" value="Continue">';
		page += '</form>';
		res.send(page);
	}
});
//page for creating an article
app.get('/NewNews/add', function(req,res) {
	var page = backForm();
	page += '<form action="/NewNews/view" method ="POST">';
	page += 'Title: ';
	page += '<input type="text" name="title" cols="75" required>' + '<br>';
	page += 'Article Visibility: ';
	page += 'Private' + '<input type="radio" name="visibility" value="F">';
	page += 'Public' + '<input type="radio" name="visibility" value="T" checked>' + '<br>';
	page += '<textarea name="content" rows="25" cols="100" required>';
	page += '</textarea>' + '<br>';
	page += '<input type="submit" value="Submit">';
	page += '</form>';
	res.send(page);
});
//generates a login form	
//to be used on any page for a not logged in user
function loginForm() {
	var form = '<form method ="POST" action="logger">';
	form += '<input type="submit" value="Login">';
	form += '</form>';
	return form
}
//generates a logout form
//to be used on any page for a logged in user
function logoutForm() {
	var form = '<form method ="POST" action="logout">';
	form += '<input type="submit" value="Logout">';
	form += '</form>';
	return form
}
//generates a back button
//to be used on all pages besides the main page
function backForm() {
	var form = '<form method ="POST" action="./news">';
	form += '<input type="submit" value="Back">';
	form += '</form>';
	return form;
}
//generates a link to add an article
function addLink() {
	var link = '<a href="/NewNews/add">Create New Article</a><br><br>';
	return link;
}
//builds a link to an article based on the title
function articleLink(req, xml, i) {
	var session = req.session;
	var title = xml['NEWS']['ARTICLE'][i]['TITLE'];
	var author = xml['NEWS']['ARTICLE'][i]['AUTHOR'];
	var public = xml['NEWS']['ARTICLE'][i]['PUBLIC'];
	var link = "";
	//print link if user has access or just the title otherwise
	if(public == 'T' || req.session.role == 'Subscriber' || req.session.userName == author) {
		if (req.session.userName == author) {
			link += '<form method ="POST" action="./remove">';
		}
		link += '<a href="/NewNews/view?Title=';
		link += title + '">' + title;
		link += '</a>';
		//if user is the author of the article, add delete form
		if (req.session.userName == author) {
			link += '<input type="hidden" name="title" value="' + title + '">';
			link += '<input type="hidden" name="confirm" value="F">';
			link += '<input type="submit" value="delete">';
			link += '</form>';
		} else {
			link += '<br><br>';
		}
	} else {
		link += title + '<br><br>';
	}
	return link;
}
//fetches the XML News file and returns a list of the titles with links to content
function getNews(req, callback){
	var newsXML = "news.xml";
	var articles, xml;
	var parser = new xml2js.Parser();
	//read xml from file and parse it into xml object articles
	fs.readFile(newsXML, "utf-8", function(error, xml) {
		if (error) {
			return "Error retrieving news";
		} else {
			parser.parseString(xml, function(error, xml) {
				if (error) {
					console.log("Error parsing articles from xml")
				}
				var links ="";
				for (i=0;i<xml['NEWS']['ARTICLE'].length;i++) {
					//console.log(i + " = " + xml['NEWS']['ARTICLE'][i]['TITLE'])
					links += articleLink(req, xml, i);
				}
				callback(links);
			});
		}
	});
}
//fetches the content of an article with the passed title
function getArticle(title, callback){
	var newsXML = "news.xml";
	var articles, xml;
	var parser = new xml2js.Parser();
	//read xml from file and parse it into xml object articles
	fs.readFile(newsXML, "utf-8", function(error, xml) {
		if (error) {
			return "Error retrieving news";
		} else {
			parser.parseString(xml, function(error, xml) {
				if (error) {
					console.log("Error parsing articles from xml")
				}
				var content ="";
				for (i=0;i<xml['NEWS']['ARTICLE'].length;i++) {
					//console.log(i + " = " + xml['NEWS']['ARTICLE'][i]['TITLE'])
					if(title == xml['NEWS']['ARTICLE'][i]['TITLE']) {
						callback(xml['NEWS']['ARTICLE'][i]['CONTENT'])
					}
				}
				
			});
		}
	});
}
//catch any other GET or PUT methods on invalid paths
app.get('*', function (req, res) {
    var page = 'Error 404: Page not found';
    res.writeHead(404);
    res.end(page);
});
app.put('*', function (req, res) {
    var page = 'Error 404: Page not found';
    res.writeHead(404);
    res.end(page);
});