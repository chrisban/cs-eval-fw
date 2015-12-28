var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var functions = require('./includes/js/serverFunctions');

// for parsing application/json
app.use(bodyParser.json()); 

//connect static links
//app.use('/js', express.static(__dirname + '/frontEnd/js'));
//app.use('/css', express.static(__dirname + '/frontEnd/css'));
app.use('/includes', express.static(__dirname + '/includes'));


/*********************/
/* HTTP GET HANDLING */
/*********************/
app.get('/', function (req, res) {
	//Proof of concept utilizing exam module. Change to or include info/usage page?
 	res.sendFile( __dirname + "/frontEnd/" );
});

app.get('/includes/css/include.css', function (req, res) {
 	res.sendFile( __dirname + "/includes/css/include.css" );
});

app.get('/admin/', function (req, res) {
 	res.sendFile( __dirname + "/admin/admin.html" );
});


  /*************************/
 /* Routing (Controllers) */
/*************************/
//handle initial post request defining course/quiz info
app.post('/getModuleSelector', function (req, res) {
	functions.requestQuizInfo(req, res, functions.getModuleSelector);
});


//handle post request to retrieve datafiles
app.post('/getModule', function (req, res) {
	functions.getDataFile(req, res, functions.serveModule);
});

//handle api compile requests
app.post('/compile', function (req, res) {
	functions.compile(req.body, null, res, "post");
});
 
//handle answer submits answers for grading
app.post('/submit', function (req, res) {
	//console.log(req.body);
	functions.getDataFile(req, res, functions.processExam);
});

app.post('/data_upload', function (req, res) {
	//TODO: handle file posting/uploading
});

//start server
var server = app.listen(8888, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('[%s] Server listening at http://%s:%s',  __dirname, host, port);
});