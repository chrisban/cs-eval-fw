//Not called due to bug in loading cm+add-ons dynamically.
//loadCM();

/*jQueryUI Modal used to warn student about submitting exam and finishing attempt*/
$( "#requestInfo" ).dialog({
	autoOpen: true,
	buttons: [{
		id: "dialogBtnSubmitRequest",
		text: "Submit",
		click: function() {
			if($('#courseID').val().length > 0 && $('#courseID').val().length > 0)
			{
				$.ajax({
				    url: "/getModule",
				    type: "POST",
				    dataType: "json",
				    data: JSON.stringify({course_id: $('#courseID').val(), test_id: $('#quizID').val(), type: "exam"}),
				    contentType: "application/json",
				    cache: false,
					async: false, //ensures completion before continuting on
				    success: function(res){
				    	if(res['error']) {
				    		$('#infoStatus').html(res['error']);
				    	} else {
				    		console.log("[ModuleSelector.js] Success response: ", res);
					    	$('body').html(res['response_html']);
						    eval(res['response_script']);
				    	}
				    },
				    error: function(res){
				    	console.log("[ModuleSelector.js] Error response: ", res);
				    }
				});
			}
      	}
    },
    {
    	text: "Cancel",
    	click: function(){
			$(this).dialog("close");
    	}
    }]
}).keyup(function(e) {
	if (e.keyCode == $.ui.keyCode.ENTER)
	{
   		$('#dialogBtnSubmitRequest').trigger('click');
   }
});


//Function that loads cm js/css
//Not called due to bug in loading cm+add-ons dynamically.
function loadCM(){
	//cm.css
	var fileref = document.createElement('link');
    fileref.setAttribute("rel", "stylesheet");
    fileref.setAttribute("type", "text/css");
    fileref.setAttribute("href", './includes/js/codemirror-5.12/lib/codemirror.css');
	$("head")[0].appendChild(fileref);

	//cm.js
	fileref = document.createElement('script');
    fileref.setAttribute("type","text/javascript");
    fileref.setAttribute("src", './includes/js/codemirror-5.12/lib/codemirror.js');
	$("head")[0].appendChild(fileref);
}