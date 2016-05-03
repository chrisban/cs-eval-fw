/*File comments*/
var fs = require('fs');
var requestify = require('requestify');
var deasync = require('deasync');
var uglify = require("uglify-js");
var busboy = require('connect-busboy');
var spawn = require('child_process').spawnSync;
var exec = require('child_process').exec;
var util = require('util');

var moduleVars = require('./moduleVars');


//current dir: /includes/js


//Get/serve getModule interface to client
exports.requestQuizInfo = function getModuleSelector (req, res) {
    //min and serve js file
    var minifiedSelector = uglify.minify([__dirname + '/ModuleSelector.js']);
    var scriptSelector = minifiedSelector.code; //all listeners and js code to be evald once client has received

    //send object
    res.type('json');
    res.send( {response_html : moduleVars.moduleSelector, response_script: scriptSelector} );
}


//Get specified datafile
exports.getDataFile = function getDataFile(req, res, callback)
{
    var file = './dataFiles/' + req.body.course_id.toUpperCase() + '/data' + req.body.test_id + '.json';

    fs.readFile(file, 'utf8', function (err, datafile) {
        if (err) {
            console.log('E: ' + err);
            res.type('json');
            res.send( {error: 'The course or activity ID number could not be resolved. Please check your input and contact your professor if problems persist. ' + file} );
            return;
        }

        //after file is read, pass on request/response vars along with parsed json data
        callback(req, res, JSON.parse(datafile));
    });
}


//This function pieces together the module js+html code sent back to the client using the data file + examlogic templates
exports.serveModule = function serveModule(req, res, data)
{
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
    var baseScript = fs.readFileSync(__dirname + '/examLogic.js', 'utf8'); //all listeners and js code to be evald once client has received
    var script = ""; //vars to be inserted into baseScript at runtime

    var html = ""; //html code to be inserted into dom client side

    //define difficulty levels - 0: easy, 1: medium, 2: hard
    var difficulty = [];

    //Decide which module to serve
    if(req.body.type == 'exam')
    {
        html = '<!--BEGIN module code-->' + requires + header;

        //iterate through each question in exam datafile, replacing placeholders with index and datafile specefied information
        for(var i = 0; i < Object.keys(data).length; i++)
        {
            //only look at keys 0-n, ignoring 'prop' key along with any possible malformed data
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
                    //see ModuleVars.js file for templating documentation
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

        //create variables to be inserted into script executed client side. 
        //vars defined: difficulty[per question], testInfo[test_id, course_id, test_length, warnTimes]
        var testInfoVars = "var difficulty = [" + difficulty.join() + "]; var testInfo = Object.freeze({test_id: '" + req.body.test_id + "', course_id: '" + 
            req.body.course_id.toUpperCase() + "', test_length: '" + data["prop"]["time"]*60000 + "', warnTimes: '" + data["prop"]["warn"] +"'});";

        //insert navbar and end comment
        html += navTemplate + '<!--END module code-->';

        //commented out, due to codemirror add-on bug regarding dynamic loading
        //var completeScript = 'loadCmResources();' + testInfoVars + baseScript + script + 'refreshCmInstances();';
        var completeScript = testInfoVars + baseScript + script;
        
        //console.log('baseScript: \n', baseScript + '\n\n');
        //console.log('script: \n', script + '\n\n');
        //console.log('completeScript: \n', completeScript + '\n\n');

        //minify script
        var minified = uglify.minify(completeScript, {fromString: true});
        script = minified.code; //all listeners and js code to be evald once client has received
    }
    else if(req.body.type == 'book')
    {
        //TODO: proof of concept code for book module
    }

    
    //send object
    res.type('json');
    res.send( {response_html : html, response_script: script} );
}

//Grading function. 
//Requires linux environment to run correctly due to how compilation works (uses node spawn/exec and bash)
exports.processExam = function processExam(req, res, data)
{
    console.log("processing...");
    //Track points(subtotal = per question total, total = full total) and student score (subStudent = per question score, student score = total score)
    var totalPoints = 0;
    var subTotalPoints = 0;
    var studentScore = 0;
    var subStudentScore = 0;
    var resultFile = "";
    var prop = data.prop;
    var difficultyMultiplier = 10;
    
    //Remove properties field so it doesn't interfere with processing the answers (it would appear as though it were another question but with no data. Easier just to delete the property instead of coding around it)
    delete data.prop;

    console.log("i-Loop start");
    for(var i = 0; i < Object.keys(data).length; i++)
    {
        //reset subtotal points, print next question label
        subTotalPoints = 0;
        subStudentScore = 0;
        resultFile += "****** Question " + i + ", type: " + req.body.problemType[i] + " ******\n\n";


        if(req.body.problemType[i] == "code")
        {
            resultFile += "Submitted code:\n------------------------------------------\n\n" + req.body.solution[i] + "\n\n";

            console.log("j-Loop start");
            //Loop through each 'output' aka test cases
            for(var j = 0; j < data[i]['output'].length; j++)
            {
                //Track points
                subTotalPoints += parseInt(data[i]["points"][j]);
                totalPoints += parseInt(data[i]["points"][j]);
                
                //User's data
                var userData = {
                    "code": req.body.solution[i], //user defined code
                    "input": data[i]['input'][j], //datafile defined testcase
                    "language": data[i]["language"].toLowerCase()
                };
                console.log("compile start");
                //Global variables due to node requring async, and we need sync because we need to wait for the compilation result before returning our object. 
                done = false;
                compileResult = [];
                exports.compile(userData);
                
                //Should look into alternative such as js promise to return response
                //For now, check every 500ms until compile completes. This loop generally only executes a few times max. Not too worried about overhead
                while(done == false) {
                    require('deasync').sleep(500);
                }
                console.log("compile finish");
                resultFile += "\n------------------------------------------\n\nTest Input: " + data[i]['input'][j] + "\n\nCorrect output: " + data[i]['output'][j] + "\n\nReceived output: " + compileResult.Result + "\n\n";


                //console.log("comparing: [" + compileResult.Result.trim() + "]\n\nans: \n[", data[i]['output'][j].trim() + "]\n");

                //Check to see if compilation result is equal to the expected output defined in the datafile
                //trim and add newline as parsing the json adds a leading space, and compiling adds a trailing newline. TODO: trim both?
                if(data[i]['output'][j].trim() == compileResult.Result.trim())
                {
                    subStudentScore += parseInt(data[i]["points"][j]);
                    studentScore += parseInt(data[i]["points"][j]);
                    resultFile += "status: correct\n\n";
                } else{
                    resultFile += "status: incorrect\n\n";
                }
            }

        } else if(req.body.problemType[i] == "mchoice")
        {
            console.log("mchoice j-Loop start");
            for(var j = 0; j < data[i]["input"].length; j++)
            {
                //Record input
                //Options are randomized, so to find correct index -> match on question first via indexOf
                var correctIndex = parseInt(data[i]['output'][j]);
                var submittedIndex = parseInt(data[i]['input'][j][1].indexOf(req.body.solution[i][j]));
                //console.log("[j:" + j + "] \ncorrectIndex: ", correctIndex, "\nsubmittedIndex", submittedIndex);
                resultFile += "Correct answer: " + data[i]['input'][j][1][correctIndex] + "\nReceived answer: " + data[i]['input'][j][1][submittedIndex] + "\n state: ";

                //Track points
                subTotalPoints += parseInt(data[i]["points"][j]);
                totalPoints += parseInt(data[i]["points"][0]);

                if(correctIndex == submittedIndex)
                {
                    subStudentScore += parseInt(data[i]["points"][j]);
                    studentScore += parseInt(data[i]["points"][j]);
                    resultFile += "Correct\n\n";
                } else {
                    resultFile += "Inorrect\n\n";
                }
            }
        }

        resultFile += "Time remaining: " + req.body.timings[i] + "/" + ((parseInt(data[i]['difficulty']) + 1) * difficultyMultiplier) + ":00";
        resultFile += "\nQuestion sub-score: " + subStudentScore + "/" + subTotalPoints + "\n====================================================\n\n\n\n";
    }
    resultFile += "\nTIME REMAINING: " + req.body.timings[req.body.timings.length - 1] + "/" + prop['time'] + ":00\n";
    resultFile += "FINAL SCORE: " + studentScore + "/" + totalPoints + "\n";

    //formulate paths, create directories if necessary. EEXIST e.code means dir already exists. If it doesn't, it will create.
    //We won't overwrite the coursepath or testpath to keep from losing data or student resubmissions. File creation timestamp can be used to verify timings if necessary
    var coursePath = './testResults/' + req.body.course_id.toUpperCase() + '/';
    var testPath = './testResults/' + req.body.course_id.toUpperCase() + '/test' + req.body.test_id + '/';
    
    console.log("create class dir");
    try {
        fs.mkdirSync(coursePath);
      } catch(e) {
        if ( e.code != 'EEXIST' ) 
            throw e;
      }
      
      console.log("create test dir");
      try {
        fs.mkdirSync(testPath);
      } catch(e) {
        if ( e.code != 'EEXIST' ) 
            throw e;
      }

    console.log("write result file");
    //Write results to file
    //TODO: if file exists, do not write (or maybe not overrwrite, specify duplicate, append datetime to name)
    fs.writeFile(testPath + req.body.idNum + '.txt', resultFile, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    });

    res.type('json');  
    res.send({status : "ok", score: studentScore + "/" + totalPoints});
}


//TODO: document this as a location that needs to be modified when adding support for more languages
//Compiles and or executes code
//data: [code, input, language]
//res: response object, exists only if called from /compile endpoint
//type: exists only if called from /compile endpoint, if so specifies type as 'post'
exports.compile = function compile(data, res, type){
    var response = {
        Errors: '',
        Result: ''
    }
    //TODO: cron-esque to wipe folder every once in awhile
    //Generate tmp string using timestamp and ints 0-9999 for directory name
    var tmpDir = '' + Date.now() + Math.floor(Math.random() * (9999 - 0) + 0);

    var fileBasePath = '/home/cban/RESTful-framework-for-programming-evaluation-in-academia/compilation/' + tmpDir + '/';

    try {
        fs.mkdirSync('./compilation/' + tmpDir);
    } catch(e) {
        if ( e.code != 'EEXIST' ) 
            throw e;
    }

    //if c++, use gcc
    if(data.language.toLowerCase().indexOf('c++') != -1) {
        //Write code to file
        fs.writeFileSync('./compilation/' + tmpDir + "/code.cpp", data.code, 'utf-8', function(err) {
            if(err) {
                return console.log(err);
            }
        });


        //compile code
        var compileChild;
        var execChild;
        if(data.language.toLowerCase().indexOf('c++14') != -1) {
            compileChild = spawn('g++-5 -std=c++14', [fileBasePath + 'code.cpp', '-o', fileBasePath + 'output'], {
                shell: true
            });
        } else{
            compileChild = spawn('g++-5 -std=c++11', [fileBasePath + 'code.cpp', '-o', fileBasePath + 'output'], {
                shell: true
            });
        }

        // var to = setTimeout(function(){
        //   console.log('Max compile time reached: sending sigkill');
        //   compileChild.kill();
        // }, 5000);

        // compileChild.on('exit', function(){
        //   clearTimeout(to);
        //   console.log('Child exited!');
        // });

        //console.log('[COMPILE]\nout: ', String(compileChild.stdout), '\nerr: ', String(compileChild.stderr));

        //If there are errors - report, else run code if there were no compilation errors
        if(String(compileChild.stderr) != ''){
            response.Errors += String(compileChild.stderr) + '\n';
            if(type == "post") {
                res.type('json');
                res.send(response);
            }else  {
                done = true;
                compileResult = response;
            }
        } else {
            //if no input. There will always be at least a newline, so empty string with \n is empty input
            if(data.input == '\n') {
                try{
                    execChild = exec(fileBasePath + 'output',
                        (error, stdout, stderr) => {
                            if(error !== null){
                                response.Errors += error + "\n";
                                console.log(`Runtime error: ${error}`);
                            }
                            response.Errors += stderr;
                            response.Result += stdout;
                                
                            if(type == "post") {
                                //console.log("sending response: ", stdout);

                                res.type('json');
                                res.send(response);
                            }else  {
                                done = true;
                                compileResult = response;
                            }
                        }
                    );

                } catch(e){
                    //console.log(util.inspect(e, {showHidden: false, depth: null}));
                    var err = String(e);
                    response.Errors += err;
                }

            } else {
                //Can't get it to feed in multiple inputs unless from a file with CRLFs
                fs.writeFileSync('./compilation/' + tmpDir + "/input.txt", data.input, 'utf-8', function(err) {
                    if(err) {
                        return console.log(err);
                    }
                });

                //cat inputs and pipe into output.o executable  
                try{
                    execChild = exec('cat ' + fileBasePath + 'input.txt | ' + fileBasePath + 'output', { timeout: 10000, killSignal: 'SIGKILL'}, 
                        (error, stdout, stderr) => {
                            if(error !== null){
                                response.Errors += error + "\n";
                                console.log(`Runtime error: ${error}`);
                            }
                            response.Errors += stderr;
                            response.Result += stdout;
                                
                            if(type == "post") {
                                //console.log("sending response: ", stdout);

                                res.type('json');
                                res.send(response);
                            }else  {
                                done = true;
                                compileResult = response;
                            }
                        }
                    );

                } catch(e){
                    //console.log(util.inspect(e, {showHidden: false, depth: null}));
                    var err = String(e);
                    response.Errors += err;
                }
            }

            //console.log('\n[RUN]: ', response);
        }

        //if python (only supporting python 3.X)
    } else if(data.language.toLowerCase().indexOf("python") != -1) {
        //Write code to file
        fs.writeFileSync('./compilation/' + tmpDir + "/code.py", data.code, 'utf-8', function(err) {
            if(err) {
                return console.log(err);
            }
        });

        //if no input. There will always be at least a newline, so empty string with \n is empty input
        var execChild;
        if(data.input == '\n') {
            try{
                execChild = exec("python3 " + fileBasePath + 'code.py', { timeout: 10000, killSignal: 'SIGKILL'}, 
                    (error, stdout, stderr) => {
                        if(error !== null){
                            response.Errors += error + "\n";
                            console.log(`Runtime error: ${error}`);
                        }
                        response.Errors += stderr;
                        response.Result += stdout;
                            
                        if(type == "post") {
                            //console.log("sending response: ", stdout);

                            res.type('json');
                            res.send(response);
                        }else  {
                            done = true;
                            compileResult = response;
                        }
                    }
                );
            } catch(e){
                //console.log(util.inspect(e, {showHidden: false, depth: null}));
                var err = String(e);
                var errIdx = err.indexOf("code.py\",");
                if(errIdx < 0 || errIdx > err.length)
                    errIdx = 0;
                response.Errors += err.substring(errIdx + 10, err.length);
            }

        } else {
            //Can't get it to feed in multiple inputs unless from a file with CRLFs
            //So right inputs to file first
            fs.writeFileSync('./compilation/' + tmpDir + "/input.txt", data.input, 'utf-8', function(err) {
                if(err) {
                    return console.log(err);
                }
            });

            //cat inputs and then pipe into py script
            try{
                execChild = exec('cat ' + fileBasePath + 'input.txt | python3 ' + fileBasePath + 'code.py', { timeout: 10000, killSignal: 'SIGKILL'}, 
                    (error, stdout, stderr) => {
                        if(error !== null){
                            response.Errors += error + "\n";
                            console.log(`Runtime error: ${error}`);
                        }
                        response.Errors += stderr;
                        response.Result += stdout;
                            
                        if(type == "post") {
                            //console.log("sending response: ", stdout);

                            res.type('json');
                            res.send(response);
                        }else  {
                            done = true;
                            compileResult = response;
                        }
                    }
                );
            } catch(e){
            //console.log(util.inspect(e, {showHidden: false, depth: null}));
                var err = String(e);
                var errIdx = err.indexOf("code.py\",");
                if(errIdx < 0 || errIdx > err.length)
                    errIdx = 0;
                response.Errors += err.substring(errIdx + 10, err.length);
            }
        }

            // setTimeout(function(){
            //   console.log('Max execution time reached: sending sigkill');
            //   execChild.kill();
            // }, 5000);

        //console.log('\n[RUN]: ', response);
    } else {

        console.log('Unkown language, cannot compile!');
        console.log('Data: ', data);

        response.Result += "Unkown language, cannot compile!";

        if(type == "post") {
            res.type('json');
            res.send(response);
        }else  {
            done = true;
            compileResult = response;
        }
    }

    // if(type == "post") {
    //  res.type('json');
    //  res.send(response);
    // }else  {
    //  done = true;
    //  compileResult = response;
    // }
}

//Stores datafiles created from the admin page
exports.storeDatafile = function storeDatafile(type, req, res) {
    res.type('json');  

    //if uploaded well-formed json file
    if(type == 'file') {
        //Write file
        var fstream,
            filePath,
            fullFilePath,
            fileDetails,
            fname;

        //TODO: standardize fname naming scheme
        req.busboy.on('file', function (fieldname, file, filename) {
            fileDetails = fieldname.split('===');
            fname = 'data' + fileDetails[1];
            filePath =  './dataFiles/' + fileDetails[0].toUpperCase();
            fullFilePath =  './dataFiles/' + fileDetails[0].toUpperCase() + '/' + fname + '.json';

            //filepath: ./dataFiles/courseid/specifiedname.json

            try {
                fs.mkdirSync(filePath);
            } catch(e) {
                if ( e.code != 'EEXIST' ) 
                    throw e;
            }

            fstream = fs.createWriteStream(fullFilePath);
            file.pipe(fstream);

            res.send({success : true});
        });

    //else uploaded json data via text
    } else {
        var json = JSON.parse(req.body.code);
        filePath = './dataFiles/' + req.body.course_id.toUpperCase();

        //create directory if needed
        try {
            fs.mkdirSync(filePath);
        } catch(e) {
            if ( e.code != 'EEXIST' ) 
                throw e;
        }

        //write file
        fs.writeFileSync(filePath + '/data' + req.body.act_id + '.json', json , 'utf-8'); 
        
        res.send({success : true});
    }
}
