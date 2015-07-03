//Defines html template data
//placeholders denoted by lt/gt symbols e.g.: <<PLACEHOLDER>>
//TODO: LIST/DETAIL EACH PLACEHOLDER

 var header = '<div id="container"><div id="banner"><h1>Code compilation and execution</h1></div>\
 Enter or modify the code below and press \'Compile\' to view results.<br /><br />';

//TODO: move all codemirror libs here
var requiresTemplate = '<link type="text/css" href="/includes/css/include.css" rel="stylesheet" media="screen"/>';

//questionContainer will be closed at the end of ioTemplate
var pStatementTemplate = '<div id="questionContainer<<n>>"><div id="problemStatement<<n>>"><<pstatement>></div>';

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

var editorTemplate = 'var editor<<n>> = CodeMirror.fromTextArea($("#code<<n>>")[0], {theme: "default", lineNumbers: true, matchBrackets: true, enableCodeFormatting: true, autoFormatOnStart: true, autoFormatOnUncomment: true, mode: "clike", styleActiveLine: true});';


//dynamically add and remove items from nearest selectbox
var script = 'var lbox = $("#inputSel");\
			$(".addInput").on("click", function(){\
				$(this).parent().find("select").append("<option>"+$(this).prev("input").val()+"</option>");\
		    	$(this).prev("input").val("");\
		    });\
		    $(".delInput").on("click", function(){\
		    	var lbox = $(this).parent().find("select");\
		    	$("option:selected", lbox).remove();\
		    });'


//export template data
exports.header = header;
exports.requiresTemplate = requiresTemplate;
exports.pStatementTemplate = pStatementTemplate;
exports.ioTemplate = ioTemplate;
exports.editorTemplate = editorTemplate;
exports.script = script;
