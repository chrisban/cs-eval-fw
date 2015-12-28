/*File comments*/
var fs = require('fs');
var requestify = require('requestify');
var deasync = require('deasync');
var uglify = require("uglify-js");

var moduleVars = require('./moduleVars');
var codeLang = require('./codeLanguages');


//current dir = /includes/js


//Get/serve getModule interface to client
exports.requestQuizInfo = function getModuleSelector (req, res) {
	var minifiedSelector = uglify.minify([__dirname + '/ModuleSelector.js']);
	var scriptSelector = minifiedSelector.code; //all listeners and js code to be evald once client has received

	//send object
	res.type('json');
	res.send( {response_html : moduleVars.moduleSelector, response_script: scriptSelector} );
}


//Get specified datafile
exports.getDataFile = function getDataFile(req, res, callback)
{
	var file = './dataFiles/' + req.body.course_id + '/data' + req.body.test_id + '.json';
	var data = { result: "Server file load error!"};

	fs.readFile(file, 'utf8', function (err, datafile) {
		if (err) {
			console.log('E: ' + err);
			return;
		}
		callback(req, res, JSON.parse(datafile));
	});
}


//This function pieces together the module js+html code sent back to the client using the data file + examlogic templates
exports.serveModule = function serveModule(req, res, data)
{
	//TODO: serve codemirror lang specific js files as needed instead of all regardless

	var html = "";

	//define difficulty levels - 0: easy, 1: medium, 2: hard
	var difficulty = [10, 20, 30];

	//get exported template data from moduleVars.js
	var header = moduleVars.header; //Overall page header information/instructions
	var requires = moduleVars.requires; //all css/js/etc. includes
	var pStatementTemplate = moduleVars.pStatementTemplate; //problemstatement template structure. Has placeholders to be changed in forloop below.
	
	//programming specific template vars
	var ioTemplate = moduleVars.ioTemplate; //code and input template structure. Has placeholders to be changed in forloop below.
	var navTemplate = moduleVars.navTemplate; //template that holds the nav elements used to switch between exam questions
	
	//multChoice specific template vars
	var mcCodeTemplate = moduleVars.mcCodeTemplate; //template that holds code editor for mchoice questions
	var mcOptionTemplate = moduleVars.mcOptionTemplate; //template that holds the skeleton for each mchoice option
	var mcSubQ = moduleVars.mcSubQ; // closes div tags that could not be closed until multiple iterations had been inserted.

	var genericCloseDiv = moduleVars.genericCloseDiv; // generic </div> for annoying case in mcOptions sub Qs

	var qToolsTemplate = moduleVars.qToolsTemplate; //function call to be appended per editor instance to init

	//script to be evald on client side
	var editorInit = moduleVars.editorInit; //function call to be appended per editor instance to init

	//minify js code to send to client to be evaluated
	var minified = uglify.minify([__dirname + '/examLogic.js']);
	var script = minified.code; //all listeners and js code to be evald once client has received

	//Decide which module to serve
	if(req.body.type == 'exam')
	{
		html = '<!--BEGIN module code-->' + requires + header;
		var difficulty = [];

		//iterate through each question in exam datafile, replacing placeholders with index and datafile specefied information
		for(var i = 0; i < Object.keys(data).length; i++)
		{
			if(!isNaN(Object.keys(data)[i]))
			{
				//record question difficulty
				difficulty.push(parseInt(data[i]["difficulty"]));

				var lang = ""
				//Catch instances of c-like languages regardless of version. This is used to style the codemirror editor.
				if(data[i]["language"].toLowerCase() == "c" || data[i]["language"].indexOf("c++") != -1 || data[i]["language"].indexOf("c#") != -1)
					lang = "clike";
				else
					lang = "python";

				//if question type is a programming question (type: "code")
				if(data[i]["questionType"] == "code")
				{
					html += pStatementTemplate.replace(/<<n>>/g, i).replace(/<<pstatement>>/, data[i]["problem"]) + ioTemplate.replace(/<<n>>/g, i).replace(/<<code>>/, data[i]["skeleton"]) + qToolsTemplate.replace(/<<n>>/, i);
					
					script += editorInit.replace(/<<n>>/g, i).replace(/<<lang>>/g, lang).replace(/<<rOnly>>/g, false);
				}
				//if question type is a programming question (type: "mchoice")
				else if(data[i]["questionType"] == "mchoice")
				{
					html += pStatementTemplate.replace(/<<n>>/g, i).replace(/<<pstatement>>/, data[i]["problem"]) + mcCodeTemplate.replace(/<<n>>/g, i).replace(/<<code>>/, data[i]["skeleton"]);
					script += editorInit.replace(/<<n>>/g, i).replace(/<<lang>>/g, lang).replace(/<<rOnly>>/g, true);

					//iterate through each multiple choice supplied in the datafile per question
					for(var j = 0; j < data[i]["input"].length; j++)
					{
						var tempSubQ = data[i]["input"][j][1];

						//Shuffle only non true/false MC
						if(tempSubQ[0].toLowerCase() != "true" && tempSubQ[0].toLowerCase() != "false")
						{
							//Shuffle subquestions via fisher-yates shuffle
    						var counter = tempSubQ.length, temp, index;
						    // While there are elements in the array
						    while (counter > 0) {
						        // Pick a random index
						        index = Math.floor(Math.random() * counter);

						        // Decrease counter by 1
						        counter--;

						        // And swap the last element with it
						        temp = tempSubQ[counter];
						        tempSubQ[counter] = tempSubQ[index];
						        tempSubQ[index] = temp;
						    }
						}

						//TODO: MOVE THIS TO MODULE VARS!!
						html += mcSubQ.replace(/<<mcsq>>/g, data[i]["input"][j][0]);
						for(var k = 0; k < data[i]["input"][j][1].length; k++)
						{
							html += mcOptionTemplate.replace(/<<mc>>/g, tempSubQ[k]).replace(/<<o>>/g, k).replace(/<<n>>/g, i + "_" + j);
						}
						html += genericCloseDiv; //generic closing mcsubq
					}

					html += genericCloseDiv + qToolsTemplate.replace(/<<n>>/, i); //generic closing mcoptions
				}		
			}
		}

		//TODO: Decide whether to template or leave as-is.
		script += "var difficulty = [" + difficulty.join() + "]; var testInfo = Object.freeze({test_id: '" + req.body.test_id + "', course_id: '" + req.body.course_id + "', test_length: '" + data["prop"]["time"]*60000 + "'});";
		html += navTemplate + '<!--END module code-->';
	}
	else if(req.body.type == 'book')
	{
		//TODO: proof of concept code for book module
	}

	
	//send object
	res.type('json');
	res.send( {response_html : html, response_script: script} );
}

//Grading fn
exports.processExam = function processExam(req, res, data)
{
	console.log("processing...");
	//Track points(subtotal = per question total, total = full total) and student score (subStudent = per question score, student score = total score)
	var totalPoints = 0;
	var subTotalPoints = 0;
	var studentScore = 0;
	var subStudentScore = 0;
	var resultFile = "";

	for(var i = 0; i < Object.keys(data).length; i++)
	{
		//reset subtotal points, print next question label
		subTotalPoints = 0;
		subStudentScore = 0;
		resultFile += "****** Question " + i + ", type: " + req.body.problemType[i] + " ******\n\n";


		if(req.body.problemType[i] == "code")
		{
			//Track points
			subTotalPoints += parseInt(data[i]["points"][0]);
			totalPoints += parseInt(data[i]["points"][0]);

			resultFile += "Submitted code:\n------------------------------------------\n\n" + req.body.solution[i] + "\n\n";

			//TODO: SHOULD NOT RELY SOLELY ON INPUT!! What if no input is needed?
			for(var j = 0; j < data[i]['input'].length; j++)
			{
				//User's data
				var userData = {
					"Program": req.body.solution[i], //user defined code
					"input": data[i]['input'][j], //datafile defined testcase
				};

				//TEMPORARY! - global variables due to node requring asynch, and we need synch due to temp external soap api. This will all change anyway, so use ugly globals for now here...
				done = false;
				compileResult = [];
				exports.compile(userData, data[i]["language"].toLowerCase());

				//see js promises?
				//TEMPORARY! - wait 1sec. until compile completes. Temp solution as we are temp. using an external soap api service at the point.
				while(done == false) {
				    require('deasync').sleep(500);
				  }

				resultFile += "\n------------------------------------------\n\nTest Input: " + data[i]['input'][j] + "\nCorrect output: " + data[i]['output'][j] + "\nReceived output: " + compileResult.Result + "\n\n";

				//TODO: fix needed, py gives weird newline after output. See javascript trim.
				//console.log(':',compileResult.Result,':');

				if(data[i]['output'][j] == compileResult.Result)
				{
					subStudentScore += parseInt(data[i]["points"][j]);
					studentScore += parseInt(data[i]["points"][j]);
					resultFile += "status: correct\n";
				} else
					resultFile += "status: incorrect\n";

				//result = compile(userData);
				//console.log(i, "continued");
			}
			

		//On exam finish (part one): 
		//receive committed codes via post
		//read in datafile via fs
		//loop per question -> per test case to determine score
		//write to file

		}else if(req.body.problemType[i] == "mchoice")
		{
			for(var j = 0; j < data[i]["input"].length; j++)
			{
				//console.log("comparing: ", req.body.solution[i][j], data[i]['output'][j])

				//Record input
				//Options are randomized, so to find correct index -> match on question first via indexOf
				var correctIndex = parseInt(data[i]['output'][j]);
				var submittedIndex = parseInt(data[i]['input'][j][1].indexOf(req.body.solution[i][j]));
				console.log("correctIndex: ", correctIndex, "\nsubmittedIndex", submittedIndex);
				resultFile += "Correct answer: " + data[i]['input'][j][1][correctIndex] + "\nReceived answer: " + data[i]['input'][j][1][submittedIndex] + "\n state: ";

				//Track points
				subTotalPoints += parseInt(data[i]["points"][j]);
				totalPoints += parseInt(data[i]["points"][0]);
				if(correctIndex == submittedIndex)
				{
					subStudentScore += parseInt(data[i]["points"][j]);
					studentScore += parseInt(data[i]["points"][j]);
					resultFile += "Correct\n\n";
				} else
					resultFile += "Inorrect\n\n";
			}
		}
		resultFile += "\nQuestion sub-score: " + subStudentScore + "/" + subTotalPoints + "\n====================================================\n\n\n\n";
	}
	resultFile += "\nFINAL SCORE: " + studentScore + "/" + totalPoints + "\n";

	//formulate paths, create directories if necessary. EEXIST e.code means dir already exists. If it doesn't, it will create.
	var coursePath = './testResults/' + req.body.course_id + '/';
	var testPath = './testResults/' + req.body.course_id + '/test' + req.body.test_id + '/';
	
	try {
	    fs.mkdirSync(coursePath);
	  } catch(e) {
	    if ( e.code != 'EEXIST' ) 
	    	throw e;
	  }
	  try {
	    fs.mkdirSync(testPath);
	  } catch(e) {
	    if ( e.code != 'EEXIST' ) 
	    	throw e;
	  }

	//Write results to file
	fs.writeFile(testPath + req.body.idNum + '.txt', resultFile, function(err) {
	    if(err) {
	        return console.log(err);
	    }
	    console.log("The file was saved!");
	});

	res.type('json');  
	res.send({status : "ok", score: studentScore + "/" + totalPoints});
}

exports.compile = function compile(data, language, res, type){
	if (data.language)
		language = data.language;

	//Get language specific compile settings
	var compileSettings = codeLang.getSettings(language);
	data.LanguageChoiceWrapper = compileSettings.wrapper;
	data.compilerArgs = compileSettings.args;

	//temporarily compiling via external call to api. Later on will be doing this ourselves by writing to file and executing on vm.
	requestify.post('http://rextester.com/rundotnet/api', data)
    .then(function(response) {
        response.getBody();
        if(type == "post")
        {
        	res.type('json');
	  		res.send(response.body);
        }else 
        {
        	done = true;
        	compileResult = JSON.parse(response.body);
        }
    });
}