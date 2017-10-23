//console.log('testInfo: ', testInfo);

//Leaving the page will result in the loss of data.
//While there are a number of ways to try and disable the back/forward/refresh button, none are guaranteed.
//See: http://www.irt.org/script/311.htm
window.onbeforeunload = function() { return "If you leave this page, any work will be unrecoverable."; };

//Variables that track test section (0 or 1 = part 1 or 2), specify divide (defined by number of ".mcOptions" class occurences), and backup skeleton code
var section = {number: 0, warn: false};
var structure = Object.freeze({count: $("[id*=questionContainer]").length, divide: $(".mcOptions").length});
var skeletonCode = [];
var modes = [];
var submitted = false;

//Multi-dem array [[dirty bit, max time(ms), timeDiff, time of pause(date.getTime()), current time(min)]] used to preserve timers
var timingData = new Array();


//Difficulty multiplier used to calculate max time for questions (essentially, [ question difficulty * (n + 1) ] = max minutes it should take, n being the 'level' of difficulty 0 - n)
var difficultyMultiplier = 10;

//section1 will hold section1 answers and freeze them so they may not be modified after completing part 1
var section1 = {};

//might need to change when editor init calls are made until after resources are loaded	
function loadCmResources(){
    var cmJsResources = [
	    './includes/js/codemirror-5.12/addon/display/autorefresh.js',
	    './includes/js/codemirror-5.12/addon/edit/matchbrackets.js',
	    './includes/js/codemirror-5.12/mode/clike/clike.js',
	    './includes/js/codemirror-5.12/mode/python/python.js'
    ];

    for(var i = 0; i < cmJsResources.length; i++)
    {
    	var fileref = document.createElement('script');
        fileref.setAttribute("type","text/javascript");
        fileref.setAttribute("src", cmJsResources[i]);
    	$("head")[0].appendChild(fileref);
    }
}


//Refresh CM here since we added the cm resource files here instead of on page load which messes with load order.
//NOTE: This function isn't called due to issues with dynamicall loading cm add-on libs. Because of this, they must be explicitly loaded on the page for now
function refreshCmInstances() {
	// $('.CodeMirror').each(function(idx, el){
	// 	console.log('cm instance: ', el); 
	// 	//el.setOption('mode', 'clike');
	// 	el.CodeMirror.refresh();
	// });

	//See this conversation with the CM developer regarding switching options: https://discuss.codemirror.net/t/issues-with-dynamically-adding-add-ons-after-load/676
	for(var i = 0; i < structure.count; i++)
	{
		console.log('cm instance: ', $('.CodeMirror')[i].CodeMirror); 
		var cm = $('.CodeMirror')[i].CodeMirror;
		cm.setOption('matchBrackets', true);
		cm.setOption('autoRefresh', true);
		cm.setOption('mode', modes[i]);
		cm.refresh();
	}
}

//Back up skeletone code so it can be reset back to original state
function backupSkeletonCode() {
	for(var i = 0; i < structure.count; i++)
	{
		skeletonCode.push($('.CodeMirror')[i].CodeMirror.options.value);
	}
}


//A function that will create a codemirror editor instance with passed id, bool readonly, and language mode.
//Currently does not work for codemirror, as it seems to need to be loaded immediately
function editor(id, rOnly, mode) {
	modes.push(mode);

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
    	styleActiveLine: true,
    	smartIndent: true
    });
}


//Function that starts pbar, accepts a jq object, and max time and id key
function initPbar(bar, maxTime, key) {
	timingData[key] = [0, maxTime, 1, 0, '0:00'];
	bar = $(bar);
	var start = new Date();
    var timeoutVal = 1000;

    //begin update loop, passing bar div, start time obj, relevant timingData key, and update timout value
    animateUpdate(bar, start, key, timeoutVal);
}


//calls updateProgress until it reaches 100%. 
//args: bar: the bar div, start: the starting time object, timeoutVal: update at this frequency (ms), key: relevant timingData key
function animateUpdate(bar, start, key, timeoutVal) {
    //Setting current date object, maxtime (the time limit (ms)), and timeDiff
    var now = new Date();
    var maxTime = timingData[key][1];
    var timeDiff = now.getTime() - start.getTime();

    // Perc gives count down, relevant process exam display text (serverFunctions.js:192)
    var perc = Math.round((timeDiff/maxTime)*100);
    timingData[key][2] = timeDiff;

    //update until we have reached 100%
	if (perc <= 100 && (maxTime - timeDiff) > 0) {
		updateProgress(bar, perc, (maxTime - timeDiff));
		setTimeout(animateUpdate, timeoutVal, bar, start, key);
	}
}


//Updates bar and formats time remaining into minutes:seconds
//Accepts jq obj, percentage int, and remaining time int
function updateProgress(bar, percentage, remainingTime) {
    bar.css("width", percentage + "%");
    var formattedHour = Math.floor(remainingTime / (60*60*1000));
    var formattedMin = Math.floor((remainingTime % (1000*60*60)) / (1000*60));
    var formattedSec = Math.floor(((remainingTime % (1000*60*60)) % (1000*60)) / 1000);

    //force seconds to show leading 0 (e.g. 1:07 vs 1:7 )
    if(formattedSec < 10) 
    	formattedSec = "0" + formattedSec;

     //necessary due to weird overflow errors giving negative numbers
    if(formattedMin.valueOf() < 1)
		formattedMin = 0;
    if(formattedSec.valueOf() < 1)
    	formattedSec = "00";
    formattedHour = (formattedHour.valueOf() < 1) ?  "" : formattedHour + ":"
    bar.next().text(formattedHour + formattedMin + ":" + formattedSec);
}


//Update label content, accepts string
function updateStatusLabel(message) {
	//console.log('Status label update: ' + message);
	$('#statusLabel').html(message);
}

//function that allows timing bars to be paused
//Accepts the current page index and the target page index
//See timingData definition for structure information
function adjustTiming(currentIndex, targetIndex) {
	//if current timing isn't finished (timeDiff > 0)
	if (timingData[currentIndex][2] > 0) {
		//Mark target index as dirty and backup time of switch and the current time string
		timingData[currentIndex][0] = 1;
		var now = new Date();
		timingData[currentIndex][3] = now.getTime();
		timingData[currentIndex][4] = $("#progressB" + currentIndex).children().children()[1]["innerHTML"];

	}

	//if target is dirty, adjust maxTime to reflect
	if (timingData[targetIndex][2] > 0 && timingData[targetIndex][0] == 1) {
		//now - time of pause + current maxtime = adjusted maxtime
		timingData[targetIndex][1] = (now.getTime() - timingData[targetIndex][3]) + timingData[targetIndex][1];
		//adjusted, so set dirty to 0
		timingData[targetIndex][0] = 0;
	}
}


//accepts an integer as target index and switches from current 'page' to target 'page' via index
function goNav(targetIndex) {
	var curr = $("[id*=questionContainer]:visible");
	var currentIndex = parseInt(curr.attr("id").substring(17, curr.attr("id").length));
	//if target is 0 through max# defined in structure, and target is not current view
	if(targetIndex >= 0 && targetIndex < structure.count && targetIndex != currentIndex)
	{
		//Init pbar only if question is not active to avoid resetting, while starting automatically.
		if($("#progressB" + targetIndex).hasClass("activeBar") == false)
		{
			$("#progressB" + targetIndex).addClass("activeBar");
			var difficultyValue = (parseFloat(difficulty[targetIndex]) == 0) ? (difficultyMultiplier * .5) : (parseFloat(difficulty[targetIndex]) * difficultyMultiplier);
			initPbar($("#progressB" + targetIndex).children().children()[0], 60000 * difficultyValue, targetIndex);
		}
		
		//disable/enable next/prev buttons as needed
		if(targetIndex == 0)
		{
			$("#navBLeft").removeClass("button");
			$("#navBLeft").addClass("button_disable");
		} else
		{
			$("#navBLeft").removeClass("button_disable");
			$("#navBLeft").addClass("button");
		}

		if(targetIndex ==  structure.count - 1)
		{
			$("#navBRight").removeClass("button");
			$("#navBRight").addClass("button_disable");
		} else
		{
			$("#navBRight").removeClass("button_disable");
			$("#navBRight").addClass("button");
		}

		$("#navShortcutElement" + currentIndex).removeClass("selected");
		$("#navShortcutElement" + targetIndex).addClass("selected");

		//if forward
		if(targetIndex > currentIndex)
		{
			//If you want to keep users from seeing 2nd section before finishing 1st:
			//If attempting to access second section from first section by checking against frozen structure.divide var. (current before divide, target after)
			// if(currentIndex < $(".mcOptions").length && targetIndex >= $(".mcOptions").length) {}

			curr.toggle("slide", {"direction":"left"}, function(){
				$("#questionContainer" + targetIndex).toggle("slide", {"direction":"right"});
			});
		} else { //if backward
			curr.toggle("slide", {"direction":"right"}, function(){
				$("#questionContainer" + targetIndex).toggle("slide", {"direction":"left"});
			});
		}

		//Adjust time, if necessary
		adjustTiming(currentIndex, targetIndex);
	}
}


//populate nav list, append "|" character to display separation between code and other question types using frozen structure.divide var
for(var i = 0; i < $("[id*=questionContainer]").length; i++)
{
	//append shortcut
	$("#navShortcutContainer").append("<span id=\'navShortcutElement" + i + "\'>" + (i+1) + "</span>");
	//apply selected class to first shortcut
	if(i==0)
		$("#navShortcutElement" + i).addClass("selected");
	if(i < structure.divide)
		$("#navShortcutElement" + i).addClass("navShortcutElement section1");
	else
		$("#navShortcutElement" + i).addClass("navShortcutElement section2");
	//Print visual separator
	if(i == structure.divide - 1)
		$("#navShortcutContainer").append("<b> |<b/>");
}


//navigate between problems using shortcuts via goNav function. -1 to compensate for starting at 1 instead of 0
$(".navShortcutElement").on("click", function(){
	goNav(parseInt($(this).html())-1);
});


//navigate between problems using arrow keys via goNav function
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


//dynamically add items from nearest selectbox. These inputs are passed into stdin when run
$(".addInput").on("click", function(){
	$(this).parent().find("select").append("<option>"+$(this).prev("input").val()+"</option>");
	$(this).prev("input").val("");
});


//dynamically remove items from nearest selectbox.
$(".delInput").on("click", function(){
	var lbox = $(this).parent().find("select");
	$("option:selected", lbox).remove();
});


// Dynamic listener to allow for only one radio to be selected per question 
$(".mcOptions").on("change", "[type=radio]", function (e) {
	var thisCtx = $(this);
	$.each($("." + $(this).attr("class")), function(){
		if(!$(this).is(thisCtx))
			$(this).prop("checked", false);
	});
});


//Records input from section 1 and freezes object in order to keep answers from being modified.
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


/** On compile, finds parents parents id (pos. 17 to string end as the id will always be "questionContainer#") to get question num which is used to specify which codemirror editor. 
 * Then gets the editor value, maps inputs to array->str (separated by newlines). Finally posts data to server via ajax call
**/
$(".compile").on("click", function(){
	//Ensures student is aware they are beginning next section
	if(section.warn == false)
	{
		$("#dialogWarn").dialog("open");
		return false;
	}
	var btnContext = $(this);
	var parentID = $(this).parent().parent().attr("id");
	var index = parseInt(parentID.substring(17, parentID.length));
	var lbox = $(this).parent().parent().find("select option");
	var mode = modes[index];

	//Set c++ for clike syntax specifically since it is a general styling. 
	//We're only supporting c++ right now so no need to get more complex
	//We also support python, but since the mode is 'python' no change is needed
	if(mode == "clike")
		mode = "c++";

	var data = {
		"test_id": testInfo.test_id,
		"course_id": testInfo.course_id,
		"index": index,
		"language": mode,
		"code": $(".CodeMirror")[index].CodeMirror.getValue(),
		"input": $.map(lbox ,function(option) {return option.value;}).join('\n') + '\n'
	};

	//Alert user that compilation has begun
	var closestResults = btnContext.parent().parent().find(".results");
	if(!closestResults.is(":visible"))
		closestResults.show("blind", 500);
	btnContext.parent().parent().find(".codeResults").val("Working...");

	$.ajax({
		  type: "POST",
		  url: "/compile",
		  dataType: "json",
		  data: JSON.stringify(data),
    	  contentType: "application/json",
		  success: function(response){
		  	console.log("resp:", response);
		  	var result = "";
		  	if(response.Errors && response.Errors != "null")
		  		result += "Errors: " + response.Errors + "\n";
		  	if(response.Warnings)
		  		result += "Warnings: " + response.Warnings + "\n";
		  	if(response.Result)
		  		result += response.Result;
		  	btnContext.parent().parent().find(".codeResults").val(result);
		  },
		  error: function(xhr, status, err){
		  	console.log("error: ", xhr, status, err);
		  }
	});
});


//Button which resets code to original skeleton state
$(".reset").on("click", function(){
	if(confirm('Are you sure you want to reset the code? This action cannot be undone.')) {
		//just going to use javascript here instead of jquery because cm is being difficult.
		var parentId = $(this).parent().attr('id');
		var id = parentId.charAt(parentId.length - 1);

		$('.CodeMirror')[id].CodeMirror.doc.setValue(skeletonCode[id]);
	}
});


//on submit click, prompt user with modal
$(".submit").on("click", function(){
	$("#dialogSubmit").dialog("open");
});


//On submit, send to server. Uses structure.divide because it dictates the length of mchoice types since they will always come first
function submitExam(){
	recordSection();
	$("#dialogSubmit").html("processing " + structure.count + " answers. . .");
	console.log("processing " + structure.count + " answers.");
	var type = [];
	var num = [];
	var solution = [];
	var input = [];
	var timings = [];

	//record mult-choice question data
	for(var i = 0; i < structure.divide; i++)
	{
		type.push("mchoice");
		num.push(i);
		solution.push(section1.ans[i]);
		input.push([]);

		//if undefined, it means the question was never opened or never had it's timing adjusted. If unadjusted, current index below takes care of that. Otherwise question was skipped.
		timings.push((timingData[i]) ? timingData[i][4] : 'No data');
	}

	//record code question data
	for(var i = structure.divide; i < structure.count; i++)
	{
		type.push("code");
		num.push(i);
		solution.push($(".CodeMirror")[i].CodeMirror.getValue());
		var lbox = $("#questionContainer" + i).find("select option");
		input.push($.map(lbox ,function(option) {return option.value;}));
		timings.push((timingData[i]) ? timingData[i][4] : 'No data');
	}

	//get current index, update pbar timing since only the current one will be outdated on submit
	var curr = $("[id*=questionContainer]:visible");
	var currentIndex = parseInt(curr.attr("id").substring(17, curr.attr("id").length));
	timings[currentIndex] = $("#progressB" + currentIndex).children().children()[1]["innerHTML"];

	//get exam time
	var examPbarDiv = $('#totalProgress').children()[1];
	timings.push(examPbarDiv.children[1]["innerHTML"]);

	var data = {
		"test_id": testInfo.test_id,
		"course_id": testInfo.course_id,
		"idNum": $("#idNum").val(),
		"problemType": type,
		"problemNum": num,
		"solution": solution,
		"input": input,
		"timings": timings
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
				//Display score to student, disable submit button
				$("#dialogSubmit").html("Final score: " + response.score);
				$('#bannerRight > span').html('View score');
				submitted = true;
		  	}
		},
		error: function(response){
  			$("#dialogSubmitBtn").button("option", "disabled", false);
			$("#dialogSubmit").html("Error: " + response.statusText);
			console.log(response);
		}
	});
}

//spawn a warning for each of the specified times
function warnTiming (warnTimes) {
	warnTimes = warnTimes.split(',');
	var msg = '';
	for(var i = 0, warnCount = warnTimes.length; i < warnCount; i++)
	{
		//console.log('warnTimes: ', warnTimes);

		msg = 'WARNING: ' + warnTimes[i] + ' minutes remaining!';

		//Warn when n mins left, testInfo.test_length -> ms
		setTimeout(updateStatusLabel, (testInfo.test_length - (warnTimes[i] * 60000)), msg);
	}
}

//Open submit modal, lock submit btn, then submit exam
function timeoutSubmitExam()
{
	if(submitted == false) {
		$("#dialogSubmit").dialog("open");
		$("#dialogSubmitBtn").button("option", "disabled", true); 
		submitExam();
	}
}

//Initialize test submit/warning timeouts, inits probressBar, and backs up skeleton code
//Must be called right after student ID is saved
function initExam()
{
	//Initialize test timeout limit and time warnings
	setTimeout(timeoutSubmitExam, (testInfo.test_length));
	warnTiming(testInfo.warnTimes);

	//Init progress bar
	initPbar($("#totalProgress .pbar_inner"), testInfo.test_length, 'examTotal');
  	$("#progressB0").addClass("activeBar");
  	var difficultyValue = (parseFloat(difficulty[0]) == 0) ? (difficultyMultiplier * .5) : (parseFloat(difficulty[0]) * difficultyMultiplier);
	initPbar($("#progressB0").children().children()[0], 60000 * difficultyValue, 0);

	//store initial code state for resetting.
	backupSkeletonCode();
}


//jQueryUI Modal used to retrieve student ID
//Must auto-open so it can get student ID first, and then call initExam()
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
	      {
	      	$(this).dialog("close");
	      	initExam();
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
          	initExam();
   		}
        else
        {
          	$("#idStatus").html(errorString);
          	if($("#idNum").not(":visible"))
          		$("#idStatus").slideToggle();
        }
   }
});


//jQueryUI Modal used to warn student about starting new section
//If continue is chose, first section answers are frozen and will not accept new input.
//Opens only if section.warn var is false
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


//jQueryUI Modal used to warn student about submitting exam and finishing attempt
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


//Display the first questionContainer
var startElement = $("#questionContainer0");
startElement.css("display", "block");
