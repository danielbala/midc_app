var 
    LOGIN_URL = 'https://www.interactivehealthpartner.com/idc/login.asp',
    CONFIG_URL = 'https://www.interactivehealthpartner.com/idc/ihp_config.xml',
    IHPUSER_URL = 'https://www.interactivehealthpartner.com/idc/ihpuser.asp?id=',
    LANGUAGE_FILE = 'https://www.interactivehealthpartner.com/idc/midc-lang.json',
    APPDATA_URL = 'https://www.interactivehealthpartner.com/idc/midc-data.asp?id=',
    IHPPROCESS_URL = 'https://www.interactivehealthpartner.com/idc/process.asp?id=',
    UPLOAD_URL = 'https://www.interactivehealthpartner.com/idc/server_upload.php?dest=',
    FORGOT_PWD_URL = 'https://www.interactivehealthpartner.com/mfc_managepc.asp?task=pin',

//COUNTERS PUT IN GLOBAL SCOPE SO WE CAN STOP AND START ELSEWHERE
    stepsCounter = calorieCounter = distanceCounter = timeSecCounter = timeMinCounter = {},
//current user
    ID_NUMBER = null,

// FOR TESTING
    OFFLINE = false,

//data object holders 
    appData = {},
    appLang = {},
    currLang = "en", //default language

//native process
    nativeProcess = new air.NativeProcess(),
	
//courier communication object
    courierData = {
	    "address": "123A12345AOQ",
	    "uom": 0,
	    "steps": 0,
	    "calories": 0,
	    "distance": {
	        "whole": 0,
	        "fraction": 0
	    },
	    "time": {
	        "hour": 0,
	        "minute": 0,
	        "seconds": 0
	    }
	},

//operating system
    OS = air.Capabilities.os.substr(0, 3).toLowerCase();

//global events
try{
	//PUT BACK
    window.nativeWindow.addEventListener(air.Event.CLOSING, doSignOut);
}catch(e){}

function doLoad(env){
	
	//checkForUpdate(); //PUT BACK
	
	//remember user init
    
	if (env == "app") {
		rememberUser();
	}
	
	assignEventHandlers(env);
	
	getAppLanguage(function(){
		//system language
		try {
			currLang = air.Capabilities.language;
			
			//if they ever change language it is set in local storage... retrieve it
			var setLang = get_from_localStorage('appLang');
			if (setLang) {
				currLang = setLang;
			}
		}catch (e) {}
		
		//translateApp
		translateTo(currLang);
		//show main wrapper
		$("#wrapper").delay(2000).fadeIn("slow");
		
	});//END getAppLanguage
    
	
	//prepare all the counters
	initCounters();
	
	return;
}
//HELPER FUNCTIONS
function showMessage(msg, callback){
	$(".alert_message p").html(msg);
	$(".alert_message").animate({top: "-86px"}, "slow", function(){		
        $(".alert_message").css({zIndex: "2"});
    });
    if(callback){
        callback.call();
    }
}
function hideMessage(){
    $(".alert_message p").html("");
    $(".alert_message").css({zIndex: "-1"}).animate({top: "25px"}, "slow");
}

var btinterval = 0;
function showBTLoading(){
	
	btinterval = setInterval(
	   function(){
	   	$("b.on").stop().fadeIn(500, function(){
	   		
			setTimeout(function(){
	   			$("b.on").stop().fadeOut(500);
				//set the text to connecting...
				$(".lbl_bt").text(appLang[currLang]["lbl_bt_search"]);
	   		}, 700);
	   	});
	   }, 1800);
}
function clearBTLoading(connected){
    clearInterval(btinterval);
	
	if (typeof connected == "undefined") {
	   if (nativeProcess.running) {
	       connected = true;
	   }
	   else {
	       connected = false;
	   }
	}
	
	if (connected) {
		$("b.on").fadeIn("fast");
		//set the text to connected
		$(".lbl_bt").text(appLang[currLang]["lbl_bt_connected"]);
	}
	else {
	   $("b.on").fadeOut("fast");
	   //set the text to OFF
	   $(".lbl_bt").text(appLang[currLang]["lbl_bt_off"]);
	}
}

function assignEventHandlers(env){
	//click handlers
    $('#signin').click(function(){
        
        $(".intro").hide();
        $('#invalid_login').hide();
        $("#progress").show();
        
        doSignIn(function(){
            
            populateData(function(){
                
                hideLoginItems(function(){
    				
					prepareChart("ul.actual_charts .steps");
    				prepareChart("ul.actual_charts .calories");
    				prepareChart("ul.actual_charts .distance");
    				prepareChart("ul.actual_charts .time");

                    //open the settings menu so you can see the action going on
                    $(".tab_link").click();
					//START BLUETOOTH LISTENER
					//initCourier();
					
					
    				//position, set defaults and sticky
    	            positionWidget(env);

                    $('#main').fadeIn('slow');
                    
                    //setTimeout(function(){
                	//    showMessage("Press 1 to start Time!<br /> Press 2 to start Steps<br /> Press p to Pause<br /> Press r to Resume");
                	//},1000);

    			});//END hideLoginItems(function(){
    			
            });//END populateData(function(){
            
        });//END doSignIn(function(){
        
    });//END $('#signin').click(function(){
    
    $('.close_app').click(function(){
		doSignOut();
    });
    $('#exit').live("click", function(){
        justQuit();
    });
	
	$('.connectAgain').live("click", function(){
		hideMessage();
        initCourier();
    });
	$(".doBluetooth").click(function(){
		if (!nativeProcess.running) {
           showMessage(appLang[currLang]["msg_treadmill_connect"]+ " <input class='connectAgain button' type='button' value='"+appLang[currLang]["btn_yes"]+"'/><input class='close_message_bt button' type='button' value='"+appLang[currLang]["btn_no"]+"' />");
       }
		
		
	});
	
    //forgot my password link click
    $('#reminder_link').click(function(){
		var url = FORGOT_PWD_URL;
		var urlReq = new air.URLRequest(url);
		air.navigateToURL(urlReq);

	});
    $(".pull_tab").live("click", function(){
        if($(".pull_tab").hasClass("close_inner")){
            $(".inner").hide("slow", function(){
                $(".pull_tab").addClass("close_timer").removeClass("close_inner");
            });
        }else if($(".pull_tab").hasClass("close_timer")){
            $(".timer").hide("slow", function(){
                $(".pull_tab").removeClass("close_timer").addClass("close_tab open_timer");
            });
        }else if($(".pull_tab").hasClass("open_timer")){
            $(".timer").show("fast", function(){
                $(".pull_tab").addClass("open_inner").removeClass("open_timer");
            });
        }else{
            $(".inner").show("slow", function(){
                $(".pull_tab").addClass("close_inner").removeClass("open_inner close_tab");
            });
        }
        
        return false;
    });
    
    $(".tab_link").click(function(){
        if($(".drop_tab").hasClass("open_drop_tab")){
            $(".drop_tab").removeClass("open_drop_tab","slow");
            $(".tab_link").removeClass("close_tab_link");
            $(".settings_menu").removeClass("settings_menu_on");
        }else{
            $(".drop_tab").addClass("open_drop_tab","slow");
            $(".tab_link").addClass("close_tab_link","slow");
        }
        return false;
    });
    
    $(".close_message, .close_message_bt").live("click",function(){
        hideMessage();
        return false;
    });
    $(".toggle_settings").click(function(){
        $(".settings_menu").toggleClass("settings_menu_on");
    });
    $(".do_sync").live("function", function(){
        doSync(false);// quit app = false
        return false;
    });
    $(".chart_menu li").click(function(){
		$(".settings_menu").removeClass("settings_menu_on");
        $(".chart_menu li, .actual_charts li").removeClass("selected");
		var this_class = $(this).attr("class");
        $(this).addClass("selected");
		$(".actual_charts li."+this_class).addClass("selected");
		
		//STORE LAST SELECTED CHART IN LOCAL STORAGE
		try{
	        add_to_localStorage('selectedChart', this_class);
		}catch(e){}
    });
	$(".doMetric").click(function(){
		doMetric();
		$(".settings_menu").removeClass("settings_menu_on");
		return false;
	});
	$(".doImperial").click(function(){
        doImperial();
		$(".settings_menu").removeClass("settings_menu_on");
		return false;
    });
	$(".translate").click(function(){
        currLang = $(this).attr("rel");
		translateTo($(this).attr("rel"));
		$(".settings_menu").removeClass("settings_menu_on");
        return false;
    });
	$(".doSync").live("click", function(){
	   doSync(true);//quit app = true
	   return false;
	});
	$(".justQuit").live("click", function(){
       justQuit();
	   return false;
    });
	//login/logout
    $('#remember').click(function(){
        doRemember();
    });
	
    keypressHandler();
	
}
function keypressHandler(event){
    $('body').keypress(function(e){
        //air.trace(e.which);
		//ENTER key
        //enter should submit
        if (e.which == 13) {
            $('#signin').click();
			
            /*if ($('#signin').is(':visible')) {
                if(OFFLINE){
                    ID_NUMBER = "138";
                    $('#login_items').fadeOut('fast');
                    $('#main').delay(1000).fadeIn('slow');
                    $('#invalid_login').fadeOut('fast');
                    //get config; - possible fail - this will populate: CONFIG_FILES_ARRAY
                    //getConfig("file:///Library/WebServer/Documents/bbd/sample_files/ihp_config_new.xml");
                    //attempt to auto upload
                    //setTimeout(auto_upload,1000);
                }else{
                    
                }
            }
            
            e.preventDefault();
            return false;*/
        }
		
        if (e.which == 49) { //#1
            
			courierData.steps++;
			courierData.calories++;
			courierData.distance.whole++;
			courierData.distance.fraction +=2;
			courierData.time.seconds += 10;
			courierData.time.minute++;
            
			mock_onOutputData(JSON.stringify(courierData));
            
        }
        /*if (e.which == 50) { //#2
            if ($('#signin').is(':visible')) {
                
            }else{
                stepsCounter.setAuto(true).setValue(0);
            }
        }
        if (e.which == 112) { //p
            if ($('#signin').is(':visible')) {
                
            }else{
                stepsCounter.setAuto(false);
                timeSecCounter.setAuto(false);
                timeMinCounter.setAuto(false);
            }
        }
        if (e.which == 114) { //r
            if ($('#signin').is(':visible')) {
                
            }else{
                stepsCounter.setAuto(true);
                timeSecCounter.setAuto(true);
                timeMinCounter.setAuto(true);
            }
        }*/
        
    });
    
}
function hideLoginItems(callback){
    $("#wrapper").css("background-image","none").css("background-color","transparent");
    
    $("#login_items div").fadeOut(1000, function(){
        $("#login_items").fadeOut(700, function(){

        }); 
    });
    
    setTimeout(function(){
        callback();
    }, 1200);
}

function prepareChart(item){
	var chartSpecs = getChartSpecs(item);
    var tallestXvalue = chartSpecs.maxValue;
    var yaxiscount = chartSpecs.yaxislength;

    var maxBarHeight = 28 * yaxiscount; // 28 comes from CSS: #main ul.sections li.inner li.chart ul.actual_charts li ul.yaxis li
    var css_ratio = maxBarHeight / tallestXvalue;
    
    $(item + " .bars").css("height", maxBarHeight);
    
    $(item + " .bars li").each(function(){
        
        var this_height = parseInt($(this).html());
        
        var css_height = this_height * css_ratio;
		if(this_height > tallestXvalue){
			css_height = maxBarHeight;
		}
        var topshouldbe = maxBarHeight - css_height;
		
		//console.log(maxBarHeight, this_height, css_height, css_ratio, tallestXvalue );
        if (this_height > 0) {
            $(this).css({
                 height: Math.ceil(css_height)+"px",
                 top: Math.floor(topshouldbe) + "px",
                 visibility: "visible"
            });
            
        }else{
			$(this).css({
                 height: "1px",
                 visibility: "hidden"
            });
			
		}
    });
}

function getChartSpecs(item){
	var barArr = [];
	$(item + " .yaxis li").each(function(){
        var num = parseInt($(this).html().replace(",",""));
		if (num) {
			barArr.push(num);
		}
    });
	return {
		maxValue: Array.max(barArr),
		yaxislength: barArr.length
	};
}

function positionWidget(env){
	/*setTimeout(function(){
	    showMessage("Hello, you can close me if you want to!");
	},1000);*/
	
	if (env == "app") {
        window.nativeWindow.x = (air.Capabilities.screenResolutionX - 675);
        window.nativeWindow.y = (air.Capabilities.screenResolutionY - 475) / 2;
        
	    var selectedChart = get_from_localStorage('selectedChart');
	    
		if (selectedChart) {
            //SET LAST SELECTED CHART
			var currChart = selectedChart;
			$(".chart_menu li, .actual_charts li").removeClass("selected");
			
			$(".chart_menu li."+currChart).addClass("selected");
			$(".actual_charts li."+currChart).addClass("selected");
            $(".settings_menu").removeClass("settings_menu_on");
          
        }
		
    }
}

//JAVA, BLUETOOTH, AND SOCKET ACTION!
function initCourier(){
    
	if (nativeProcess.running) {
	   //already connected, do nothing
	   return;
	}   
	showBTLoading();
	
	var path_to_java = "";
	if (OS === "mac") {
	   path_to_java = "/usr/bin/java";
	}
	else {
		//c:\> for %i in (java.exe) do @echo.   %~$PATH:i
	   path_to_java = "c:\\windows\\system32\\java.exe";
	}
	
	var java_file = new air.File(path_to_java); //PATH TO JAVA
    air.trace("java path", java_file.nativePath);
	
	//alert(OS+" :: "+path_to_java+" :: "+"java path :: "+ java_file.nativePath);
	
	if(air.NativeProcess.isSupported)
    {
        air.trace("native process supported");

        var np_file = air.File.applicationDirectory.resolvePath("Courier.jar");
        
		var known_address = get_from_localStorage("known_address");
		var user_weight = appData.Weight ? appData.Weight : "null";
		
        var processArgs = new air.Vector["<String>"]();
        processArgs.push("-jar");
        processArgs.push("-d32"); //FORCE 32bit mode
		
		//processArgs.push(String(known_address)); //known address from local storage
		//processArgs.push(user_weight); //known user weight
		
        processArgs.push(np_file.nativePath);
        
        var nativeProcessStartupInfo = new air.NativeProcessStartupInfo();
        nativeProcessStartupInfo.executable = java_file;
        nativeProcessStartupInfo.arguments = processArgs;
        
        nativeProcess.start(nativeProcessStartupInfo); 
        nativeProcess.addEventListener(air.ProgressEvent.STANDARD_OUTPUT_DATA, onOutputData);
        nativeProcess.addEventListener(air.ProgressEvent.STANDARD_ERROR_DATA, onErrorData);
        nativeProcess.addEventListener(air.NativeProcessExitEvent.EXIT, onExit);
        nativeProcess.addEventListener(air.IOErrorEvent.STANDARD_OUTPUT_IO_ERROR, onIOError);
        nativeProcess.addEventListener(air.IOErrorEvent.STANDARD_ERROR_IO_ERROR, onIOError);
        
        sendCourierMessage("searchDevices\n");
        
    }
    else
    {
		clearBTLoading(false);
        alert("Your system does not support Bluetooth communication --- CODE:NO-NP001");
    }
	
}
//@param string message
function sendCourierMessage(message){
    
	if (nativeProcess.running) {
		
		air.trace("process running send message: "+ message);
		nativeProcess.standardInput.writeMultiByte(message, "utf-8");
		
	}
	else {
        clearBTLoading(false);
		air.trace("process not running:"+ message);
	}
}

function mock_onOutputData(msg){
    
	try {
		msgData = JSON.parse(msg);
		$.extend(courierData, msgData);
		air.trace(msg);
		initCounters();
	} 
	catch (e) {
		air.trace("catch parse error:", e.message);
	}
}

//bluetooth event handlers
function onOutputData()
{
	var msg = nativeProcess.standardOutput.readUTFBytes(nativeProcess.standardOutput.bytesAvailable);
    air.trace("courier message: ", msg);
	
	if (msg.indexOf("INQUIRY_COMPLETED") !== -1) {
        
		air.trace("GOT CONNECT FROM COURIER");
		clearBTLoading(true);
		
		showMessage(appLang[currLang]["msg_treadmill_connected"], function(){
            setTimeout(hideMessage,3000);
        });
	}
	else if (msg.indexOf("address")) {
	   
	   try {
	   	msgData = JSON.parse(msg);
	   	$.extend(courierData, msgData);
	   	air.trace(courierData);
	   } 
	   catch (e) {
	       air.trace("catch parse error:", e.message);
	   }
	}
	//$("#wrapper ul").append("<li style='color:green'>msg: "+ msg+"</li>"); 
}

function onErrorData(event)
{
	var err = nativeProcess.standardError.readUTFBytes(nativeProcess.standardError.bytesAvailable)
    air.trace("ERROR -", err);
	//$("#wrapper ul").append("<li style='color:red'>error: "+ err+"</li>"); 
}

function onExit(event)
{
    air.trace("Process exited with ", event.exitCode);
	clearBTLoading(false);
	//$("#wrapper ul").append('<input id="exit" type="button" value="Exit" class="button" />');
	
}

function onIOError(event)
{
     air.trace(event.toString());
}
//END bluetooth event handlers


function initCounters(){
	// Initialize Steps counter
    stepsCounter = new flipCounter('stepsflip-counter', {value:courierData.steps, inc:2, pace:1000, auto:false, precision:5});
    // Initialize Calorie counter
    calorieCounter = new flipCounter('caloriesflip-counter', {value:courierData.calories, inc:1, pace:1000, auto:false, precision:4});
    // Initialize Distance counter
    distanceCounter = new flipCounter('distanceflip-counter', {value:courierData.distance.whole, inc:1, pace:1000, auto:false, precision:4});
    // Initialize Time Seconds counter
    timeSecCounter = new flipCounter('timeSecflip-counter', {value:courierData.time.seconds, inc:1, pace:1000, auto:false, precision:2, maxCount:60});
    // Initialize Time Minute counter
    timeMinCounter = new flipCounter('timeMinflip-counter', {value:courierData.time.minute, inc:1, pace:62000, auto:false, precision:2});
}

function populateData(callback){
    
    //air.trace("in popdata", appData);
    
    getDataFrom(APPDATA_URL+ID_NUMBER, "", function(response){
        
        //air.trace("popdataback ", response);
        
        appData = JSON.parse(response);
        
        $(".First_Name").html(appData.First_Name);

    	$(".Xaxis_1").html(appData.Xaxis_1);
    	$(".Xaxis_2").html(appData.Xaxis_2);
    	$(".Xaxis_3").html(appData.Xaxis_3);
    	$(".Xaxis_4").html(appData.Xaxis_4);
    	$(".Xaxis_5").html(appData.Xaxis_5);
    	$(".Xaxis_6").html(appData.Xaxis_6);
    	$(".Xaxis_7").html(appData.Xaxis_7);

    	$(".Yaxis_Steps_1").html(appData.Yaxis_Steps_1);
    	$(".Yaxis_Steps_2").html(appData.Yaxis_Steps_2);
    	$(".Yaxis_Steps_3").html(appData.Yaxis_Steps_3);
    	$(".Yaxis_Steps_4").html(appData.Yaxis_Steps_4);
    	$(".Yaxis_Steps_5").html(appData.Yaxis_Steps_5);
    	$(".Yaxis_Steps_6").html(appData.Yaxis_Steps_6);

    	$(".Yaxis_Calories_1").html(appData.Yaxis_Calories_1);
    	$(".Yaxis_Calories_2").html(appData.Yaxis_Calories_2);
    	$(".Yaxis_Calories_3").html(appData.Yaxis_Calories_3);
    	$(".Yaxis_Calories_4").html(appData.Yaxis_Calories_4);
    	$(".Yaxis_Calories_5").html(appData.Yaxis_Calories_5);
    	$(".Yaxis_Calories_6").html(appData.Yaxis_Calories_6);

    	$(".Yaxis_Distance_1").html(appData.Yaxis_Distance_1);
    	$(".Yaxis_Distance_2").html(appData.Yaxis_Distance_2);
    	$(".Yaxis_Distance_3").html(appData.Yaxis_Distance_3);
    	$(".Yaxis_Distance_4").html(appData.Yaxis_Distance_4);
    	$(".Yaxis_Distance_5").html(appData.Yaxis_Distance_5);
    	$(".Yaxis_Distance_6").html(appData.Yaxis_Distance_6);

    	$(".Yaxis_Time_1").html(appData.Yaxis_Time_1);
    	$(".Yaxis_Time_2").html(appData.Yaxis_Time_2);
    	$(".Yaxis_Time_3").html(appData.Yaxis_Time_3);
    	$(".Yaxis_Time_4").html(appData.Yaxis_Time_4);
    	$(".Yaxis_Time_5").html(appData.Yaxis_Time_5);
    	$(".Yaxis_Time_6").html(appData.Yaxis_Time_6);

    	$(".Steps_1").html(appData.Steps_1);
    	$(".Steps_2").html(appData.Steps_2);
    	$(".Steps_3").html(appData.Steps_3);
    	$(".Steps_4").html(appData.Steps_4);
    	$(".Steps_5").html(appData.Steps_5);
    	$(".Steps_6").html(appData.Steps_6);
    	$(".Steps_7").html(appData.Steps_7);

    	$(".Calories_1").html(appData.Calories_1);
    	$(".Calories_2").html(appData.Calories_2);
    	$(".Calories_3").html(appData.Calories_3);
    	$(".Calories_4").html(appData.Calories_4);
    	$(".Calories_5").html(appData.Calories_5);
    	$(".Calories_6").html(appData.Calories_6);
    	$(".Calories_7").html(appData.Calories_7);

    	$(".Distance_1").html(appData.Distance_1);
        $(".Distance_2").html(appData.Distance_2);
        $(".Distance_3").html(appData.Distance_3);
        $(".Distance_4").html(appData.Distance_4);
        $(".Distance_5").html(appData.Distance_5);
        $(".Distance_6").html(appData.Distance_6);
        $(".Distance_7").html(appData.Distance_7);

    	$(".Time_1").html(appData.Time_1);
    	$(".Time_2").html(appData.Time_2);
    	$(".Time_3").html(appData.Time_3);
    	$(".Time_4").html(appData.Time_4);
    	$(".Time_5").html(appData.Time_5);
    	$(".Time_6").html(appData.Time_6);
    	$(".Time_7").html(appData.Time_7);
		
		$(".Steps_Total").html(appData.Steps_Total);
        $(".Steps_Daily_Average").html(appData.Steps_Daily_Average);
        
		$(".Calories_Total").html(appData.Calories_Total);
        $(".Calories_Daily_Average").html(appData.Calories_Daily_Average);
        
		$(".Distance_Total").html(appData.Distance_Total);
        
		$(".Distance_Daily_Average").html(appData.Distance_Daily_Average);
		
		$(".Time_Total").html(appData.Time_Total);
		$(".Time_Daily_Average").html(appData.Time_Daily_Average);
		
		//if all the totals are 0
		if(appData.Steps_Total == 0 && appData.Calories_Total == 0, appData.Distance_Total == 0 && appData.Time_Total == 0){
		  showMessage(appLang[currLang]["msg_no_treadmill_7days"]);
		}
        
		//TRANSLATE DAY OF THE WEEK ABBREVIATIONS
	    if (typeof appData.Xaxis_1 != "undefined") {
	        $(".Xaxis_1").html(appLang[currLang]["lbl_" + appData.Xaxis_1.toLowerCase()]);
	        $(".Xaxis_2").html(appLang[currLang]["lbl_" + appData.Xaxis_2.toLowerCase()]);
	        $(".Xaxis_3").html(appLang[currLang]["lbl_" + appData.Xaxis_3.toLowerCase()]);
	        $(".Xaxis_4").html(appLang[currLang]["lbl_" + appData.Xaxis_4.toLowerCase()]);
	        $(".Xaxis_5").html(appLang[currLang]["lbl_" + appData.Xaxis_5.toLowerCase()]);
	        $(".Xaxis_6").html(appLang[currLang]["lbl_" + appData.Xaxis_6.toLowerCase()]);
	        $(".Xaxis_7").html(appLang[currLang]["lbl_" + appData.Xaxis_7.toLowerCase()]);
	    }
        callback();
        return false;
    });
	
	showMessage(appLang[currLang]["msg_no_treadmill_yet"]);
    return false;
}

function doImperial(){
	//alert("imperial");
	//console.log(appData);
	$(".Distance_1").html(appData.Distance_1);
    $(".Distance_2").html(appData.Distance_2);
    $(".Distance_3").html(appData.Distance_3);
    $(".Distance_4").html(appData.Distance_4);
    $(".Distance_5").html(appData.Distance_5);
    $(".Distance_6").html(appData.Distance_6);
    $(".Distance_7").html(appData.Distance_7);
	
	$(".Distance_Total").html(appData.Distance_Total);
    
    $(".Distance_Daily_Average").html(appData.Distance_Metric_Daily_Average);
	
	$(".Yaxis_Distance_1").html(appData.Yaxis_Distance_1);
    $(".Yaxis_Distance_2").html(appData.Yaxis_Distance_2);
    $(".Yaxis_Distance_3").html(appData.Yaxis_Distance_3);
    $(".Yaxis_Distance_4").html(appData.Yaxis_Distance_4);
    $(".Yaxis_Distance_5").html(appData.Yaxis_Distance_5);
    $(".Yaxis_Distance_6").html(appData.Yaxis_Distance_6);
	
	prepareChart("ul.actual_charts .distance");
}
function doMetric(){
    //console.log(appData);
    $(".Distance_1").html(appData.Distance_Metric_1);
    $(".Distance_2").html(appData.Distance_Metric_2);
    $(".Distance_3").html(appData.Distance_Metric_3);
    $(".Distance_4").html(appData.Distance_Metric_4);
    $(".Distance_5").html(appData.Distance_Metric_5);
    $(".Distance_6").html(appData.Distance_Metric_6);
    $(".Distance_7").html(appData.Distance_Metric_7);
	
	$(".Distance_Total").html(appData.Distance_Metric_Total);
        
    $(".Distance_Daily_Average").html(appData.Distance_Metric_Daily_Average);
	
	$(".Yaxis_Distance_1").html(appData.Yaxis_Distance_Metric_1);
    $(".Yaxis_Distance_2").html(appData.Yaxis_Distance_Metric_2);
    $(".Yaxis_Distance_3").html(appData.Yaxis_Distance_Metric_3);
    $(".Yaxis_Distance_4").html(appData.Yaxis_Distance_Metric_4);
    $(".Yaxis_Distance_5").html(appData.Yaxis_Distance_Metric_5);
    $(".Yaxis_Distance_6").html(appData.Yaxis_Distance_Metric_6);
	
	prepareChart("ul.actual_charts .distance");
}
function translateTo(lang){
	//console.log(appLang[lang]);
	//FIND ALL span elements, and get their first assigned classname and check translations to see if it exists
	$("body span").each(function(){
		
		var this_class = $(this).prop("class").split(" ")[0];
		
		//console.log(this_class, appLang[lang][this_class]);
		if(typeof appLang[lang][this_class] !== "undefined"){
			$(this).html(appLang[lang][this_class]);
		}
	});
	//TRANSLATE DAY OF THE WEEK ABBREVIATIONS
	if (typeof appData.Xaxis_1 != "undefined") {
		$(".Xaxis_1").html(appLang[lang]["lbl_" + appData.Xaxis_1.toLowerCase()]);
		$(".Xaxis_2").html(appLang[lang]["lbl_" + appData.Xaxis_2.toLowerCase()]);
		$(".Xaxis_3").html(appLang[lang]["lbl_" + appData.Xaxis_3.toLowerCase()]);
		$(".Xaxis_4").html(appLang[lang]["lbl_" + appData.Xaxis_4.toLowerCase()]);
		$(".Xaxis_5").html(appLang[lang]["lbl_" + appData.Xaxis_5.toLowerCase()]);
		$(".Xaxis_6").html(appLang[lang]["lbl_" + appData.Xaxis_6.toLowerCase()]);
		$(".Xaxis_7").html(appLang[lang]["lbl_" + appData.Xaxis_7.toLowerCase()]);
	}
	
	$("#signin").val(appLang[lang]["btn_signin"]);
	$("#exit").val(appLang[lang]["btn_exit"]);
	
	//translate the bluetooth status as well.
	clearBTLoading();
	
	//german text is too long
	/*if(lang == "de"){
	    $(".lbl_calories").css("font-size","13px");
	}else{
	    $(".lbl_calories").css("font-size","inherit");
	}*/
	
	//STORE LAST SELECTED LANGUAGE
	try{
	    add_to_localStorage('appLang',lang);
    }catch(e){}
	
	
}

function getAppLanguage(callback){
	appLang = {
	    "en": {
	        "lbl_lastname": "Last Name",
			"lbl_password": "Password",
			"lbl_remember": "Remember Me",
			"lbl_invalid_password": "Invalid Username and Password!<br/>Please Try Again or Click <a id='reminder_link' href='#'>here</a> for a reminder.",
			"lbl_intro": "Use to view your treadmill desk results in real time on your computer.",
			"lbl_steps": "Steps",
	        "lbl_distance": "Distance",
	        "lbl_calories": "Calories",
	        "lbl_time": "Time",
	        "lbl_hr": "hr.",
	        "lbl_min": "min.",
	        "lbl_sec": "sec.",
	        "lbl_today": "Today",
	        "lbl_hrs": "hrs.",
	        "lbl_monday": "M",
	        "lbl_tuesday": "T",
	        "lbl_wednesday": "W",
	        "lbl_thursday": "TH",
	        "lbl_friday": "F",
	        "lbl_saturday": "S",
	        "lbl_sunday": "SU",
	        "lbl_logout": "Logout",
	        "lbl_settings": "Settings",
	        "lbl_sync": "Account Sync",
			"btn_confirm_sync": "Sync",
			"btn_just_quit": "Just Quit",
			"btn_signin":"Sign In",
			"btn_exit": "Exit",
			"btn_yes": "Yes",
			"btn_no": "No",
	        "lbl_7daytotal": "7-Day Total",
	        "lbl_daily_average": "Daily Average",
	        "lbl_last7days": "Last 7 Days",
	        "lbl_bt_off": "OFF",
	        "lbl_bt_search": "Searching...",
	        "lbl_bt_connected": "Connected",
	        "lbl_treadmill_desk": "Treadmill Desk",
	        "msg_no_treadmill_yet": "There is no treadmill desk data to display yet.",
	        "msg_no_treadmill_7days": "There is no treadmill desk data for the previous 7 days.",
	        "msg_treadmill_connect": "Do you wish to connect to the treadmill desk?",
	        "msg_treadmill_connected": "Connected with treadmill desk",
	        "msg_uploading": "uploading exercise data <img src='icons/loading.gif' alt='loading' width='43' height='11' />",
	        "msg_upload_complete": "upload complete",
			"msg_session_ending": "IHP Data Communicator Session Ending <img src='icons/loading.gif' alt='loading' width='43' height='11' />",
			"msg_sync_before_quit": "Do you want to Sync before you quit?"
	    },
	    "de": {
			"lbl_lastname": "Nachname",
            "lbl_password": "Passwort",
            "lbl_remember": "Remember Me",
			"lbl_invalid_password": "Ung&uuml;ltiger Benutzername und Passwort!<br/>Bitte versuchen Sie es oder Klicken Sie <a id='reminder_link' href='#'>hier</a> f&uuml;r eine Erinnerung.",
            "lbl_intro": "Verwenden Sie auf Ihrem Laufband Schreibtisch Ergebnisse in Echtzeitsehen auf Ihrem Computer.",
	        "lbl_steps": "Schritte",
	        "lbl_distance": "Strecke",
	        "lbl_calories": "Kalorien",
	        "lbl_time": "Zeit",
	        "lbl_hr": "Std.",
	        "lbl_min": "min.",
	        "lbl_sec": "sek.",
	        "lbl_today": "Heute",
	        "lbl_hrs": "std.",
	        "lbl_monday": "M",
	        "lbl_tuesday": "D",
	        "lbl_wednesday": "MI",
	        "lbl_thursday": "DO",
	        "lbl_friday": "F",
	        "lbl_saturday": "S",
	        "lbl_sunday": "SO",
	        "lbl_logout": "Verlassen",
	        "lbl_settings": "Einstellungen",
	        "lbl_sync": "Sync",
			"btn_confirm_sync": "Sync",
			"btn_just_quit": "Einfach Aufh&ouml;ren",
			"btn_signin":"Login",
            "btn_exit": "Verlassen",
            "btn_yes": "Ja",
            "btn_no": "Nein",
	        "lbl_7daytotal": "Gesamt 7 Tage",
	        "lbl_daily_average": "Durchschnitt t&auml;glich",
	        "lbl_last7days": "die letzten 7 Tage",
	        "lbl_bt_off": "aus",
	        "lbl_bt_search": "wird gesucht...",
	        "lbl_bt_connected": "verbunden",
	        "lbl_treadmill_desk": "Laufbandkonsole",
	        "msg_no_treadmill_yet": "Es k&ouml;nnen keine Laufbanddaten angezeigt werden.",
	        "msg_no_treadmill_7days": "Keine Daten aus den letzten 7 Tagen.",
	        "msg_treadmill_connect": "Wollen Sie eine Verbindung zu der Laufbandkonsole herstellen?",
	        "msg_treadmill_connected": "Verbindung mit der Laufbandkonsole besteht",
	        "msg_uploading": "Trainingsdaten werden &uuml;bertragen   <img src='icons/loading.gif' alt='loading' width='43' height='11' />",
	        "msg_upload_complete": "Daten&uuml;bertragung vollst&auml;ndig",
			"msg_session_ending": "IHP Datenkommunikator Sitzungsende   <img src='icons/loading.gif' alt='loading' width='43' height='11' />",
			"msg_sync_before_quit": "Wollen Sie synchronisieren, bevor Sie aufh&uuml;ren?"
	    },
	    "fr": {}
	};
	
	//getDataFrom(LANGUAGE_FILE, "", function(response){
	//   appLang = JSON.parse(response);
	   callback.call();
	//});
}

function checkForUpdate(){
    //check for update
    var appUpdater = new runtime.air.update.ApplicationUpdaterUI();
	appUpdater.configurationFile = new air.File("app:/updateConfig.xml");
	appUpdater.initialize();
	appUpdater.checkNow();
}
function doSignIn(callback){
    
    var data = null;
	var username = null;
	var password = null;
	var success_login = false;
	var return_data = null;
	
	username = document.getElementById('username').value;
	password = document.getElementById('password').value;
    
    data = "lname=" + escape(username) + "&password=" + escape(password);//we should encypt this...
    
	getDataFrom(LOGIN_URL, data, function(response){
	    
	    //air.trace("back", response);
	    return_data = response.split("|");
        ID_NUMBER = return_data[1];
        //air.trace("#" + ID_NUMBER);
    
        //air.trace(return_data[0]);
        
        if (return_data[0] == "success") {
		
			if (document.getElementById('remember').checked) {
				
				add_to_localStorage('username',username);
				add_to_localStorage('password',password);
				
			}
			else {
				removeUser();
				
			}//END if remember checked 
			//MOVE ON
			callback.call();
			return false;
			
			
		}//END if(response == "success"){
		else {
			if (response == "fail") {
			
				removeUser();
				
				$("#progress").hide();
				$(".intro").hide();
				$('#invalid_login').fadeIn('fast');
				
				//reset username and password	 
				username = document.getElementById('username').value = '';
				password = document.getElementById('password').value = '';
			}//END else if(response == "fail")
		}
	});
	
    return false;
    
}
function doSignOut(){
    rememberUser();
    var calledp = false;
	$(".inner").show("slow", function(){
        $(".pull_tab").addClass("close_inner").removeClass("close_timer open_inner close_tab");
    });
	showMessage(appLang[currLang]["msg_sync_before_quit"]+ " <input class='doSync button' type='button' value='"+appLang[currLang]["btn_confirm_sync"]+"'/><input class='justQuit button' type='button' value='"+appLang[currLang]["btn_just_quit"]+"' />");
	
    
}
function doSync(quit_app){
    showMessage(appLang[currLang]["msg_uploading"], function(){
		
		if (ID_NUMBER !== null && typeof ID_NUMBER != "undefined" ) {
            //PUTBACK
            /*var urlString = IHPPROCESS_URL + ID_NUMBER;
            var urlReqx = new air.URLRequest(urlString);

            var urlStreamx = new air.URLLoader();
            try {
                if(!calledp){
                    air.trace("call processx: " + urlString);
                    urlStreamx.load(urlReqx);
                    calledp = true;
                }
            } 
            catch (error) {
                calledp = false;
                alert("Could not call the process script.");
            }*/
        }
		
	   setTimeout(function(){
	       
		   if (quit_app) {
		   	justQuit();
		   }
		   else {
		   	hideMessage();
		   }
	   },2000);
	
	});
}
function justQuit(){
    showMessage(appLang[currLang]["msg_session_ending"],
        function(){
            setTimeout(function(){
                hideMessage();
                $('#main, #login_items').fadeOut('slow', function(){
                
                    try{air.NativeApplication.nativeApplication.exit();}
                    catch(e){}
                });
                
                
            },2000);
            
        
    
    });
}

function rememberUser(){
	
	var username = get_from_localStorage('username');
	var pass = get_from_localStorage('password');
	
	if (username) {
		document.getElementById('username').value = username
		document.getElementById('password').value = pass;
		document.getElementById('remember').checked = true;
	}
	else {
		document.getElementById('username').value = '';
		document.getElementById('password').value = '';
		document.getElementById('remember').checked = false;
	}
}
function doRemember(){
	var username = get_from_localStorage('username');
    var pass = get_from_localStorage('password');
	
	if (username) {
		removeUser();
	}
}
function removeUser(){
	delete_from_localStorage('username');
	delete_from_localStorage('password');
}
function getDataFrom(url, data, callback){
    air.trace("getdatafromurl: "+ url + " -data: "+data);
	//air.trace(url);
    //air.trace(data);
		
	request = new air.URLRequest(url);
	request.method = air.URLRequestMethod.POST;

	request.data = data;
	loader = new air.URLLoader();
	loader.addEventListener(air.Event.COMPLETE, function(event){
		
		
        air.trace("loader.addEventListener: ",event.target.data);
        	
    	//MOVE ON
		callback(event.target.data);
		return false;
			
			   
    });// loader callback function	
    
    try {
    	loader.load(request);
    } 
    catch (error) {
    	alert("Could not contact server.");
    }
    
    return false;
    
}


//ADD TO LOCAL STORAGE
//@param keyname
//@param string value
function add_to_localStorage(keyname, value){
	air.trace("add_to_localStorage: "+ keyname + "=" + value);
    
	var data = new air.ByteArray();
    data.writeUTFBytes(value);
    air.EncryptedLocalStore.setItem(keyname, data);
}

//get from local storage
//@param keyname
//@return string value
function get_from_localStorage(keyname){
    
	var return_val = null;
	var value = air.EncryptedLocalStore.getItem(keyname);
	
	if (value !== null) {
		return_val = value.readUTFBytes(value.bytesAvailable);
	}
	air.trace("get_from_localStorage: "+ keyname + "=" + return_val);
    
	return return_val;
}
//delete from local storage
//@param key name
function delete_from_localStorage(keyname){
	air.trace("delete_from_localStorage: "+ keyname);
	
	air.EncryptedLocalStore.removeItem(keyname);
}
//UTIL
Array.max = function( array ){
    return Math.max.apply( Math, array );
};
Array.min = function( array ){
    return Math.min.apply( Math, array );
};
