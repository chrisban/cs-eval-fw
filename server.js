var express = require('express');
var fs = require('fs');
var app = express();
var bodyParser = require('body-parser');

// for parsing application/json
app.use(bodyParser.json()); 

//fix static links
app.use('/js', express.static(__dirname + '/frontEnd/js'));
app.use('/css', express.static(__dirname + '/frontEnd/css'));

//response to requests
app.get('/', function (req, res) {
 	res.sendFile( __dirname + "/frontEnd/" );
});

app.get('/upload/', function (req, res) {
 	res.sendFile( __dirname + "/frontEnd/data_upload/upload.html" );
});

//handle post request to retrieve datafiles
app.post('/post', function (req, res) {
	console.log(req.body);
	var file = __dirname + '/dataFiles/data' + req.body.test_id + '.json';
	var data = { result: "Server file load error!"};
	//proof of concept
	if(req.body.test_id == '0')
	{
		fs.readFile(file, 'utf8', function (err, datafile) {
			if (err) {
				console.log('E: ' + err);
				return;
			}

			//parse result, send, then return
			data = JSON.parse(datafile);
		    res.type('json');  
		  	res.send(data);
		});
	}
})

app.post('/data_upload', function (req, res) {
	//TODO: handle file posting/uploading
})

//start server
var server = app.listen(8888, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('[%s] Server listening at http://%s:%s',  __dirname, host, port);
});