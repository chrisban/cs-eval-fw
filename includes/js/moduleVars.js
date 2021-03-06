//Defines html template data
//placeholders denoted by lt/gt symbols e.g.: <<_PLACEHOLDER_>>


/* TEMPLATE INFORMATION: 
/NOTE: For template variable information, see var definition in this file below.
/	   These templates should be appended to the html var (unless specefied for JS var) in a JSON object sent to the client.
/			Respsonse JSON Structure: 
/				{response_html : html, response_script: script}
/				response_html should be appended to the target page element
/				response_script should be passed to eval();
/					NOTE: Security issues arise only if eval'd content can come from a user through elements like a text field. Here, we ONLY eval the response our own server sends, 
/                       with no chance of malicious repercussions to the server. Grading is performed server-side as well with no chance of manipulation.
*/

/* TEMPLATE ORDERING:
/ 
/ *Inserted ONCE, question independent
/ 1. Requires
/ 2. Header (OPENS over-arching 'container' div)
/ 
/ While iterating through each question in data object: 
/ 	*IF*: programming question:
/ 		3a. pStatementTemplate [contains placeholder vars!] (OPENS question encapsulating 'questionContainer' div)
/ 		3b. editorInit [contains placeholder vars!] (***NOTE***: Append per question to JS script sent to client!)
/ 		4. qToolsTemplate (CLOSES question encapsulating 'questionContainer' div) ADDED PER QUESTION
/
/ 	*ELSE*: multiple choice question:
/ 		3c. pStatementTemplate [contains placeholder vars!] (OPENS question encapsulating 'questionContainer' div)
/ 		3d. mcCodeTemplate [contains placeholder vars!] (OPENS options encapsulating 'mcOptions' div)
		While iterating through each sub-question within each question:
			3e. mcSubQ [contains placeholder vars!] (OPENS sub-question encapsulating 'mcSubQ' div)
			While iterating through each option within each sub-question:
/ 				3f. mcOptionTemplate [contains placeholder vars!]
/			Post-iter: 3g. genericCloseDiv; (CLOSES sub-question encapsulating 'mcSubQ'. Used in order to keep all html code inside template variables instead of hardcoded in server.js)
/ 		Post-iter: 3h. genericCloseDiv (CLOSES options encapsulating 'mcOptions' div.
/ 		3i. editorInit [contains placeholder vars!] (***NOTE***: Append per question to JS script sent to client!)
/		4. qToolsTemplate (CLOSES question encapsulating 'questionContainer' div) ADDED PER QUESTION
/ 5. navTemplate (CLOSES over-arching 'container' div)
*/


//A modal which accepts user, course, and quiz id
var moduleSelector = '<div id="requestInfo">\
Student ID: <input type="text" id="userID" value="" size="10"><br />\
Course ID: <input type="text" id="courseID" value="" size="10"><br />\
Quiz ID: <input type="text" id="quizID" size="10" value=""><br />\
<span id="infoStatus"></span></div>\
</div>'


//includes css
var requires = '<link type="text/css" href="/includes/css/include.css" rel="stylesheet" media="screen"/>';

//header code
//Note: Container div closes at the end of navTemplate 
 var header = '<div id="container">\
<div id="banner"><h1>SAU CS</h1></div>\
<div id="bannerRight">\
	<span class="submit button">Submit Exam</span>\
	<div id="totalProgress"><div id="statusLabel"></div><div class="pbar_outer" style=""><div class="pbar_inner" style=""></div><div class="pbar_inner_txt" style="">0:00</div></div></div>\
</div><br />\
<div id="dialogStart" title="Begin activity">When you are ready to begin, click start.</div>\
<div id="dialogWarn" title="Begin next section?">Once you begin this section, you will not be able to modify the previous section\'s answers. Do you wish to continue?</div>\
<div id="dialogSubmit" title="Submit Exam?">Are you sure you want to submit? Once completed, you will not be able to make changes or make another attempt!</div><br/><hr>';

//questionContainer will be closed at the end of qToolsTemplate
//PLACEHOLDERS: <<n>> = question number, <<pstatement>> = problem statement from datafile
var pStatementTemplate = '<div id="questionContainer<<n>>"><div id="problemStatement<<n>>"><<pstatement>></div>';


//io template code that includes the code editor, input/results divs
//PLACEHOLDERS: <<n>> = question number, <<code>> = skeleton code from datafile
var ioTemplate = '<div class="inputContainer">\
		<div class="codeContainer">\
			<textarea id="code<<n>>"><<code>></textarea>\
		</div>\
		<div class="codeInput">\
			<span class="label"> Inputs will be read in order for every line read performed.<br />\
			<span class="label">New input: </span><input type="text" class="cin" size="10"/> <button class="addInput" type="button"> <b>+</b> </button> <br /><br />\
			<div>\
				<span class="label">Current inputs:</span> <select class="inputSel">\
				</select> <button class="delInput" type="button"> <b>-</b> </button>\
			</div>\
		</div>\
	</div>\
	<div class="outputContainer">\
		<span id="compile<<n>>Btn" class="compile button">Compile</span>\
		<div class="results">\
			<b>Results:</b> <br />\
			<textarea id="codeResults<<n>>" class="codeResults" rows="5" cols="100"></textarea>\
		</div>\
	</div>';


//template editor for multiple choice skeleton code area
//PLACEHOLDERS: <<n>> = question number, <<code>> = skeleton code from datafile
var mcCodeTemplate = '<div class="codeContainer"><textarea id="code<<n>>"><<code>></textarea></div><div class="mcOptions">';

//template editor for multiple choice. Opens div, needs to be closed with a genericCloseDiv in serverFunctions for each opened subQ due to how subQs are formed.
//PLACEHOLDERS: <<mcsq>> = mc sub question
var mcSubQ = "<div class='mcSubQ'><b><<mcsq>></b><br/>";

//template editor for multiple choice
//PLACEHOLDERS: <<n>> = question number, <<o>>, option number, <<mc>> = option
var mcOptionTemplate = '<input type="radio" class="mc<<n>>" index="<<o>>" value="<<mc>>"><<mc>></input><br />';

//Insert reset button and progress bar. extra /div to close questionContainer (opened in pStatementTemplate).
//PLACEHOLDERS: <<n>> = question number, <<o>>, option number, <<mc>> = option
var qToolsTemplate = '<div id="progressB<<n>>">Suggested time: <div class="pbar_outer"><div class="pbar_inner"></div><div class="pbar_inner_txt" style="">0:00</div></div></div> <span class="reset button"> Reset Code </span> </div>'; 

//template for the nagivation bar at the bottom of page
//PLACEHOLDERS: <<navshortcuts>> = a span for each index that can be used to quick jump to a specific question.
var navTemplate = '<div id="nav"><hr />\
					<span id="navBLeft" class="button_disable"> << Prev </span>\
					<div id="navShortcutContainer"></div>\
					<span id="navBRight" class="button"> Next >> </span>\
				</div>\
			</div>'; //extra </div> to close container div opened in header

var genericCloseDiv = '</div>';

//function call to be appended per editor instance to init
//PLACEHOLDERS: <<n>> = question number, <<lang>> = lang type for editor styling
var editorInit = 'editor($("#code<<n>>")[0], <<rOnly>>, "<<lang>>");';

//export template data
exports.moduleSelector = moduleSelector;
exports.header = header;
exports.requires = requires;
exports.pStatementTemplate = pStatementTemplate;
exports.ioTemplate = ioTemplate;
exports.navTemplate = navTemplate;
exports.mcCodeTemplate = mcCodeTemplate;
exports.mcSubQ = mcSubQ;
exports.mcOptionTemplate = mcOptionTemplate;
exports.qToolsTemplate = qToolsTemplate;
exports.genericCloseDiv = genericCloseDiv;
exports.editorInit = editorInit;
