//Defines html template data
//placeholders denoted by lt/gt symbols e.g.: <<PLACEHOLDER>>
//TODO: LIST/DETAIL EACH PLACEHOLDER

 var header = '<div id="container"><div id="banner"><h1>Code compilation and execution</h1></div>\
 Enter or modify the code below and press \'Compile\' to view results.<br /><br />';

//TODO: move all codemirror libs here
var requiresTemplate = '<link type="text/css" href="/includes/css/include.css" rel="stylesheet" media="screen"/>';

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
	</div>\
	</div>'; //extra </div> to close questionContainer div

//codemirror initialization script
//PLACEHOLDERS: <<n>> = question number
var editorTemplate = 'var editor<<n>> = CodeMirror.fromTextArea($("#code<<n>>")[0], {theme: "default", lineNumbers: true, matchBrackets: true, enableCodeFormatting: true, autoFormatOnStart: true, autoFormatOnUncomment: true, mode: "clike", styleActiveLine: true});';


//listener 1-2: dynamically add and remove items from nearest selectbox.
//listener 3: On compile, finds parent's parent's id (17 to string end as the id will always be 'questionContainer#') to get question number which is used to specify which codemirror editor
//				Then gets nearest editor value, map inputs. 
//				Finally post data to server via ajax call
var script = '$(".addInput").on("click", function(){\
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
				var parentID = $(this).parent().parent().attr("id");\
				var index = parentID.substring(17, parentID.length);\
				var val = $(".CodeMirror")[parseInt(index)].CodeMirror.getValue();\
				console.log("\\nPosted code:\\n", val);\
				var lbox = $(this).parent().parent().find("select option");\
				var inputs = $.map(lbox ,function(option) {\
				    return option.value;\
				});\
				inputs = inputs.join(\' \'),\
				console.log("\\nPosted input:\\n", inputs);\
\
				var data = {\
					"LanguageChoiceWrapper": "7",\
					"Program": val,\
					"input": inputs,\
					"compilerArgs": "source_file.cpp -o a.out"\
				};\
\
				$.ajax({\
					  type: "POST",\
					  url: "/compile",\
					  dataType: "json",\
					  data: JSON.stringify(data),\
			    	  contentType: "application/json",\
					  success: function(response){\
						if(!$("#results").is(":visible"))\
							$("#results").show("blind", 500);\
					  	console.log("resp:", response);\
					  	var result = "";\
					  	if(response.Errors)\
					  		result += "Errors: " + response.Errors + "\\n";\
					  	if(response.Warnings)\
					  		result += "Warnings: " + response.Warnings + "\\n";\
					  	if(response.Result)\
					  		result += "Result: " + response.Result;\
					  	$("#codeResults").val(result);\
					  }\
					});\
				});';


//export template data
exports.header = header;
exports.requiresTemplate = requiresTemplate;
exports.pStatementTemplate = pStatementTemplate;
exports.ioTemplate = ioTemplate;
exports.editorTemplate = editorTemplate;
exports.script = script;
