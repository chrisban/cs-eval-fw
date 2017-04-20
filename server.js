var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var busboy = require('connect-busboy');
var auth = require('http-auth');
var basic = auth.basic({
    realm: "Admin",
    file: __dirname + "/admin/users.htpasswd"
});

var functions = require('./includes/js/serverFunctions');

// for parsing application/json and files
app.use(bodyParser.json());
app.use(busboy());

//connect static links
app.use('/includes', express.static(__dirname + '/includes'));
app.use('/admin', express.static(__dirname + '/admin'));


/*********************/
/* HTTP GET HANDLING */
/*********************/
app.get('/logout', function (req, res) {
  //delete req.session.user;
  res.redirect('/admin');
});  

//Admin page
app.get('/admin', auth.connect(basic), (req, res) => {
    res.sendFile(  __dirname + "/admin/admin.html" );
});

//GET testing file manager tree data (json)
app.get('/getTestsTree', function (req, res) {
	functions.getTree('./dataFiles', res)
});

//GET results file manager tree data (json)
app.get('/getResultsTree', function (req, res) {
	functions.getTree('./testResults', res)
});
		
//Exam/Quiz module
app.get('/', function (req, res) {
 	res.sendFile( __dirname + "/frontEnd/" );
});


  /*************************/
 /* Routing (Controllers) */
/*************************/

// //Auth
// app.post('/authorize/', function (req, res) {
//  	functions.checkAuth(req, res);
// });

//handle initial post request defining course/quiz info
app.post('/getModuleSelector', function (req, res) {
	functions.requestQuizInfo(req, res, functions.getModuleSelector);
});

//handle post request to retrieve datafiles
app.post('/getModule', function (req, res) {
	functions.getDataFile(req, res, (req.body.dataOnly == 'true') ? functions.serveFile : functions.serveModule);
});

//handle post request to retrieve datafiles
app.post('/getResult', function (req, res) {
	functions.getResultFile(req, res, functions.serveFile);
});

//handle api compile requests
app.post('/compile', function (req, res) {
	functions.compile(req.body, res, "post").then(function(data) {
		res.type('json');
		res.send(data);
	});
});
 
//handle answer submits answers for grading
app.post('/submit', function (req, res) {
	functions.getDataFile(req, res, functions.processExam);
});

//handle datafile uploads/parsing
app.post('/uploadFile', function (req, res) {
	var type = 'raw';
	if(!req.body.course_id) {
		type = 'file';
		req.pipe(req.busboy);
	}
	functions.storeDatafile(type, req, res);
});


//start server
var server = app.listen(8888, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('[%s] Server listening at http://%s:%s',  __dirname, host, port);
});