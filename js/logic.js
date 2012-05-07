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

//operating system
    OS = air.Capabilities.os.substr(0, 3).toLowerCase();

//global events
try{
	//PUT BACK
    //window.nativeWindow.addEventListener(air.Event.CLOSING, doSignOut);
}catch(e){}

function doLoad(env){
	
	//move inside successful login
	$("#wrapper").fadeIn("slow", function(){
	   initCourier();
	   $('#exit').live("click", function(){
	        air.NativeApplication.nativeApplication.exit();
	    });

        return true;
	});
    return true;
	//checkForUpdate();
	
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
			var setLang = air.EncryptedLocalStore.getItem('appLang');
			if (setLang != null) {
				currLang = setLang.readUTFBytes(setLang.bytesAvailable);
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

    				//translateTo(currLang);

    				//position, set defaults and sticky
    	            positionWidget(env);

                    $('#main').fadeIn('slow');
                    
                    setTimeout(function(){
                	    showMessage("Press 1 to start Time!<br /> Press 2 to start Steps<br /> Press p to Pause<br /> Press r to Resume");
                	},1000);

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
    
    $(".close_message").click(function(){
        hideMessage();
        return false;
    });
    $(".toggle_settings").click(function(){
        $(".settings_menu").toggleClass("settings_menu_on");
    });
    $(".do_sync").click(function(){
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
		    var data = new air.ByteArray();
	        data.writeUTFBytes(this_class);
	        air.EncryptedLocalStore.setItem('selectedChart', data);
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
	//ENTER key
	//enter should submit
    enterHandler();
	
}

function hideLoginItems(callback){
    $("#wrapper").css("background-image","none").css("background-color","transparent");
    
    $("#login_items div").fadeOut("fast", function(){
        $("#login_items").fadeOut("1200", function(){

        }); 
    });
    
    setTimeout(function(){
        callback();
    }, 1500);
}

function prepareChart(item){
	var chartSpecs = getChartSpecs(item);
    var tallestXvalue = chartSpecs.maxValue;
    var yaxiscount = chartSpecs.yaxislength;

    var maxBarHeight = 28 * yaxiscount; // 28 comes from: #main ul.sections li.inner li.chart ul.actual_charts li ul.yaxis li
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
        
	    var selectedChart = air.EncryptedLocalStore.getItem('selectedChart');
	    
		if (selectedChart != null) {
            //SET LAST SELECTED CHART
			var currChart = selectedChart.readUTFBytes(selectedChart.bytesAvailable);
			$(".chart_menu li, .actual_charts li").removeClass("selected");
			
			$(".chart_menu li."+currChart).addClass("selected");
			$(".actual_charts li."+currChart).addClass("selected");
            $(".settings_menu").removeClass("settings_menu_on");
          
        }
		
    }
}

//JAVA, BLUETOOTH, AND SOCKET ACTION!
function initCourier(){
    
	var path_to_java = "";
	if (OS === "mac") {
	   path_to_java = "/usr/bin/java";
	}
	else {
		//c:\> for %i in (java.exe) do @echo.   %~$PATH:i
	   path_to_java = "c:\windows\system32\java";
	}
	
	var java_file = new air.File(path_to_java); //PATH TO JAVA
    air.trace("java path", java_file.nativePath);
	
	if(air.NativeProcess.isSupported)
    {
        air.trace("native process supported");
        //handlers for BLUETOOTH
        var np_file = air.File.applicationDirectory.resolvePath("bin/Courier.jar");
        
        var processArgs = new air.Vector["<String>"]();
        processArgs.push("-jar");
        //processArgs.push("-d32");
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
        
        if (nativeProcess.running) {
            air.trace("process running");
            nativeProcess.standardInput.writeMultiByte("searchDevices\n", "utf-8");
			$("#wrapper").html("<ul></ul>");
			$("#wrapper").css({color:"#000",backgroundColor:"#fff", width:"300px", height:"300px", overflowY:"scroll"});
        }
        else {
            air.trace("process not running");
        }
        
    }
    else
    {
        alert("NAAY NO NATIVE PROCESS");
    }
	
}
//bluetooth event handlers
function onOutputData()
{
	var msg = nativeProcess.standardOutput.readUTFBytes(nativeProcess.standardOutput.bytesAvailable);
    air.trace("message: ", msg);
	$("#wrapper ul").append("<li style='color:green'>msg: "+ msg+"</li>"); 
}

function onErrorData(event)
{
	var err = nativeProcess.standardError.readUTFBytes(nativeProcess.standardError.bytesAvailable)
    air.trace("ERROR -", err);
	$("#wrapper ul").append("<li style='color:red'>error: "+ err+"</li>"); 
}

function onExit(event)
{
    air.trace("Process exited with ", event.exitCode);
	$("#wrapper ul").append('<input id="exit" type="button" value="Exit" class="button" />');
	
}

function onIOError(event)
{
     air.trace(event.toString());
}
//END bluetooth event handlers


function initCounters(){
	// Initialize Steps counter
    stepsCounter = new flipCounter('stepsflip-counter', {value:0, inc:2, pace:1000, auto:false, precision:5});
    // Initialize Calorie counter
    calorieCounter = new flipCounter('caloriesflip-counter', {value:0, inc:1, pace:1000, auto:false, precision:4});
    // Initialize Distance counter
    distanceCounter = new flipCounter('distanceflip-counter', {value:0, inc:1, pace:1000, auto:false, precision:4});
    // Initialize Time Seconds counter
    timeSecCounter = new flipCounter('timeSecflip-counter', {value:0, inc:1, pace:1000, auto:false, precision:2, maxCount:60});
    // Initialize Time Minute counter
    timeMinCounter = new flipCounter('timeMinflip-counter', {value:0, inc:1, pace:62000, auto:false, precision:2});
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
	
	$("#signin").val(appLang[currLang]["btn_signin"]);
	$("#exit").val(appLang[currLang]["btn_exit"]);
	
	
	//german text is too long
	/*if(lang == "de"){
	    $(".lbl_calories").css("font-size","13px");
	}else{
	    $(".lbl_calories").css("font-size","inherit");
	}*/
	
	//STORE LAST SELECTED LANGUAGE
	try{
	    data = new air.ByteArray();
        data.writeUTFBytes(lang);
        air.EncryptedLocalStore.setItem('appLang', data);
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
	        "lbl_7daytotal": "7-Day Total",
	        "lbl_daily_average": "Daily Average",
	        "lbl_last7days": "Last 7 Days",
	        "lbl_bt_off": "OFF",
	        "lbl_bt_search": "Searching…",
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
				
				data = new air.ByteArray();
				data.writeUTFBytes(username);
				air.EncryptedLocalStore.setItem('username', data);
				
				data = new air.ByteArray();
				data.writeUTFBytes(password);
				air.EncryptedLocalStore.setItem('password', data);
				
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
function enterHandler(event){
	$('body').keypress(function(e){
	    //air.trace(e.which);
		if (e.which == 13) {
		
			if ($('#signin').is(':visible')) {
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
					$('#signin').click();
				}
			}
			
			e.preventDefault();
			return false;
		}
		if (e.which == 49) {
		    if ($('#signin').is(':visible')) {
		        
		    }else{
		        timeSecCounter.setAuto(true).setValue(0);
		        timeMinCounter.setAuto(true).setValue(0);
		    }
		    //e.preventDefault();
			//return false;
		}
		if (e.which == 50) {
		    if ($('#signin').is(':visible')) {
		        
		    }else{
		        stepsCounter.setAuto(true).setValue(0);
		    }
		    //e.preventDefault();
			//return false;
		}
		if (e.which == 112) {
		    if ($('#signin').is(':visible')) {
		        
		    }else{
		        stepsCounter.setAuto(false);
		        timeSecCounter.setAuto(false);
		        timeMinCounter.setAuto(false);
		    }
		}
		if (e.which == 114) {
		    if ($('#signin').is(':visible')) {
		        
		    }else{
		        stepsCounter.setAuto(true);
		        timeSecCounter.setAuto(true);
		        timeMinCounter.setAuto(true);
		    }
		}
		
	});
	
}
function rememberUser(){
	
	var username = air.EncryptedLocalStore.getItem('username');
	var pass = air.EncryptedLocalStore.getItem('password');
	
	if (username != null) {
		document.getElementById('username').value = username.readUTFBytes(username.bytesAvailable);
		document.getElementById('password').value = pass.readUTFBytes(pass.bytesAvailable);
		document.getElementById('remember').checked = true;
	}
	else {
		document.getElementById('username').value = '';
		document.getElementById('password').value = '';
		document.getElementById('remember').checked = false;
	}
}
function doRemember(){
	var username = air.EncryptedLocalStore.getItem('username');
	var pass = air.EncryptedLocalStore.getItem('password');
	
	if (username != null) {
		removeUser();
	}
}
function removeUser(){
	air.EncryptedLocalStore.removeItem('username');
	air.EncryptedLocalStore.removeItem('password');
}
function getDataFrom(url, data, callback){
    
	air.trace(url);
    air.trace(data);
		
	request = new air.URLRequest(url);
	request.method = air.URLRequestMethod.POST;

	request.data = data;
	loader = new air.URLLoader();
	loader.addEventListener(air.Event.COMPLETE, function(event){
		
		
        air.trace("func: ",event.target.data);
        	
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
//UTIL
Array.max = function( array ){
    return Math.max.apply( Math, array );
};
Array.min = function( array ){
    return Math.min.apply( Math, array );
};
