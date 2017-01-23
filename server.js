var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var busboy = require('connect-busboy');

var functions = require('./includes/js/serverFunctions');

// for parsing application/json and files
app.use(express.cookieParser());
app.use(express.session({secret: '1234567890QWERTY'}));
app.use(bodyParser.json());
app.use(app.router);
app.use(busboy());

//connect static links
app.use('/includes', express.static(__dirname + '/includes'));
app.use('/admin', express.static(__dirname + '/admin'));

var USER = "admin";
var PASS = "pass";

function requireLogin(req, res, next) {
	console.log('req', req.body);
  if (req.session == 'undefined' || req.session !== null || !req.session.loggedIn) {
  	console.log("not loggedin");
    // require the user to log in
    res.sendFile(  __dirname + "/admin/auth.html" );
  } else {
  	console.log("df");	
  	next(); // allow the next route to run
  }
}


/*********************/
/* HTTP GET HANDLING */
/*********************/
// Automatically apply the `requireLogin` middleware to all
// routes starting with `/admin`
app.all("/admin/*", requireLogin, function(req, res, next) {
  next(); // if the middleware allowed us to get here,
          // just move on to the next route handler
});

app.get('/logout', function (req, res) {
  //delete req.session.user;
  res.redirect('/admin');
});  

//Admin page
app.get('/admin/', function (req, res) {
 	requireLogin(req, res, res.sendFile( __dirname + "/admin/admin.html" ))	;
});

//GET file manager tree data (json)
app.get('/getTree', function (req, res) {
	functions.getTree('./dataFiles', res)
});


		
//Exam/Quiz module
app.get('/', function (req, res) {
 	res.sendFile( __dirname + "/frontEnd/" );
});


  /*************************/
 /* Routing (Controllers) */
/*************************/

//Auth
app.post('/authorize/', function (req, res) {
 	functions.checkAuth(req, res);
});

//handle initial post request defining course/quiz info
app.post('/getModuleSelector', function (req, res) {
	functions.requestQuizInfo(req, res, functions.getModuleSelector);
});

//handle post request to retrieve datafiles
app.post('/getModule', function (req, res) {
	functions.getDataFile(req, res, (req.body.dataOnly == 'true') ? functions.serveFile : functions.serveModule);
});

//handle api compile requests
app.post('/compile', function (req, res) {
	functions.compile(req.body, res, "post");
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