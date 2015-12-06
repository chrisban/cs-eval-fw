/*GET js/css files*/
loadResources();

/*Variables that track test section (0 or 1 = part 1 or 2) and specify divide (defined by number of ".mcOptions" class occurences)*/
var section = {number: 0, warn: false};
var structure = Object.freeze({count: $("[id*=questionContainer]").length, divide: $(".mcOptions").length});

/*section1 will hold section1 answers and freeze them so they may not be modified after completing part 1*/
var section1 = {};


/*Function used to get code editor resources. */
function loadResources(){
	var cm = "<link rel='stylesheet' href='/includes/js/codemirror-5.3/lib/codemirror.css'>\
		<script src='/includes/js/codemirror-5.3/lib/codemirror.js'></script>\
		<script src='/includes/js/codemirror-5.3/addon/display/autorefresh.js'></script>\
		<script src='/includes/js/codemirror-5.3/addon/edit/matchbrackets.js'></script>\
		<script src='/includes/js/codemirror-5.3/mode/clike/clike.js'></script>\
		<script src='/includes/js/codemirror-5.3/mode/python/python.js'></script>";
    //$("head").append(cm); TODO: fix!
}


/*A function that will create a codemirror editor instance with passed id, bool readonly, and language mode.*/
/*Currently does not work for codemirror, as it seems to need to be loaded immediately*/
function editor(id, rOnly, mode)
{
    CodeMirror.fromTextArea(id, 
	{
		readOnly: rOnly,
		theme: "default",
    	lineNumbers: true,
    	matchBrackets: true,
    	autoRefresh: true,
    	enableCodeFormatting: true,
    	autoFormatOnStart: true,
    	autoFormatOnUncomment: true,
    	mode: mode,
    	styleActiveLine: true
    });
}


/*Function that starts pbar, accepts a js div object, and max time*/
function initPbar(bar, maxTime){
	bar = $(bar);
	var start = new Date();
    var timeoutVal = 1000;
    animateUpdate(bar, start, maxTime, timeoutVal);
}


/*updates bar and formats time remaining into minutes:seconds*/
function updateProgress(bar, percentage, remainingTime) {
    bar.css("width", percentage + "%");
    var formattedSec = Math.round((remainingTime/1000) % 60);
    var formattedMin = Math.round((remainingTime/(1000*60)) % 60);
    if(formattedSec < 10) formattedSec = "" + 0 + formattedSec;
    if(formattedMin < 1) /*necessary due to weird overflow errors giving negative numbers*/
	{
		formattedMin = 0;
    	formattedSec = 00;
    }
    bar.next().text(formattedMin + ":" + formattedSec);
}


/*calls updateProgress until it reaches 100%*/
function animateUpdate(bar, start, maxTime, timeoutVal) {
    var now = new Date();
    var timeDiff = now.getTime() - start.getTime();
    var perc = Math.round((timeDiff/maxTime)*100);
	if (perc <= 100) {
		updateProgress(bar, perc, (maxTime - timeDiff));
		setTimeout(animateUpdate, timeoutVal, bar, start, maxTime);
	}
}


/*accepts an integer as target index and switches from current problem to specified problem via index*/
function goNav(targetIndex){
	var curr = $("[id*=questionContainer]:visible");
	var currentIndex = parseInt(curr.attr("id").substring(17, curr.attr("id").length));
	/*if target is 0 - max# defined in structure, and target is not current view*/
	if(targetIndex >= 0 && targetIndex < structure.count && targetIndex != currentIndex)
	{
		/*Init pbar only if question is not active to avoid resetting, while starting automatically.*/
		if($("#progressB"+targetIndex).hasClass("activeBar") == false)
		{
			$("#progressB"+targetIndex).addClass("activeBar");
			initPbar($("#progressB"+targetIndex).children().children()[0], 60000 * ((difficulty[targetIndex]+1)*10));
		}
		
		/*disable/enable next/prev buttons as needed*/
		if(targetIndex == 0)
		{
			$("#navBLeft").removeClass("button");
			$("#navBLeft").addClass("button_disable");
		}
		else
		{
			$("#navBLeft").removeClass("button_disable");
			$("#navBLeft").addClass("button");
		}
		if(targetIndex ==  structure.count - 1)
		{
			$("#navBRight").removeClass("button");
			$("#navBRight").addClass("button_disable");
		}
		else
		{
			$("#navBRight").removeClass("button_disable");
			$("#navBRight").addClass("button");
		}
		$("#navShortcutElement" + currentIndex).removeClass("selected");
		$("#navShortcutElement" + targetIndex).addClass("selected");
		/*if forward*/
		if(targetIndex > currentIndex)
		{
			/*If attempting to access second section from first section by checking against frozen structure.divide var. (current before divide, target after)*/
			if(currentIndex < $(".mcOptions").length && targetIndex >= $(".mcOptions").length)
			{
				
			}
			curr.toggle("slide", {"direction":"left"}, function(){
				$("#questionContainer" + targetIndex).toggle("slide", {"direction":"right"});
			});
		}
		/*if backward*/
		else
		{
			curr.toggle("slide", {"direction":"right"}, function(){
				$("#questionContainer" + targetIndex).toggle("slide", {"direction":"left"});
			});
		}
	}
}


/*populate nav list, append "|" character to display separation between code and other question types using frozen structure.divide var*/
for(var i = 0; i < $("[id*=questionContainer]").length; i++)
{
	/*append shortcut*/
	$("#navShortcutContainer").append("<span id=\'navShortcutElement" + i + "\'>" + (i+1) + "</span>");
	/*apply selected class to first shortcut*/
	if(i==0)
		$("#navShortcutElement" + i).addClass("selected");
	if(i < structure.divide)
		$("#navShortcutElement" + i).addClass("navShortcutElement section1");
	else
		$("#navShortcutElement" + i).addClass("navShortcutElement section2");
	/*Print visual separator*/
	if(i == structure.divide - 1)
		$("#navShortcutContainer").append("<b> |<b/>");
}


/*navigate between problems using shortcuts via goNav function. -1 to compensate for starting at 1 instead of 0*/
$(".navShortcutElement").on("click", function(){
	goNav(parseInt($(this).html())-1);
});


/*navigate between problems using arrow keys via goNav function*/
$("[id*=navB]").on("click", function(){
	var direction = $(this).attr("id").substring(4, $(this).attr("id").length);
	var curr = $("[id*=questionContainer]:visible");
	var currentIndex = parseInt(curr.attr("id").substring(17, curr.attr("id").length));
	if (direction == "Right")
	{
		goNav(currentIndex + 1);
	} else if(direction == "Left")
	{
		goNav(currentIndex - 1);
	}
});


/*dynamically add items from nearest selectbox.*/
$(".addInput").on("click", function(){
	$(this).parent().find("select").append("<option>"+$(this).prev("input").val()+"</option>");
	$(this).prev("input").val("");
});


/*dynamically remove items from nearest selectbox.*/
$(".delInput").on("click", function(){
	var lbox = $(this).parent().find("select");
	$("option:selected", lbox).remove();
});


/* Dynamic listener to allow for only one radio to be selected per question */
$(".mcOptions").on("change", "[type=radio]", function (e) {
	var thisCtx = $(this);
	$.each($("." + $(this).attr("class")), function(){
		if(!$(this).is(thisCtx))
			$(this).prop("checked", false);
	});
});


/*Records input from section 1 and freezes object in order to keep answers from being modified.*/
function recordSection()
{
	section.warn = true;
	Object.freeze(section);
	var ans = [];
	for(var i = 0; i < structure.divide; i++)
	{
		var anstmp = [];
		for(var j = 0; j < $("#questionContainer" + i + " .mcSubQ").length; j++)
		{
			var val = $(".mc" + i + "_" + j).filter(":checked").val();
			if(jQuery.type( val ) === "string")
				anstmp.push(val);
			else
				anstmp.push("");
		}
		ans.push(anstmp);
	}
	Object.freeze(section1.ans = ans);
	$(".mcOptions input:radio").attr("disabled",true);
	console.log("ans: ", ans);
}


/*On compile, finds parents parents id (pos. 17 to string end as the id will always be "questionContainer#") to get q. num which is used to specify which codemirror editor. Then gets the editor value, maps inputs to array->str. Finally posts data to server via ajax call*/
$(".compile").on("click", function(){
	/*Ensures student is aware they are beginning next section*/
	if(section.warn == false)
	{
		$("#dialogWarn").dialog("open");
		return false;
	}
	var btnContext = $(this);
	var parentID = $(this).parent().parent().attr("id");
	var index = parentID.substring(17, parentID.length);
	var lbox = $(this).parent().parent().find("select option");
	var mode = $(".CodeMirror")[parseInt(index)].CodeMirror.getOption("mode");
	var lang = "";

	/*TODO: Needs more complex logic for clike langs instead of defaulting to C++ if not python*/
	//default to python for now
	if(mode == "clike")
		lang = "c++";
	else
		lang = "python";

	var data = {
		"language": lang,
		"Program": $(".CodeMirror")[parseInt(index)].CodeMirror.getValue(),
		"input": $.map(lbox ,function(option) {return option.value;}).join(' ')
	};

	$.ajax({
		  type: "POST",
		  url: "/compile",
		  dataType: "json",
		  data: JSON.stringify(data),
    	  contentType: "application/json",
		  success: function(response){
		  	var closestResults = btnContext.parent().parent().find(".results");
			if(!closestResults.is(":visible"))
				closestResults.show("blind", 500);
		  	console.log("resp:", response);
		  	var result = "";
		  	if(response.Errors)
		  		result += "Errors: " + response.Errors + "\\n";
		  	if(response.Warnings)
		  		result += "Warnings: " + response.Warnings + "\\n";
		  	if(response.Result)
		  		result += response.Result;
		  	btnContext.parent().parent().find(".codeResults").val(result);
		  },
		  error: function(xhr, status, err){
		  	console.log("error: ", xhr, status, err);
		  }
	});
});


/*Button which applies a class to thumbnails in order to aid students in tracking which questions are complete*/
$(".commit").on("click", function(){recordSection();
  	$("#navShortcutElement" + parseInt($(this).parent().attr("id").substring(17, $(this).parent().attr("id").length))).addClass("committed");
});


/*on submit click, prompt user with modal*/
$(".submit").on("click", function(){
	$("#dialogSubmit").dialog("open");
});


/*On submit, send to server. Uses structure.divide because it dictates the length of mchoice types since they will always come first*/
function submitExam(){
	recordSection();
	$("#dialogSubmit").html("processing " + structure.count + " answers. . .");
	console.log("processing " + structure.count + " answers.");
	var type = [];
	var num = [];
	var solution = [];
	var input = [];
	for(var i = 0; i < structure.divide; i++)
	{
		type.push("mchoice");
		num.push(i);
		solution.push(section1.ans[i]);
		input.push([]);
	}
	for(var i = structure.divide; i < structure.count; i++)
	{
		type.push("code");
		num.push(i);
		solution.push($(".CodeMirror")[i].CodeMirror.getValue());
		var lbox = $("#questionContainer" + i).find("select option");
		input.push($.map(lbox ,function(option) {return option.value;}));
	}
	var data = {
		"test_id": testInfo.test_id,
		"course_id": testInfo.course_id,
		"idNum": $("#idNum").val(),
		"problemType": type,
		"problemNum": num,
		"solution": solution,
		"input": input
	};

	$.ajax({
		  type: "POST",
		  url: "/submit",
		  dataType: "json",
		  data: JSON.stringify(data),
    	  contentType: "application/json",
		  success: function(response){
		  	if(response.status == "ok")
	  		{
				/*Display score to student, disable submit button*/
				$("#dialogSubmit").html("Final score: " + response.score);
		  	}
		},
		error: function(response){
  			$("#dialogSubmitBtn").button("option", "disabled", false);
			$("#dialogSubmit").html("Error: " + response.statusText);
			console.log(response);
		}
	});
}


/*jQueryUI Modal used to retrieve student ID*/
var errorString = "Error: ID number must be at least 6 digits";
$( "#dialogID" ).dialog({
	position: {my: "top+200",at: "top", of: window},
	closeOnEscape: false,
	dialogClass: "no-close",
	autoOpen: true,
	autoResize: true,
	height: "auto",
	width: "auto",
	modal: true,
	buttons: {
	    "Save": function() {
	      if($("#idNum").val().length >= 6)
	      {/*TODO: retrieve initpbar val from server!*/
	      	$(this).dialog("close");
	      	initPbar($("#totalProgress .pbar_inner"), testInfo.test_length);
	      	$("#progressB0").addClass("activeBar");
			initPbar($("#progressB0").children().children()[0], 60000 * ((difficulty[0]+1)*10));
	      }
	      else
	      {
	      	$("#idStatus").html(errorString);
	      	if($("#idNum").not(":visible"))
	      		$("#idStatus").slideToggle();
	      }
	    }
	}
}).keyup(function(e) {
	if (e.keyCode == $.ui.keyCode.ENTER)
	{
   		if($("#idNum").val().length >= 6)
   		{
          	$(this).dialog( "close" );
	      	initPbar($("#totalProgress .pbar_inner"), testInfo.test_length);
	      	$("#progressB0").addClass("activeBar");
			initPbar($("#progressB0").children().children()[0], 60000 * ((difficulty[0]+1)*10));
   		}
        else
        {
          	$("#idStatus").html(errorString);
          	if($("#idNum").not(":visible"))
          		$("#idStatus").slideToggle();
        }
   }
});


/*jQueryUI Modal used to warn student about starting new section*/
$( "#dialogWarn" ).dialog({
	dialogClass: "no-close",
	autoOpen: false,
	buttons: [{
		text: "Continue",
		click: function() {
			$(this).dialog("close");
			recordSection();
			$("#" + $("[id*=questionContainer]:visible").attr("id") + " .compile").click();
      }
    },
    {
    	text: "Cancel",
    	click: function(){
			$(this).dialog("close");
    	}
    }]
});


/*jQueryUI Modal used to warn student about submitting exam and finishing attempt*/
$( "#dialogSubmit" ).dialog({
	autoOpen: false,
	buttons: [{
		id: "dialogSubmitBtn",
		text: "Submit",
		click: function() {
  			$("#dialogSubmitBtn").button("option", "disabled", true);
			submitExam();
      }
    },
    {
    	text: "Cancel",
    	click: function(){
			$(this).dialog("close");
    	}
    }]
});


/*Display the first questionContainer*/
var startElement = $("#questionContainer0");
startElement.css("display", "block");