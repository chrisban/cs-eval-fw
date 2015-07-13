//Defines html template data
//placeholders denoted by lt/gt symbols e.g.: <<PLACEHOLDER>>
//TODO: LIST/DETAIL EACH PLACEHOLDER

//Template order for HTML object to be sent to client: 
/*
1. Requires
2. Header (opens over-arching 'container' div)

* NOTE: for 3-4, server should iterate through each object in exam datafile, appending a new version of these templates and replacing their placeholder vars with datafile data
3. pStatementTemplate (opens exam question encapsulating 'questionContainer' div)
4. ioTemplate (closes exam question encapsulating 'questionContainer' div)
*

5. navTemplate (closes over-arching 'container' div) exists once, inserted once at the end of the html object sent to client as it closes the container div.
*/


//For js script object to be sent to client:
/*
1. editorTemplate (Each should be appended to the script sent to client, with the <<n>> placeholder replaced with iteration index )
*/


//TODO: move all codemirror libs here
var requires = '<link type="text/css" href="/includes/css/include.css" rel="stylesheet" media="screen"/>';

//Container div closes at the end of 
 var header = '<div id="container"><div id="banner"><h1>Practice Exam</h1></div>\
Enter or modify the code below and press \'Compile\' to execute and view results.<br /><br />';

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
		<input type="button" class="compile" value="Compile">\
		<div class="results">\
			<b>Results:</b> <br />\
			<textarea class="codeResults" rows="5" cols="100"></textarea>\
		</div>\
		<input type="button" class="commitB" value="Commit">\
	</div>\
	</div>'; //extra </div> to close questionContainer div opened in pStatementTemplate

//PLACEHOLDERS: <<navshortcuts>> = a span for each index that can be used to quick jump to a specific question.
var navTemplate = '<div id="nav"><hr />\
					<button id="navBLeft" type="button" disabled> << Prev </button>\
					<div id="navShortcutContainer"></div>\
					<button id="navBRight" type="button"> Next >> </button>\
				</div>\
				</div>'; //extra </div> to close container div opened in header

//codemirror initialization script
//PLACEHOLDERS: <<n>> = question number
var editorTemplate = 'var editor<<n>> = CodeMirror.fromTextArea($("#code<<n>>")[0], {theme: "default", lineNumbers: true, matchBrackets: true, enableCodeFormatting: true, autoFormatOnStart: true, autoFormatOnUncomment: true, mode: "clike", styleActiveLine: true});';


//NOTE: Comments will be included here as the script var will be minified to one line and sent to the client to be eval'd

//for-loop: 				populate nav list
//listener 1-2: 			navigate between problems using shortcuts or arrow keys via goNav function
//goNav(targetIndex) fn: 	accepts an integer as target index and switches from current problem to specified problem via index
//listener 3-4: 			dynamically add and remove items from nearest selectbox.
//listener 5: 				On compile, finds parent's parent's id (17 to string end as the id will always be 'questionContainer#') to get question number which is used to specify which codemirror editor
//								Then gets nearest editor value, map inputs. Finally post data to server via ajax call
//listern 6: 				On commit, send to server, perform grading, mark as committed and uneditable

var script = 'for(var i = 0; i < $("[id*=questionContainer]").length; i++)\
			{\
				$("#navShortcutContainer").append("<span class=\'navShortcutElement\' id=\'navShortcutElement" + i + "\'>" + i + "</span>");\
			}\
\
			$(".navShortcutElement").on("click", function(){\
				goNav(parseInt($(this).html()));\
			});\
\
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
			function goNav(targetIndex){\
				var curr = $("[id*=questionContainer]:visible");\
				var currentIndex = parseInt(curr.attr("id").substring(17, curr.attr("id").length));\
				var qCount = $("[id*=questionContainer]").length;\
				if(targetIndex >= 0 && targetIndex < qCount && targetIndex != currentIndex)\
				{\
					if(targetIndex == 0)\
						$("#navBLeft").prop("disabled",true);\
					else\
						$("#navBLeft").prop("disabled",false);\
					if(targetIndex ==  qCount - 1)\
						$("#navBRight").prop("disabled",true);\
					else\
						$("#navBRight").prop("disabled",false);\
					if(targetIndex > currentIndex)\
					{\
						curr.toggle("slide", {"direction":"left"}, function(){\
							$("#questionContainer" + targetIndex).toggle("slide", {"direction":"right"});\
						});\
					}else\
					{\
						curr.toggle("slide", {"direction":"right"}, function(){\
							$("#questionContainer" + targetIndex).toggle("slide", {"direction":"left"});\
						});\
					}\
				}\
			}\
\
			$(".addInput").on("click", function(){\
				$(this).parent().find("select").append("<option>"+$(this).prev("input").val()+"</option>");\
		    	$(this).prev("input").val("");\
		    });\
\
		    $(".delInput").on("click", function(){\
		    	var lbox = $(this).parent().find("select");\
		    	$("option:selected", lbox).remove();\
		    });\
\
			$(".compile").on("click", function(){\
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
			$(".commitB").on("click", function(){\
				var currentIndex = parseInt($(this).parent().parent().attr("id").substring(17, $(this).parent().parent().attr("id").length));\
				$("#navShortcutElement" + currentIndex).addClass("committed");\
				$(this).prop("disabled",true);\
			});\
\
			var startElement = $("#questionContainer0");\
			startElement.css("display", "block");';


//export template data
exports.header = header;
exports.requires = requires;
exports.pStatementTemplate = pStatementTemplate;
exports.ioTemplate = ioTemplate;
exports.editorTemplate = editorTemplate;
exports.navTemplate = navTemplate;
exports.script = script;
