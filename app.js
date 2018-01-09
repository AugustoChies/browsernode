var express = require("express");
var google = require("googleapis");
var fs = require("fs");
var bodyParser = require('body-parser');

var ingame=false;


//game info--------------------------------
var rules={
	"playerspeed": 150,
	"bulletcounter": 50,
	"enemycounter": 20,
	"windistance" : 1000
}

var distance=0;
var distance_enemy=0;
var dead=false;
var other_dead=false;
var xposition=0;
var xposition_other=0;
//---------------------------------------------

var logged= [];

var app = express();

app.use(express.static('static'));

app.use(bodyParser.json());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));


var server = app.listen(8080, function() {
  var host = server.address().address;
  var port = server.address().port;
  
  console.log('Example app listening at http://%s:%s', host, port);
});


var OAuth2 = google.auth.OAuth2;

var oauth2Client = new OAuth2(
  '481038169186-1qmeg86o3r9fug0veao0m2p3ob5lt404.apps.googleusercontent.com',
  'l9WfEPQtpt0EyCQXYMCsqieF',
  'http://localhost:8080/oauthcallback'
);

// generate a url that asks permissions for Google+ and Google Calendar scopes
var scopes = [
  'https://www.googleapis.com/auth/plus.me'
];

var url = oauth2Client.generateAuthUrl({
  access_type: 'offline', // 'online' (default) or 'offline' (gets refresh_token)
  scope: scopes // If you only need one scope you can pass it as string
});


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept,Authorization");
  next();
});

app.get("/url", function(req, res) {
  res.send(url);
});

app.get("/tokens", function(req, res) {

  var code = req.query.code;
  console.log(code);

  oauth2Client.getToken(code, function(err, tokens) {
    if (err) {
      console.log(err);
      res.send(err);
      return;
    }

    console.log(tokens);
    oauth2Client.setCredentials(tokens);
	  
	if(logged.length < 2)
	{
		if(ingame)
		{
			res.send("ingame")	
		}
		else{
			logged.push(tokens.access_token);
			res.send(tokens);
		}
	}
	else
	{	
		if(ingame)
		{
			res.send("ingame")	
		}
		else{
			logged = [];	
			logged.push(tokens.access_token)
			res.send(tokens);
		}
	}
	
    
	
	  
	
  });
});

app.get("/tokensmobile", function(req, res) {
 
 	 var token = "";
 	 var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

 	 for (var i = 0; i < 40; i++)
	 {
 	   token += possible.charAt(Math.floor(Math.random() * possible.length));
	 }
	
	 console.log(token);
	    if(logged.length < 2)
	 	{
		 	if(ingame)
		 	{
			 	res.send("ingame")	
		 	}
		 	else{
			 	logged.push(token);
			 	res.send(token);
		 	}
	 	}
		else
		{	
			if(ingame)
			{
				res.send("ingame")	
			}
			else{
				logged = [];	
				logged.push(token);
			 	res.send(token);
			}
		}
  
});

app.get("/waiting", function(req, res) {
		  
		 var uid = req.params.uid,
		     path = req.params[0] ? req.params[0] : 'waitroom/wait.html';
		 res.sendFile(path, {root: './static'});
});

app.get("/waiting/wait", function(req, res) {
	
		var aut = req.get('Authorization');
		if( aut == "IN%20GAME")
		{
			res.send("Game in progress, try again later") 
		}
		else{
			var logado=false;
			for (i = 0; i < logged.length; i++) { 
				if(aut == logged[i]){
					logado=true;
					break;
				}
					
			}
		
			if(logado)
				{
					if(logged.length == 2)
					{
						if(ingame)
						{
							res.send("Game in progress, try again later")
						}
						else
						{
							res.end("start");
						}
					}
					else{
						res.end("Waiting for another player");
					}
				}
			else{
				res.end("Log-in first");
			}
		}
	
});


app.get("/game", function(req, res) {
			var uid = req.params.uid,
				path = req.params[0] ? req.params[0] : 'game/gallahad.html';
			res.sendFile(path, {root: './static'});
			
		
		  distance=0;
		  distance_enemy=0; 
		  dead=false;
		  other_dead=false;
		  xposition=0;
		  xposition_other=0;
		  ingame=true;
});


app.get("/game/rules", function(req, res) {
		  
		  var rulesresp = JSON.stringify(rules);
		  res.end(rulesresp);
});

app.post('/game/ender', function (req, res) {
	
	var aut = req.get('Authorization');
	var logado=false;
	for (i = 0; i < logged.length; i++) { 
		if(aut == logged[i]){
			logado=true;
			break;
		}
			
	}
	if(!logado)
		{
		res.end("notlog");
		}
	else
	{
		ingame=false;
		logged=[];
		res.end("accepted");
	}
	
});


app.post('/game/usuario', function (req, res) {
	
	var aut = req.get('Authorization');
	var logado=false;
	for (i = 0; i < logged.length; i++) { 
		if(aut == logged[i]){
			logado=true;
			break;
		}
			
	}
	if(!logado)
		{
		res.end("notlog");
		}
	else
	{
		if(aut == logged[0])
		{
			xposition=req.body.pos;
			dead = req.body.dead;
		}
		else if(aut == logged[1])
		{
			xposition_other=req.body.pos;
			other_dead = req.body.dead;
		}
		res.end("accepted");
	}
	
});

app.get("/game/usuario", function(req,res){
	var aut = req.get('Authorization');
	var logado=false;
	for (i = 0; i < logged.length; i++) { 
		if(aut == logged[i]){
			logado=true;
			break;
		}
			
	}
	if(!logado)
		{
			res.end("notlog");
		}
	else
	{
	
		var newdata= "";
		
		if(aut == logged[0])
		{
			//distance +=  (0.5 * (xposition/800) + 0.2) * 3;
			newdata = {
				"distance": distance,
				"distance_opponent" : distance_enemy,
				"enemy_dead" : other_dead
			};
			res.statusCode = 200;
			res.end(JSON.stringify(newdata));
		}
		else if(aut == logged[1])
		{
			//distance_enemy +=  (0.5 * (xposition_other/800) + 0.2) * 3;
			newdata = {
				"distance": distance_enemy,
				"distance_opponent" : distance,
				"enemy_dead" : dead
			};
			res.statusCode = 200;
			res.end(JSON.stringify(newdata));
		}
	}
});



function mainloop()
{
	if(ingame)
	{
		distance +=  (0.5 * ((xposition/800) * 2) + 0.2) * 3;
		distance_enemy +=  (0.5 * ((xposition_other/800) * 2) + 0.2) * 3;
	}
	setTimeout(mainloop, 50);
}

setTimeout(mainloop, 50);


