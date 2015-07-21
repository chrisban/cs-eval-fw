//Defines html template data
//placeholders denoted by lt/gt symbols e.g.: <<PLACEHOLDER>>

/* TEMPLATE INFORMATION: 
/NOTE: For template variable information, see var definition in this file below.
/	   These templates should be appended to the html var (unless specefied for JS var) in a JSON object sent to the client.
/			JSON Structure: 
/				{response_html : html, response_script: script}
/				response_html should be appended to the target page element
/				response_script should be passed to eval();
/					NOTE: Security issues arises only if eval'd content can come from a user through elements like a text field. Here, we eval on client and only interact with our own server with no chance of malicious repercussions to the server.
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
/ 		4a. ioTemplate [contains placeholder vars!] (CLOSES question encapsulating 'questionContainer' div)
/ 		4b. editorInit [contains placeholder vars!] (***NOTE***: Append per question to JS script sent to client!)
/
/ 	*ELSE*: multiple choice question:
/ 		3b. pStatementTemplate [contains placeholder vars!] (OPENS question encapsulating 'questionContainer' div)
/ 		4b. mcCodeTemplate [contains placeholder vars!] (OPENS options encapsulating 'mcOptions' div)
		While iterating through each option within each question:
/ 			4c. mcOptionTemplate [contains placeholder vars!]
/ 			4d. mcClose (CLOSES options encapsulating 'mcOptions' div, *AND* CLOSES question encapsulating 'questionContainer' div)
/ 		4b. editorInit [contains placeholder vars!] (***NOTE***: Append per question to JS script sent to client!)
/
/ 5. navTemplate (CLOSES over-arching 'container' div)
*/


//TODO: move all codemirror libs here
var requires = '<link type="text/css" href="/includes/css/include.css" rel="stylesheet" media="screen"/>';

//Container div closes at the end of 
 var header = '<div id="container">\
<div id="banner"><h1>Practice Exam</h1></div>\
<div>Enter or modify the code below and press \'Compile\' to execute and view results.</div>\
<div id="submit"><span class="submit button">Submit Exam</span></div>\
<div id="dialogID" title="Student ID">ID#: <input type="text" id="idNum"><br /><span id="idStatus"></span></div>\
<div id="dialogWarn" title="Begin next section?">Once you begin this section, you will not be able to modify the previous section\'s answers. Do you wish to continue?</div>';

//questionContainer will be closed at the end of ioTemplate
//PLACEHOLDERS: <<n>> = question number, <<pstatement>> = problem statement from datafile
var pStatementTemplate = '<div id="questionContainer<<n>>"><div id="problemStatement<<n>>"><<pstatement>></div>';


//PLACEHOLDERS: <<n>> = question number, <<code>> = skeleton code from datafile
var ioTemplate = '<div class="inputContainer">\
		<div class="codeContainer">\
			<textarea id="code<<n>>"><<code>></textarea>\
		</div>\
		<div class="codeInput">\
			<span class="label"> Inputs will be read in order for every line read performed.</span><br /><br /><br />\
			<span class="label">New input: </span><input type="text" class="cin" size="10"/> <button class="addInput" type="button"> <b>+</b> </button> <br /><br />\
			<div>\
				<span class="label">Current inputs:</span> <select class="inputSel">\
				</select> <button class="delInput" type="button"> <b>-</b> </button>\
			</div>\
		</div>\
	</div>\
	<div class="outputContainer">\
		<span class="compile button"> Compile</span>\
		<div class="results">\
			<b>Results:</b> <br />\
			<textarea class="codeResults" rows="5" cols="100"></textarea>\
		</div>\
	</div>\
	<span class="commit button"> Commit </span>\
	</div>'; //extra </div> to close questionContainer div opened in pStatementTemplate 


//template editor for multiple choice
//PLACEHOLDERS: <<n>> = question number, <<code>> = skeleton code from datafile
var mcCodeTemplate = '<div class="codeContainer"><textarea id="code<<n>>"><<code>></textarea></div><div class="mcOptions">';

//template editor for multiple choice
//PLACEHOLDERS: <<n>> = question number, <<o>>, option number, <<mc>> = option
var mcOptionTemplate = '<input type="radio" class="mc<<n>>" value="<<o>>"><<mc>></input><br />';

var mcClose = '</div> <span class="commit button"> Commit </span> </div>'; //1st /div: mcOptions div (opened in mcCodeTemplate). Insert commit button. 2nd div: questionContainer /div (opened in pStatementTemplate). 

//PLACEHOLDERS: <<navshortcuts>> = a span for each index that can be used to quick jump to a specific question.
var navTemplate = '<div id="nav"><hr />\
					<span id="navBLeft" class="button_disable"> << Prev </span>\
					<div id="navShortcutContainer"></div>\
					<span id="navBRight" class="button"> Next >> </span>\
				</div>\
				</div>'; //extra </div> to close container div opened in header

//function call to be appended per editor instance to init
//PLACEHOLDERS: <<n>> = question number, <<lang>> = lang type for editor styling
var editorInit = 'editor($("#code<<n>>")[0], false, "<<lang>>");';

//Script to be eval'd on client side. A few function calls will be appended serverside prior to sending depending on datafile contents (such as editor calls per codemirror instance)
var script = '\
/*Variables that track section and specify divide (defined by number of ".mcOptions" class occurences)*/\
var section = {number: 0, warn: false};\
var structure = Object.freeze({count: $("[id*=questionContainer]").length, divide: $(".mcOptions").length});\
var section1 = {};\
\
\
/*A function that will create a codemirror editor instance with passed id, bool readonly, and language mode.*/\
function editor(id, rOnly, mode)\
{\
    CodeMirror.fromTextArea(id, \
	{\
		readOnly: rOnly,\
		theme: "default",\
    	lineNumbers: true,\
    	matchBrackets: true,\
    	enableCodeFormatting: true,\
    	autoFormatOnStart: true,\
    	autoFormatOnUncomment: true,\
    	mode: mode,\
    	styleActiveLine: true\
    });\
}\
\
\
/*accepts an integer as target index and switches from current problem to specified problem via index*/\
function goNav(targetIndex){\
	var curr = $("[id*=questionContainer]:visible");\
	var currentIndex = parseInt(curr.attr("id").substring(17, curr.attr("id").length));\
	/*if target is 0 - max# defined in structure, and target is not current view*/\
	if(targetIndex >= 0 && targetIndex < structure.count && targetIndex != currentIndex)\
	{\
		/*disable/enable next/prev buttons as needed*/\
		if(targetIndex == 0)\
		{\
			$("#navBLeft").removeClass("button");\
			$("#navBLeft").addClass("button_disable");\
		}\
		else\
		{\
			$("#navBLeft").removeClass("button_disable");\
			$("#navBLeft").addClass("button");\
		}\
		if(targetIndex ==  structure.count - 1)\
		{\
			$("#navBRight").removeClass("button");\
			$("#navBRight").addClass("button_disable");\
		}\
		else\
		{\
			$("#navBRight").removeClass("button_disable");\
			$("#navBRight").addClass("button");\
		}\
		$("#navShortcutElement" + currentIndex).removeClass("selected");\
		$("#navShortcutElement" + targetIndex).addClass("selected");\
		/*if forward*/\
		if(targetIndex > currentIndex)\
		{\
			/*If attempting to access second section from first section by checking against frozen structure.divide var. (current before divide, target after)*/\
			if(currentIndex < $(".mcOptions").length && targetIndex >= $(".mcOptions").length)\
			{\
				\
			}\
			curr.toggle("slide", {"direction":"left"}, function(){\
				$("#questionContainer" + targetIndex).toggle("slide", {"direction":"right"});\
			});\
		}\
		/*if backward*/\
		else\
		{\
			curr.toggle("slide", {"direction":"right"}, function(){\
				$("#questionContainer" + targetIndex).toggle("slide", {"direction":"left"});\
			});\
		}\
	}\
}\
\
\
/*populate nav list, append "|" character to display separation between code and other question types using frozen structure.divide var*/\
for(var i = 0; i < $("[id*=questionContainer]").length; i++)\
{\
	/*append shortcut*/\
	$("#navShortcutContainer").append("<span id=\'navShortcutElement" + i + "\'>" + (i+1) + "</span>");\
	/*apply selected class to first shortcut*/\
	if(i==0)\
		$("#navShortcutElement" + i).addClass("selected");\
	if(i < structure.divide)\
		$("#navShortcutElement" + i).addClass("navShortcutElement section1");\
	else\
		$("#navShortcutElement" + i).addClass("navShortcutElement section2");\
	/*Print visual separator*/\
	if(i == structure.divide - 1)\
		$("#navShortcutContainer").append("<b> |<b/>");\
}\
\
\
/*navigate between problems using shortcuts via goNav function. -1 to compensate for starting at 1 instead of 0*/\
$(".navShortcutElement").on("click", function(){\
	goNav(parseInt($(this).html())-1);\
});\
\
\
/*navigate between problems using arrow keys via goNav function*/\
$("[id*=navB]").on("click", function(){\
	var direction = $(this).attr("id").substring(4, $(this).attr("id").length);\
	var curr = $("[id*=questionContainer]:visible");\
	var currentIndex = parseInt(curr.attr("id").substring(17, curr.attr("id").length));\
	if (direction == "Right")\
	{\
		goNav(currentIndex + 1);\
	} else if(direction == "Left")\
	{\
		goNav(currentIndex - 1);\
	}\
});\
\
\
/*dynamically add items from nearest selectbox.*/\
$(".addInput").on("click", function(){\
	$(this).parent().find("select").append("<option>"+$(this).prev("input").val()+"</option>");\
	$(this).prev("input").val("");\
});\
\
\
/*dynamically remove items from nearest selectbox.*/\
$(".delInput").on("click", function(){\
	var lbox = $(this).parent().find("select");\
	$("option:selected", lbox).remove();\
});\
\
\
/* Dynamic listener to allow for only one radio to be selected per question */\
$(".mcOptions").on("change", "[type=radio]", function (e) {\
	var thisCtx = $(this);\
	$.each($("." + $(this).attr("class")), function(){\
		if(!$(this).is(thisCtx))\
			$(this).prop("checked", false);\
	});\
});\
\
\
/*Records input from section 1 and freezes object in order to keep answers from being modified.*/\
function recordSection()\
{\
	section.warn = true;\
	Object.freeze(section);\
	var ans = [];\
	for(var i = 0; i < structure.divide; i++)\
	{\
		var anstmp = [];\
		for(var j = 0; j < $("#questionContainer" + i + " .mcSubQ").length; j++)\
		{\
			var val = $(".mc" + i + "_" + j).filter(":checked").val();\
			if(jQuery.type( val ) === "string")\
				anstmp.push(val);\
			else\
				anstmp.push("");\
		}\
		ans.push(anstmp);\
	}\
	Object.freeze(section1.ans = ans);\
	$(".mcOptions input:radio").attr("disabled",true);\
	console.log("ans: ", ans);\
}\
\
\
/*On compile, finds parents parents id (pos. 17 to string end as the id will always be "questionContainer#") to get q. num which is used to specify which codemirror editor. Then gets the editor value, maps inputs to array->str. Finally posts data to server via ajax call*/\
$(".compile").on("click", function(){\
	/*Ensures student is aware they are beginning next section*/\
	if(section.warn == false)\
	{\
		$("#dialogWarn").dialog("open");\
		return false;\
	}\
	var btnContext = $(this);\
	var parentID = $(this).parent().parent().attr("id");\
	var index = parentID.substring(17, parentID.length);\
	var lbox = $(this).parent().parent().find("select option");\
\
	var data = {\
		"LanguageChoiceWrapper": "7",\
		"Program": $(".CodeMirror")[parseInt(index)].CodeMirror.getValue(),\
		"input": $.map(lbox ,function(option) {return option.value;}).join(\' \'),\
		"compilerArgs": "-std=c++14 -o a.out source_file.cpp"\
	};\
\
	$.ajax({\
		  type: "POST",\
		  url: "/compile",\
		  dataType: "json",\
		  data: JSON.stringify(data),\
    	  contentType: "application/json",\
		  success: function(response){\
		  	var closestResults = btnContext.parent().parent().find(".results");\
			if(!closestResults.is(":visible"))\
				closestResults.show("blind", 500);\
		  	console.log("resp:", response);\
		  	var result = "";\
		  	if(response.Errors)\
		  		result += "Errors: " + response.Errors + "\\n";\
		  	if(response.Warnings)\
		  		result += "Warnings: " + response.Warnings + "\\n";\
		  	if(response.Result)\
		  		result += "Result: " + response.Result;\
		  	btnContext.parent().parent().find(".codeResults").val(result);\
		  }\
	});\
});\
\
\
/*Button which applies a class to thumbnails in order to aid students in tracking which questions are complete*/\
$(".commit").on("click", function(){\
  	$("#navShortcutElement" + parseInt($(this).parent().attr("id").substring(17, $(this).parent().attr("id").length))).addClass("committed");\
});\
\
\
/*On submit, send to server. Uses structure.divide because it dictates the length of mchoice types since they will always come first*/\
$(".submit").on("click", function(){\
	recordSection();\
	console.log("processing " + structure.count + " answers.");\
	var type = [];\
	var num = [];\
	var solution = [];\
	var input = [];\
	for(var i = 0; i < structure.divide; i++)\
	{\
		type.push("mchoice");\
		num.push(i);\
		solution.push(section1.ans[i]);\
		input.push([]);\
	}\
	for(var i = structure.divide; i < structure.count; i++)\
	{\
		type.push("code");\
		num.push(i);\
		solution.push($(".CodeMirror")[i].CodeMirror.getValue());\
		var lbox = $("#questionContainer" + i).find("select option");\
		input.push($.map(lbox ,function(option) {return option.value;}));\
	}\
	var data = {\
		"idNum": $("#idNum").val(),\
		"problemType": type,\
		"problemNum": num,\
		"solution": solution,\
		"input": input\
	};\
\
	$.ajax({\
		  type: "POST",\
		  url: "/commit",\
		  dataType: "json",\
		  data: JSON.stringify(data),\
    	  contentType: "application/json",\
		  success: function(response){\
		}\
	});\
});\
\
\
/*jQueryUI Modal used to retrieve student ID*/\
var errorString = "Error: ID number must be at least 6 digits";\
$( "#dialogID" ).dialog({\
	position: {my: "top+200",at: "top", of: window},\
	closeOnEscape: false,\
	dialogClass: "no-close",\
	autoOpen: true,\
	autoResize: true,\
	height: "auto",\
	width: "auto",\
	modal: true,\
	buttons: {\
	    "Save": function() {\
	      if($("#idNum").val().length >= 6)\
	      	$(this).dialog("close");\
	      else\
	      {\
	      	$("#idStatus").html(errorString);\
	      	if($("#idNum").not(":visible"))\
	      		$("#idStatus").slideToggle();\
	      }\
	    }\
	}\
}).keyup(function(e) {\
	if (e.keyCode == $.ui.keyCode.ENTER)\
	{\
   		if($("#idNum").val().length >= 6)\
          	$(this).dialog( "close" );\
        else\
        {\
          	$("#idStatus").html(errorString);\
          	if($("#idNum").not(":visible"))\
          		$("#idStatus").slideToggle();\
        }\
   }\
});\
\
\
/*jQueryUI Modal used to warn student about starting new section*/\
$( "#dialogWarn" ).dialog({\
	dialogClass: "no-close",\
	autoOpen: false,\
	buttons: [{\
		text: "Continue",\
		click: function() {\
			$(this).dialog("close");\
			recordSection();\
			$("#" + $("[id*=questionContainer]:visible").attr("id") + " .compile").click();\
      }\
    },\
    {\
    	text: "Cancel",\
    	click: function(){\
			$(this).dialog("close");\
    	}\
    }]\
});\
\
\
/*Display the first questionContainer*/\
var startElement = $("#questionContainer0");\
startElement.css("display", "block");';


//export template data
exports.header = header;
exports.requires = requires;
exports.pStatementTemplate = pStatementTemplate;
exports.ioTemplate = ioTemplate;
exports.navTemplate = navTemplate;
exports.mcCodeTemplate = mcCodeTemplate;
exports.mcOptionTemplate = mcOptionTemplate;
exports.mcClose = mcClose;
exports.editorInit = editorInit;
exports.script = script;
