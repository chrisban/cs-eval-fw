var express = require('express');
var fs = require('fs');
var app = express();
var bodyParser = require('body-parser');
var moduleVars = require('./moduleVars');

// for parsing application/json
app.use(bodyParser.json()); 

//fix static links
app.use('/js', express.static(__dirname + '/frontEnd/js'));
app.use('/css', express.static(__dirname + '/frontEnd/css'));
app.use(express.static(__dirname + '/includes'));

//response to requests
app.get('/', function (req, res) {
 	res.sendFile( __dirname + "/frontEnd/" );
});

//response to external lib GETs
app.get('/includes/js/codemirror-5.3/lib/codemirror.js', function (req, res) {
 	res.sendFile( __dirname + "/includes/js/codemirror-5.3/lib/codemirror.js" );
});
app.get('/includes/js/codemirror-5.3/lib/codemirror.css', function (req, res) {
 	res.sendFile( __dirname + "/includes/js/codemirror-5.3/lib/codemirror.css" );
});
app.get('/includes/js/codemirror-5.3/addon/edit/matchbrackets.js', function (req, res) {
 	res.sendFile( __dirname + "/includes/js/codemirror-5.3/addon/edit/matchbrackets.js" );
});
app.get('/includes/js/codemirror-5.3/mode/clike/clike.js', function (req, res) {
 	res.sendFile( __dirname + "/includes/js/codemirror-5.3/mode/clike/clike.js" );
});
app.get('/includes/css/include.css', function (req, res) {
 	res.sendFile( __dirname + "/includes/css/include.css" );
});


app.get('/upload/', function (req, res) {
 	res.sendFile( __dirname + "/frontEnd/data_upload/upload.html" );
});


//handle post request to retrieve datafiles
app.post('/getModule', function (req, res) {
	console.log(req.body);

	var file = __dirname + '/dataFiles/data' + req.body.test_id + '.json';
	var data = { result: "Server file load error!"};

	fs.readFile(file, 'utf8', function (err, datafile) {
		if (err) {
			console.log('E: ' + err);
			return;
		}

		//parse result, send, then return
		data = JSON.parse(datafile);
		var html = "";

		//get exported template data from moduleVars.js
		var header = moduleVars.header; //Overall page header information/instructions
		var requiresTemplate = moduleVars.requiresTemplate; //all css/js/etc. includes
		var pStatementTemplate = moduleVars.pStatementTemplate; //problemstatement template structure. Has placeholders to be changed in forloop below.
		var ioTemplate = moduleVars.ioTemplate; //code and input template structure. Has placeholders to be changed in forloop below.
		var script = moduleVars.script; //all listeners and js code to be evald once client has received
		var editorTemplate = moduleVars.editorTemplate; //template codemirror editor to be init. Has placeholder to be chnaged in forloop below.
		
  		//Decide which module to serve
		if(req.body.type == 'exam')
		{
			html = '<!--BEGIN module code-->' + requiresTemplate + header;

			//iterate through each question in exam datafile, replacing placeholders with index and datafile specefied information
			for(var i = 0; i < Object.keys(data).length; i++)
			{
				html += pStatementTemplate.replace(/<<n>>/g, i).replace(/<<pstatement>>/, data[i]["problem"]) + ioTemplate.replace(/<<n>>/g, i).replace(/<<code>>/, data[i]["skeleton"]) + "<hr>";
				script += editorTemplate.replace(/<<n>>/g, i);
			}

			html += '</div><!--END module code-->';
		}
		else if(req.body.type == 'book')
		{
			//TODO: proof of concept code for book module
		}


	    res.type('json');  
	  	res.send({response_html : html, response_script: script});
	});
});

//handle api compile requests
app.post('/compile', function (req, res) {
	console.log("req: ", req.body);

	//As proof of concept, continue ajax call to external api
	//Must find some other way besides jquery->ajax
	/*$.ajax({
	  type: "POST",
	  url: "http://rextester.com/rundotnet/api",
	  dataType: "JSON",
	  data: data,
	  success: function(response){
	  	res.type('json');
	  	res.send(response);
	  }
	});*/
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