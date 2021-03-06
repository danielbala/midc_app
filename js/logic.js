var LOGIN_URL = 'https://www.interactivehealthpartner.com/idc/login.asp'; 
var CONFIG_URL = 'https://www.interactivehealthpartner.com/idc/ihp_config.xml'; 
var IHPUSER_URL = 'https://www.interactivehealthpartner.com/idc/ihpuser.asp?id='; 
var DESCRIPTOR_FILE = 'https://www.interactivehealthpartner.com/idc/midc_lang.asp';
//var DESCRIPTOR_FILE = 'http://bala.me/bbd/midc_lang.asp'; 
var APPDATA_URL = 'https://www.interactivehealthpartner.com/idc/midc-data.asp?id='; 
var IHPPROCESS_URL = 'https://www.interactivehealthpartner.com/idc/process.asp?id='; 
var UPLOAD_URL = 'https://www.interactivehealthpartner.com/idc/server_upload.php?dest='; 
var FORGOT_PWD_URL = 'https://www.interactivehealthpartner.com/mfc_managepc.asp?task=pin';
var LOG_TO_URL = 'https://www.interactivehealthpartner.com/idc/midc-log.asp?id=';

//COUNTERS PUT IN GLOBAL SCOPE SO WE CAN STOP AND START ELSEWHERE
var stepsCounter = calorieCounter = distanceCounter = distanceTenthsCounter = timeSecCounter = timeMinCounter = {}; 
//current user
var ID_NUMBER = null; 
var APP_VERSION = 0; 
// FOR TESTING
var OFFLINE = false; 
var SYNC_ATTEMPTED = false;

//data object holders 
var appData = {}, appLang = {}, currLang = "en"; //default language,
var workoutData = "empty"; //will be sent to server to be processed
var processDataInterval = 0; //native process
var courier_nativeProcess = new air.NativeProcess(), checkjava_nativeProcess = new air.NativeProcess(), upairWIN_nativeProcess = new air.NativeProcess(); 
//courier communication object
var courierData = {
    "address": "",
    "devicetype": "D",
    "flag": "",
    "uom": 0,
    "steps": 0,
    "calories": 0,
    "speed": {
        "whole": 0,
        "fraction": 0
    },
    "distance": {
        "whole": 0,
        "fraction": 0
    },
    "time": {
        "hour": 0,
        "minute": 0,
        "second": 0
    }
};
var BTCONNECTED = false; 
//operating system
var OS = air.Capabilities.os.substr(0, 3).toLowerCase();
var today_date = getDateTimeStamp();
var workout_row = {
    "patientid": ID_NUMBER,
    "datestamp": today_date,
    "timestamp": "start",
    "equip": courierData.devicetype,
    "hr": courierData.time.hour,
    "cal": courierData.calories,
    "steps": courierData.steps,
    "speed": courierData.speed.whole + "." + courierData.speed.fraction,
    "dist": courierData.distance.whole + "." + courierData.distance.fraction,
    "watt": "",
    "flag": courierData.flag,
    "displayunits": "",
    "extrafield": ""
};
//global events
try {
    //PUT BACK
    window.nativeWindow.addEventListener(air.Event.CLOSING, doSignOut);
} 
catch (e) {
}
function fixteneight(override){
    //delete_from_localStorage('triediobluetoothfix');
    if ((air.Capabilities.os.indexOf("10.8") > 0) || override) {// "Mac OS 10.6.8") {        
        
        var snowfile = air.File.applicationDirectory.resolvePath("lib/_midcfixsnowleopard.sh");
        var triedalready = get_from_localStorage('triediobluetoothfix');
        
        if (triedalready === "yes") {
            //alert("tried this fix already");
            delete_from_localStorage('triediobluetoothfix');
        }
        else {
            add_to_localStorage('triediobluetoothfix', "yes");
            //snowfile.openWithDefaultApplication();
            
            var snowfix_nativeProcess = new air.NativeProcess();
            
            var processArgs = new air.Vector["<String>"]();
            //processArgs.push('-c');            
            var nativeProcessStartupInfo = new air.NativeProcessStartupInfo();
            nativeProcessStartupInfo.executable = snowfile;
                        
            snowfix_nativeProcess.start(nativeProcessStartupInfo);
            snowfix_nativeProcess.addEventListener(air.ProgressEvent.STANDARD_OUTPUT_DATA, function(){
                var msg = snowfix_nativeProcess.standardOutput.readUTFBytes(snowfix_nativeProcess.standardOutput.bytesAvailable);
                //alert("out: "+msg);
            });
            snowfix_nativeProcess.addEventListener(air.NativeProcessExitEvent.EXIT, function(event){
                //alert("Process exited with ", event.exitCode);
            });
            air.NativeApplication.nativeApplication.exit();
            
        }
    }
}
function set_version(){

    var appdesc = air.NativeApplication.nativeApplication.applicationDescriptor;
    parser = new DOMParser();
    xmlDoc = parser.parseFromString(appdesc, "text/xml");
    version = xmlDoc.getElementsByTagName("versionNumber")[0];
    APP_VERSION = version.textContent;
    air.trace(APP_VERSION);
    $(".versiontxt").text(APP_VERSION);
    
}

function doLoad(env){
	fixteneight();
    set_version();	
    
    $("#console").prepend("<br/>VERSION: " + APP_VERSION);
	$("#console").prepend("<br/>OS: " + air.Capabilities.os);
	air.trace(air.Capabilities.os);
    
    //delete_from_localStorage("workoutData");
    
    //remember user init
    if (env == "app") {
        rememberUser();
    }
    
    getAppDescriptor(function(){
		assignEventHandlers(env);
		
        //system language
        try {
			
			if (typeof air.Capabilities.language !== "string") {
				currLang = air.Capabilities.language.join('-');
				
				//alert("typeof Language Code: "+ typeof air.Capabilities.language);
			}
			else {
				currLang = air.Capabilities.language ? air.Capabilities.language : "en";
				//alert("Language Code: "+air.Capabilities.language);
			}
			
			
            //if we do not have a translation for their current language, default to english
            if (typeof appLang[currLang]["msg_treadmill_connect"] === "undefined") {
                currLang = "en";
            }
            
            //if they ever change language it is set in local storage... retrieve it
            var setLang = get_from_localStorage('appLang');
            
			if (setLang) {
                currLang = setLang;
            }
        } 
        catch (e) {
        }
        
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
    $(".alert_message").stop(true, true).animate({
        top: "-86px"
    }, "slow", function(){
        $(".alert_message").css({
            zIndex: "2"
        });
    });
    
    if (typeof callback == "function") {
    
        callback.call();
        
    }
    else if (typeof callback == "number") {
    
        setTimeout(hideMessage, callback);
        
    }
}

function hideMessage(){

    $(".alert_message").css({
        zIndex: "-1"
    }).stop(true, true).animate({
        top: "25px"
    }, "slow", function(){
        $(".alert_message p").html("");
    });
}

function showBTLoading(){

    air.trace("\n show loading");
    $("#console").prepend("<br/> show loading state ");
    //set the text to connecting...
    $(".lbl_bt").text(appLang[currLang]["lbl_bt_search"]);
    
    $("b.on").pulse();
	
}

function showDisconnected(){
    //stopthatnonsense();
    air.trace("\n show disconnected");
    $("#console").prepend("<br/> show disconnected state");
    BTCONNECTED = false;

    clearInterval(processDataInterval);
    
	//sendCourierMessage("stop\n");
    courier_nativeProcess.exit();
    checkjava_nativeProcess.exit();
    
    $("b.on").jqshowDisConnected();
	//set the text to OFF
    $(".lbl_bt").text(appLang[currLang]["lbl_bt_off"]); 
    
}

function showConnected(){

    if ($(".alert_message p").html().indexOf(appLang[currLang]["msg_bt_pc_retry"]) !== -1) {
        hideMessage();
    }
    air.trace("\n show connected");
    $("#console").prepend("<br/> show connected state");

    if (courier_nativeProcess.running && BTCONNECTED) {
        
		$("b.on").jqshowConnected();
		
		//set the text to connected
        $(".lbl_bt").text(appLang[currLang]["lbl_bt_connected"]);
        
    }
    else {
        showDisconnected();
        
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
                    
                    
                    //position, set defaults and sticky
                    positionWidget(env);
                    
                    $('#main').fadeIn('slow');
                    
                    //open the settings menu so you can see the action going on
                    $(".tab_link").click();
                    if ((appData.Steps_Total + appData.Calories_Total + appData.Distance_Total + appData.Time_Total) > 1) {
                        //woot we have data
                        air.trace("we have data");
                    }
                    else {
                        showMessage(appLang[currLang]["msg_no_treadmill_7days"]);
                        $("#console").prepend("<br/> no workout data for the past 7 days");
                    }
                    
                    //START BLUETOOTH LISTENER
                    initCourier();
                    
                });//END hideLoginItems(function(){
            });//END populateData(function(){
        });//END doSignIn(function(){
    });//END $('#signin').click(function(){
    $(document).on("click",'.close_app', function(){
        //alert("close");
        doSignOut();
    });
    $(document).on("click",'#exit', function(){
        justQuit();
    });
    
    $(document).on("click",'.connectAgain', function(){
        hideMessage();
        initCourier();
    });
    $(document).on("click",".doBluetooth", function(){
        if (!courier_nativeProcess.running) {
            showMessage(appLang[currLang]["msg_treadmill_connect"] + " <input class='connectAgain button' type='button' value='" + appLang[currLang]["btn_yes"] + "'/><input class='close_message_bt button' type='button' value='" + appLang[currLang]["btn_no"] + "' />");
        }
        
        
    });
    
    //forgot my password link click
    $(document).on('click','#reminder_link', function(){
        openExternalURL(FORGOT_PWD_URL);
        
    });
    $(document).on("click","#logtoserver", function(e){
		//send to server
		var data = "logdata=" + $("#console").html();
		
		getDataFrom(LOG_TO_URL+ ID_NUMBER, data, function(response){
		
			
			$("#console").html("<br/> log sent to server: " + response);
			
			
		}, false);
		
		e.preventDefault();
	});
    
    $(document).on("click",".pull_tab", function(){
        if ($(".pull_tab").hasClass("close_inner")) {
            $(".inner").hide("fast", function(){
                $(".pull_tab").addClass("close_timer").removeClass("close_inner");
            });
        }
        else if ($(".pull_tab").hasClass("close_timer")) {
            $(".timer").hide("fast", function(){
                $(".pull_tab").removeClass("close_timer").addClass("close_tab open_timer");
            });
        }
        else if ($(".pull_tab").hasClass("open_timer")) {
            $(".timer").show("fast", function(){
                $(".pull_tab").addClass("open_inner").removeClass("open_timer");
            });
        }
        else {
            $(".inner").show("fast", function(){
                $(".pull_tab").addClass("close_inner").removeClass("open_inner close_tab");
            });
        }
        
        return false;
    });
    
    $(".tab_link").click(function(){
        if ($(".drop_tab").hasClass("open_drop_tab")) {
            $(".drop_tab").removeClass("open_drop_tab", "slow");
            $(".tab_link").removeClass("close_tab_link");
            $(".settings_menu").removeClass("settings_menu_on");
        }
        else {
            $(".drop_tab").addClass("open_drop_tab", "slow");
            $(".tab_link").addClass("close_tab_link", "slow");
        }
        return false;
    });
    
    $(document).on("click",".close_message, .close_message_bt", function(){
        hideMessage();
        return false;
    });
    $(".toggle_settings").click(function(){
        $(".settings_menu").toggleClass("settings_menu_on");
    });
    
    $(".chart_menu li").click(function(){
        $(".settings_menu").removeClass("settings_menu_on");
        $(".chart_menu li, .actual_charts li").removeClass("selected");
        var this_class = $(this).attr("class");
        $(this).addClass("selected");
        $(".actual_charts li." + this_class).addClass("selected");
        
        //STORE LAST SELECTED CHART IN LOCAL STORAGE
        try {
            add_to_localStorage('selectedChart', this_class);
        } 
        catch (e) {
        }
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
    $(document).on("click",".translate", function(){
        currLang = $(this).attr("rel");
        translateTo($(this).attr("rel"));
        $(".settings_menu").removeClass("settings_menu_on");
        return false;
    });
    $(document).on("click",".do_sync", function(){
        doSync(false);// quit app = false
        return false;
    });
    $(document).on("click",".doPromptSync", function(){
        doSync(true);//quit app = true
        return false;
    });
    $(document).on("click",".justQuit", function(){
        justQuit();
        return false;
    });
    //login/logout
    $('#remember').click(function(){
        doRemember();
    });
    $(document).on('click','.external_link', function(e){
        e.preventDefault();
        var url = $(this).attr('href');
        openExternalURL(url);
        
    });
    
    keypressHandler();
    
}


function keypressHandler(event){
    $('body').keypress(function(e){
        //alert(e.which);
        //ENTER key
        //enter should submit
        if (e.which == 13) {
            $('#signin').click();
            
        }
		
		var key = String.fromCharCode(e.which);
		var alt = e.altKey;
		var ctrl = e.ctrlKey
		var shift = e.shiftKey;
		//air.trace("Key:" + key + "\nAlt:" + alt + "\nCtrl:" + ctrl + "\nShift:" + shift);
		
		if(e.shiftKey && e.ctrlKey){
        /*if (e.which == 67) { //shift+c*/
            air.trace("toggle console");
            
            $("#console").toggle();
			$("#console").find("#logtoserver").remove();
			$("#console").prepend("</br><button id='logtoserver'>Send to Server</button></br>");
			
			
			e.preventDefault();
			return false;
            
        }
		if((e.shiftKey && e.altKey) || e.which == 76){
        /*if (e.which == 76) { //shirt+l*/
            
			if(!$("input").is(":focus")){
				
				air.trace("manually delete known address from local storage");
            
	            resetLocalStorage();
	            
			}
			
			
        
        }
        
    });
    
}
function resetLocalStorage(){
	
	delete_from_localStorage('known_address');
    delete_from_localStorage('javaPath');
    delete_from_localStorage("workoutData");
}
function hideLoginItems(callback){
    $("#wrapper").css("background-image", "none").css("background-color", "transparent");
    
    $("#login_items div").fadeOut(500, function(){
        $("#login_items").fadeOut(300, function(){
        
        });
    });
    setTimeout(function(){
        callback();
    }, 800);
    
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
        if (this_height > tallestXvalue) {
            css_height = maxBarHeight;
        }
        var topshouldbe = maxBarHeight - css_height;
        
        //console.log(maxBarHeight, this_height, css_height, css_ratio, tallestXvalue );
        if (this_height > 0) {
            $(this).css({
                height: Math.ceil(css_height) + "px",
                top: Math.floor(topshouldbe) + "px",
                visibility: "visible"
            });
            
        }
        else {
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
        var num = parseInt($(this).html().replace(",", ""));
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
            
            $(".chart_menu li." + currChart).addClass("selected");
            $(".actual_charts li." + currChart).addClass("selected");
            $(".settings_menu").removeClass("settings_menu_on");
            
        }
        
    }
}


function checkJAVA(callback){

    $("#console").prepend("<br/>CHECK JAVA: OS: " + OS);
    
    //check local storage first
    var path_to_java = get_from_localStorage('javaPath');
    if (path_to_java) {
        callback(path_to_java);
        return true;
    }
    
    if (OS === "mac") {
        path_to_java = "/usr/bin/java";
        
        callback(path_to_java);
    }
    else {
        //c:\> for %i in (java.exe) do @echo.   %~$PATH:i
        //path_to_java = "c:\\windows\\system32\\java.exe";
        
        if (air.NativeProcess.isSupported) {
        
            var java_file32 = new air.File("c:\\windows\\system32\\java.exe");
            var java_file64 = new air.File("c:\\windows\\SysWOW64\\java.exe");
            
            if (java_file32.exists) {
                callback("c:\\windows\\system32\\java.exe");
                return false;
            }
            if (java_file64.exists) {
                callback("c:\\windows\\SysWOW64\\java.exe");
                return false;
            }
            
            $("#console").prepend("<br/>checkJAVA");
            //showMessage("<small>Looking for Java...</small>");
            
            var processArgs = new air.Vector["<String>"]();
            
            var nativeProcessStartupInfo = new air.NativeProcessStartupInfo();
            nativeProcessStartupInfo.executable = air.File.applicationDirectory.resolvePath("_whereis.exe");
            
            processArgs.push('-r');
            processArgs.push('c:\\Windows\\SysWOW64;c:\\Windows\\System32'); // searches in the Windows paths (the directories specified in the PATH environment variable)
            processArgs.push('-s'); // succinct output. Prints path only
            processArgs.push("java.exe");
            
            nativeProcessStartupInfo.arguments = processArgs;
            //$("#console").prepend("<br/>check java args: " + processArgs);
            
            
            checkjava_nativeProcess.start(nativeProcessStartupInfo);
            
            checkjava_nativeProcess.addEventListener(air.ProgressEvent.STANDARD_OUTPUT_DATA, function(){
            
                if (!courier_nativeProcess.running) {
                
                    var msg = checkjava_nativeProcess.standardOutput.readUTFBytes(checkjava_nativeProcess.standardOutput.bytesAvailable);
                    air.trace("check java output : ", msg);
                    
                    $("#console").prepend("<br/>checkJAVA file output : " + msg);
                    
                    var replacedmsg = msg.split("\n")[0].replace(/\\/g, "\\\\");
                    
                    $("#console").prepend("<br/>checkJAVA path clean : " + replacedmsg);
                    
                    if (replacedmsg.indexOf("java") !== -1) {
                    
                        //callback to initCourier
                        callback(replacedmsg);
                    }
                    
                }
                
            });
            checkjava_nativeProcess.addEventListener(air.ProgressEvent.STANDARD_ERROR_DATA, function(){
                var err = checkjava_nativeProcess.standardError.readUTFBytes(checkjava_nativeProcess.standardError.bytesAvailable);
                
                $("#console").prepend("<br/>checkJAVA file ERROR : " + err);
                
            });
            
            checkjava_nativeProcess.addEventListener(air.NativeProcessExitEvent.EXIT, function(){
                $("#console").prepend("<br/>checkJAVA air.NativeProcessExitEvent.EXIT");
                
                if (!courier_nativeProcess.running) {
                    $("#console").prepend("<br/>courier not running");
                    callback("notfound");
                }
                
            });
            
            checkjava_nativeProcess.addEventListener(air.IOErrorEvent.STANDARD_OUTPUT_IO_ERROR, function(){
                $("#console").prepend("<br/>checkJAVA air.IOErrorEvent.STANDARD_OUTPUT_IO_ERROR");
                
            });
            
            checkjava_nativeProcess.addEventListener(air.IOErrorEvent.STANDARD_ERROR_IO_ERROR, function(){
                $("#console").prepend("<br/>checkJAVA air.IOErrorEvent.STANDARD_ERROR_IO_ERROR");
                
            });
            
        }
    }
    
}
function initCourier(){

    showBTLoading();	
	
    
    air.trace("\n initCourier \n");
    $("#console").prepend("<br/><br/> --initCourier-- <br/>");
    
   
    var _path_to_java = "";
    
    checkJAVA(function(_path_to_java){
    
        checkjava_nativeProcess.exit();
        $("#console").prepend("<br/>javapath found: " + _path_to_java);
        air.trace("javapath found: ", _path_to_java);
        
        if (_path_to_java.indexOf("java") === -1) {
        
            $("#console").prepend("<br/> java file DOES NOT EXIST, install JRE ");
            install_JRE();
            return false;
            
        }
        
        
        //STORE IT SO WE DON'T HAVE TO DO THIS AGAIN
        try {
            add_to_localStorage('javaPath', _path_to_java);
        } 
        catch (e) {
        }
        
        
        if (!courier_nativeProcess.running) {
        
            var java_file = new air.File(_path_to_java); //PATH TO JAVA
            //air.trace("java path", java_file.nativePath);
            $("#console").prepend("<br/> java path: " + java_file.nativePath);
            
            if (air.NativeProcess.isSupported) {
                //showMessage("<small>Found Java, Attempting to Connect to Treadmill Desk...</small>");
                //air.trace("native process supported");
                
                $("#console").prepend("<br/> attempt to run courier.jar");
                
				//Courier2.1.2.jar
                var np_file = air.File.applicationDirectory.resolvePath("CourierService.jar");
				//var np_file = air.File.applicationDirectory.resolvePath("Courier2.1.2.jar");
                
                var _address = get_from_localStorage("known_address");
                if (_address == null || (_address.indexOf(":") == -1) ) { // check ":" for address missing channel.
                    _address = "empty";
                }
                
                var user_weight = appData.Weight ? appData.Weight : "empty";
                var device_names = appData.Device_Names ? appData.Device_Names : "empty";
				var user_uom = appData.Displayunits ? appData.Displayunits : "1"; //UNIT OF MEASURE
				
				if (user_uom === "English" || user_uom === "Imperial") {
					user_uom = "1";
				}
				else {
				    user_uom = "0";
				}
                
                var processArgs = new air.Vector["<String>"]();
                processArgs.push("-jar");
				
				
                //processArgs.push("-d32"); //FORCE 32bit mode
                processArgs.push(np_file.nativePath);
                
                processArgs.push(_address.fulltrim()); //known address from local storage
                processArgs.push(user_weight); //known user weight
                processArgs.push(device_names); //"ENDEX,LifeSpan,IHP" NO SPACES IN FILE NAME
                processArgs.push(user_uom); //0=metric or 1=standard/English/imperial
				
                try {
                    var nativeProcessStartupInfo = new air.NativeProcessStartupInfo();
                    nativeProcessStartupInfo.executable = java_file;
                    nativeProcessStartupInfo.arguments = processArgs;
                    
                    air.trace("args: ", processArgs);
                    
                    $("#console").prepend("<br/> args: " + processArgs);
                    
                    courier_nativeProcess.start(nativeProcessStartupInfo);
                    courier_nativeProcess.addEventListener(air.ProgressEvent.STANDARD_OUTPUT_DATA, onOutputData);
                    courier_nativeProcess.addEventListener(air.ProgressEvent.STANDARD_ERROR_DATA, onErrorData);
                    courier_nativeProcess.addEventListener(air.NativeProcessExitEvent.EXIT, onExit);
                    courier_nativeProcess.addEventListener(air.IOErrorEvent.STANDARD_OUTPUT_IO_ERROR, onIOError);
                    courier_nativeProcess.addEventListener(air.IOErrorEvent.STANDARD_ERROR_IO_ERROR, onIOError);
                    
					//if (OS == "win") {
						doHealthCheck();
					//}
					
                } 
                catch (e) {
                    
                    //#3214 - could not execute java
                    //#3213 - no bluetooth
                    msg = e.message;
                    if (msg.indexOf("3213") !== -1) {
                        $("#console").prepend("<br/>BT : " + msg + " ask them to turn on BT on PC?");
                        //ask them to turn on BT on PC
                    
                        //showMessage(appLang[currLang]["msg_bt_pc_retry"] + " <input class='connectAgain button' type='button' value='" + appLang[currLang]["btn_yes"] + "'/><input class='close_message_bt button' type='button' value='" + appLang[currLang]["btn_no"] + "' />");
                        //$(".lbl_bt").text(appLang[currLang]["lbl_bt_off"]);
                        //showDisconnected();
                    
                    }
                    else if (msg.indexOf("3214") !== -1) {
						
                        $("#console").prepend("<br/>could not execute java: " + e.message);
                        
						   var triedReset = get_from_localStorage('triedReset');
						    
							if (triedReset) {
								if ((OS == "win")) {
									$("#console").prepend("<br/>could not execute java (maybe old version or uninstalled, either way, prompt install): " + e.message);
									install_JRE();
								}
							}
							else {
								resetAppRetryCourier();
							
							}
						
                    }
                    else {
                    
                        air.trace("try np start:", e.message);
                        $("#console").prepend("<br/>UGLY CATCH try np start: " + e.message);
                        //showMessage("<small>ERROR: Please copy and send me your console Shift+c </small>");
                        showDisconnected();
                    }
                }
                
                //sendCourierMessage("searchDevices\n");
            
            }
            else {
                showDisconnected();
                showMessage(appLang[currLang]["msg_no_bluetooth_support"]);
            }
        }
        else {
            //if courier is already running, kill checkjava process
            checkjava_nativeProcess.exit(true);
        }
    });
    //END checkJAVA();

}

function resetAppRetryCourier(){
    $("#console").prepend("<br/>RESET APP AND RETRY COURIER!!!");
	
	//sendCourierMessage("stop\n");
	courier_nativeProcess.exit(true);
	
	clearTimeout(COURIER_HEALTH_CHECK_TIMEOUT);
	
	resetLocalStorage();
	
	if (OS == "win") {
        unpairWIN("IHP"); //TODO get actual device name from courier
		//unpairWIN("ENDEX");
		//unpairWIN("LifeSpan");
		add_to_localStorage('javaPath', "c:\\windows\\system32\\java.exe");
		    
    }
	add_to_localStorage('triedReset', "true");
	
	initCourier();
	
	
	
}
function unpairWIN(devicename){
	$("#console").prepend("<br/>BLUETOOTH UNPAIR: " + devicename);
	// http://bluetoothinstaller.com/bluetooth-command-line-tools/
	var processArgs = new air.Vector["<String>"]();
	
	var nativeProcessStartupInfo = new air.NativeProcessStartupInfo();
	nativeProcessStartupInfo.executable = air.File.applicationDirectory.resolvePath("_btpair.exe");
	
	processArgs.push('-u');
	processArgs.push('-n'+devicename); // device name
	
	nativeProcessStartupInfo.arguments = processArgs;
	
	
	
	upairWIN_nativeProcess.start(nativeProcessStartupInfo);
	
}

//@param string message
function sendCourierMessage(message){

    if (courier_nativeProcess.running) {
    
        air.trace("process running send message: " + message);
        courier_nativeProcess.standardInput.writeMultiByte(message, "utf-8");
        
    }
    else {
        air.trace("process not running:" + message);
    }
}


//bluetooth event handlers
var COURIER_HEALTH_CHECK_TIMEOUT = 0;
function doHealthCheck(){
    
	
    //air.trace("courier message: ", msg);
    if (COURIER_HEALTH_CHECK_TIMEOUT == 0) {
        
        //From the moment courier receives its first message, 
        //we want to check its status at 30 seconds, to prevent a limbo state
        COURIER_HEALTH_CHECK_TIMEOUT = setTimeout(function(){
            $("#console").prepend("<br/> 30 SECOND HEALTH CHECK");
			air.trace("dohealthcheck");
            
            if (BTCONNECTED) {
                //ALL IS GOOD
                air.trace("healthcheck: courier is CONNECTED");
                $("#console").prepend("<br/>healthcheck: courier is CONNECTED");
            }
            else {
                
                if (courier_nativeProcess.running) {
                    //WAIT: COURIER IS NOT CONNECTED BUT IT IS RUNNING... WE MUST BE IN LIMBO
                    
                    air.trace("\nhealthcheck: courier NOT CONNECTED but runnning terminate IT \n");
                    $("#console").prepend("<br/>healthcheck: courier NOT CONNECTED but runnning terminate IT ");
                    
					//sendCourierMessage("stop\n");
					courier_nativeProcess.exit(true);
                    
                    //KILL IT AND RESET/RETRY
                    resetAppRetryCourier();
                    
                }
                else {
					
                    air.trace("\nhealthcheck: courier NOT CONNECTED and NOT RUNNING \n");
                    $("#console").prepend("<br/>healthcheck: courier NOT CONNECTED and NOT RUNNING  ");
                    showDisconnected();
                }
             
            
            
            }
            
        }, 30000);
    }

}
var previoustimestamp = "";
var listenTimeout = 0;
var sametimecount = 0;
function onOutputData(){
    var msg = courier_nativeProcess.standardOutput.readUTFBytes(courier_nativeProcess.standardOutput.bytesAvailable);
	
    if (msg.indexOf("CONNECTED") !== -1) {
        BTCONNECTED = true;
        showConnected();
        air.trace("GOT CONNECT FROM COURIER ", msg);
        $("#console").prepend("<br/> GOT CONNECT FROM COURIER: " + msg);
        
        //WRITE ADDRESS TO LOCAL STORAGE
        var device_address = msg.split("|")[1];
        add_to_localStorage('known_address', device_address);
        
        
        //START PROCESS_COURIERDATA 20 SEC TIMER
        initWorkoutData();
        
		processDataInterval = setInterval(processCourierData, 20000);
		
		clearTimeout(COURIER_HEALTH_CHECK_TIMEOUT);
        
        
    }
    else if (msg.indexOf("BTOFF") !== -1) {
    
        BTCONNECTED = false;
        
        //ask them to turn on BT on PC
        
        showMessage(appLang[currLang]["msg_bt_pc_retry"] + " <input class='connectAgain button' type='button' value='" + appLang[currLang]["btn_yes"] + "'/><input class='close_message_bt button' type='button' value='" + appLang[currLang]["btn_no"] + "' />");
        
		$(".lbl_bt").text(appLang[currLang]["lbl_bt_off"]);
		
        showDisconnected();
        
    }
    else if (msg.indexOf("NOTFOUND") !== -1) {
    
        BTCONNECTED = false;
        
        delete_from_localStorage('known_address');
        
        showMessage(appLang[currLang]["msg_bt_equip_retry"] + " <br/><input class='connectAgain button' type='button' value='" + appLang[currLang]["btn_yes"] + "'/><input class='close_message_bt button' type='button' value='" + appLang[currLang]["btn_no"] + "' />");
        
        $(".lbl_bt").text(appLang[currLang]["lbl_bt_off"]);
        showDisconnected();
    }
    else if (msg.indexOf("devicetype") !== -1) {
    
        BTCONNECTED = true;
        
        air.trace("dtF courier msg: ", msg);
        //$("#console").prepend("<br/> dtF courier msg: " + msg);
        try {
		
			courierData = JSON.parse(msg);
		} 
		catch (e) {
			air.trace("catch parse error:", e.message);
			$("#console").prepend("<br/> catch parse error: " + e.message);
		}
			
			
			//if (OS == "win") {
			clearTimeout(listenTimeout);
			//if I receive no messages in 5 seconds, assume I am dead
			listenTimeout = setTimeout(function(){
				stopWorkout(0, appLang[currLang]["msg_bluetooth_signal_disconnected"] + " <br/><input class='connectAgain button' type='button' value='" + appLang[currLang]["btn_yes"] + "'/><input class='close_message_bt button' type='button' value='" + appLang[currLang]["btn_no"] + "' />");
			}, 5000);
			//}
			
            if (courierData.flag == "S") {
                stopWorkout();
                
            }
            //update timer
            initCounters();
            
        
        
    }
    else {
		if (msg.length > 3) {
			air.trace("courier message: ", msg);
			$("#console").prepend("<br/>else courier message: " + msg);
		}
    }
    
	
	
	
    //$("#wrapper ul").append("<li style='color:green'>msg: "+ msg+"</li>"); 
}

var ILLEGAL_ADDRESS_ERROR = false;

function onErrorData(event){
	
    var err = courier_nativeProcess.standardError.readUTFBytes(courier_nativeProcess.standardError.bytesAvailable);
    
    air.trace("ERROR EVT-", err);
    $("#console").prepend("<br/> ERROR EVT: " + err);
    
    //$(".lbl_bt").text(appLang[currLang]["lbl_bt_off"]);
    
    if (err.indexOf("bluetooth support") !== -1) {
        //ask them to turn on BT on PC
        
        showMessage(appLang[currLang]["msg_bt_pc_retry"] + " <input class='connectAgain button' type='button' value='" + appLang[currLang]["btn_yes"] + "'/><input class='close_message_bt button' type='button' value='" + appLang[currLang]["btn_no"] + "' />");
        
        
    }
    else if ((err.indexOf("Unable to locate a Java Runtime to invoke.") !== -1) && OS == "mac") {
    
        showMessage("<small>"+appLang[currLang]["msg_turn_java_on"]+"</small>");
        
    }
    else if ((err.indexOf("Unable to locate a Java Runtime to invoke.") !== -1) && OS == "mac") {
        ILLEGAL_ADDRESS_ERROR = true;
        $("#console").prepend("<br/> BAD ADDRESS, CLEAR IT OUT: " + err);
        delete_from_localStorage('known_address');
        
    }
    else {
        $("#console").prepend("<br/>UNCAUGHT ERROR EVENT: " + err);
        //showMessage("<small>ERROR: Please copy and send me your console Shift+c </small>");
		if (err.indexOf("dyld: lazy symbol binding failed: Symbol not found: _IOBluetoothLocalDeviceReadSupportedFeatures") !== -1) {
			fixteneight(true);
		  	
		}

    
    
    }
    
    //$("#wrapper ul").append("<li style='color:red'>error: "+ err+"</li>"); 
}

function onExit(event){
	
    air.trace("Process exited with ", event.exitCode);
	air.trace("courier is DEAD");
	processCourierData();
	
	
    $("#console").prepend("<br/> courier exited with code: " + event.exitCode);
	$("#console").prepend("<br/> courier is DEAD");
    BTCONNECTED = false;
    
	showDisconnected();
	clearTimeout(COURIER_HEALTH_CHECK_TIMEOUT);
	
    if (ILLEGAL_ADDRESS_ERROR) {
        //lets try it again
		delete_from_localStorage('known_address');
		$("#console").prepend("<br/> ILLEGAL_ADDRESS_ERROR");
		air.trace("ILLEGAL_ADDRESS_ERROR");
		
        initCourier();
    }
	
    
    //$("#wrapper ul").append('<input id="exit" type="button" value="Exit" class="button" />');
}

function onIOError(event){
	
    air.trace(event.toString());
    $("#console").prepend("<br/> IOERROR: " + event.toString());
}

//END bluetooth event handlers

function initWorkoutData(){
    BTCONNECTED = true;
    showConnected();
    //get from localStorage if it exists
    workoutData = get_from_localStorage("workoutData");
    air.trace("initWorkoutData", workoutData);
    $("#console").prepend("<br/> init Workout Data: " + workoutData);
    
    if (workoutData !== null) {
        workoutData = JSON.parse(workoutData);
    }
    else {
        workoutData = [];
    }
    
    
}
var previous_pause = false;

function processCourierData(){//this method is called every 20 seconds
    
	if (workoutData == "empty") {
		air.trace("ZERO BAIL");
	   return false;
	}
	
	var courierTimeStamp = courierData.time.hour + ":" + courierData.time.minute + ":" + courierData.time.second;
    
	var distance_whole_fraction = courierData.distance.whole + (courierData.distance.fraction / 100);
    
	var temp_workout_row = {
        "patientid": ID_NUMBER,
        "datestamp": today_date,
        "timestamp": courierData.time.hour + ":" + courierData.time.minute + ":" + courierData.time.second,
        "equip": "D", //courierData.devicetype
        "hr": courierData.time.hour,
        "cal": courierData.calories,
        "steps": courierData.steps,
        "speed": courierData.speed.whole + "." + courierData.speed.fraction,
        "dist": distance_whole_fraction.toFixed(2) + "", //courierData.distance.whole + "." + distance_fraction,
        "watt": "",
        "flag": courierData.flag,
        "displayunits": courierData.uom ? "E" : "M", //machine reports 0=metric or 1=imperial,
        "extrafield": ""
    };
	
	$("#console").prepend("<br/> processCourierData: workout_row: " + JSON.stringify(temp_workout_row));
            
	if (courierData.flag == "P" && previous_pause == false) {
	   //write the first pause and do not write subsequent pause data
	   //add to storage
       workoutData.push(temp_workout_row);
       delete_from_localStorage("workoutData");
       add_to_localStorage("workoutData", JSON.stringify(workoutData));
	   previous_pause = true;
	   
	}
    
	if (courierData.flag == "S") {
        
		stopWorkout(temp_workout_row);
        return false;
		
    }
    else {
        //workout_row.flag = courierData.flag;
        if (courierData.flag !== "P" && courierData.steps !== -1) {
			//showConnected();
			
            previous_pause = false;
            
            workoutData.push(temp_workout_row);
            
            air.trace("\n processCourierData: workout_row:", JSON.stringify(temp_workout_row));
            
            
            delete_from_localStorage("workoutData");
            add_to_localStorage("workoutData", JSON.stringify(workoutData));
        }
        
    }
	
	showConnected();
    
}
function stopWorkout(temp_workout_row, custom_message){
	
	
    //show custom Message
    if (typeof custom_message !== "undefined") {
		showMessage(custom_message);
	}
	else {
	   showMessage(appLang[currLang]["msg_workout_ended"]);
	}
	
	clearInterval(processDataInterval);
    
	//add to storage
    if ((typeof temp_workout_row !== "undefined") || (temp_workout_row !== 0)) {
		workoutData.push(temp_workout_row);
	}
    
	delete_from_localStorage("workoutData");
    add_to_localStorage("workoutData", JSON.stringify(workoutData));
    showDisconnected();
	
}
function initCounters(){
    if (courierData.flag == "") {
        // Initialize Steps counter
        stepsCounter = new flipCounter('stepsflip-counter', {
            value: courierData.steps,
            inc: 2,
            pace: 1000,
            auto: false,
            precision: 5
        });
        // Initialize Calorie counter
        calorieCounter = new flipCounter('caloriesflip-counter', {
            value: courierData.calories,
            inc: 1,
            pace: 1000,
            auto: false,
            precision: 4
        });
        // Initialize Distance counter
        distanceCounter = new flipCounter('distanceflip-counter', {
            value: courierData.distance.whole,
            inc: 1,
            pace: 1000,
            auto: false,
            precision: 2
        });
        // Initialize Distance tenths counter
        distanceTenthsCounter = new flipCounter('distanceTenthsflip-counter', {
            value: courierData.distance.fraction,
            inc: 1,
            pace: 1000,
            auto: false,
            precision: 2
        });
		if (courierData.time.hour >= 1) {
			// Initialize Time Seconds counter
			timeSecCounter = new flipCounter('timeSecflip-counter', {
				value: courierData.time.minute,
				inc: 1,
				pace: 1000,
				auto: false,
				precision: 2,
				maxCount: 60
			});
			// Initialize Time Minute counter
			timeMinCounter = new flipCounter('timeMinflip-counter', {
				value: courierData.time.hour,
				inc: 0,
				pace: 0,
				auto: false,
				precision: 2
			});
			
		}
		else {
			// Initialize Time Seconds counter
			timeSecCounter = new flipCounter('timeSecflip-counter', {
				value: courierData.time.second,
				//inc: 1,
				inc: 0,
				pace: 1000,
				auto: false,
				precision: 2,
				maxCount: 60
			});
			// Initialize Time Minute counter
			timeMinCounter = new flipCounter('timeMinflip-counter', {
				value: courierData.time.minute,
				//inc: 1,
				inc: 0,
				//pace: 62000,
				pace: 0,
				auto: false,
				precision: 2
			});
			
		}
        
    }
}

function resetCourierData(){
    courierData = {
        "address": "000000000000",
        "devicetype": "D",
        "flag": "",
        "uom": 0,
        "steps": 0,
        "calories": 0,
        "speed": {
            "whole": 0,
            "fraction": 0
        },
        "distance": {
            "whole": 0,
            "fraction": 0
        },
        "time": {
            "hour": 0,
            "minute": 0,
            "second": 0
        }
    };
    initCounters();
}

function populateData(callback){

    //air.trace("in popdata", appData);
    
    getDataFrom(APPDATA_URL + ID_NUMBER, "", function(response){
    
        air.trace("popdataback ", response);
        $("#console").prepend("<br/> data from server: " + response);
        
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
        if (typeof appLang[lang][this_class] !== "undefined") {
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
    //showDisconnected();
    showConnected();
    
    //STORE LAST SELECTED LANGUAGE
    try {
        add_to_localStorage('appLang', lang);
    } 
    catch (e) {
    }
    
    
}

function getAppDescriptor(callback){

    getDataFrom(DESCRIPTOR_FILE, "", function(response){
        //air.trace(response);
        if(response == "servererror"){
			alert(appLang[currLang]["msg_cant_contact_server"]);
			air.NativeApplication.nativeApplication.exit(); 
		}
		appDesc = JSON.parse(response);
		
		
		
		/*
		 "appVersion": {
	        "app_new_version": "0.1.9",
	        "mac": "http: //bala.me/bbd/midc_app/updates/MIDC.1.9.dmg",
	        "win": "http: //bala.me/bbd/midc_app/updates/MIDC.1.9.dmg"
	     },
	    "lang": {
	        "en": {
	            "language": "English",
	            "lbl_lastname": "Last Name",
	            "lbl_password": "Password",
	            "lbl_remember": "Remember Me",
	            "lbl_invalid_password": "Invalid Username and Password!<br/>Please Try Again or Click <a id='reminder_link' href='#'>here</a> for a reminder.",
	            ...
	         },
	         "de": {
	            "language": "German",
	            "lbl_lastname": "Nachname",
	            "lbl_password": "Passwort",
	            "lbl_remember": "Remember Me",
	            "lbl_invalid_password": "Ung&uuml;ltiger Benutzername und Passwort!<br/>Bitte versuchen Sie es oder Klicken Sie <a id='reminder_link' href='#'>hier</a> f&uuml;r eine Erinnerung.",
	            ...
	          }
	     }
	         
		 */
		
		appLang = appDesc.lang;
        //ADD AVAILABLE LANGUAGES TO SETTINGS DROPDOWN MENU
        for (prop in appLang) {
            if (appLang[prop]['language']) {
                $(".langs").append('<a class="translate" rel="' + prop.toString() + '" href="#' + prop.toString() + '">' + appLang[prop]['language'] + '</a>');
                air.trace('<a class="translate" rel="' + prop.toString() + '" href="#' + prop.toString() + '">' + appLang[prop]['language'] + '</a>');
            }
        }
		//CHECK IF VERSIONS MATCH
		newAppVersion = appDesc.appVersion.app_new_version;
        
        $("#console").prepend("<br/> SERVER APP VERSION: " + newAppVersion);
        air.trace(APP_VERSION, newAppVersion, (APP_VERSION === newAppVersion));
		
		if (APP_VERSION !== newAppVersion) {
			$("#console").prepend("<br/> APP VERSIONS OUT OF SYNC, PROMPT TO UPDATE: " + newAppVersion);
			
			$("#login_items").hide();
			$("#wrapper").fadeIn("slow", function(){
				var msg_new_version_available = appLang[currLang]["msg_new_version_available"].replace("12345", newAppVersion);
				
				$("#update_prompt").prepend("<p style='padding:10px;'>"+msg_new_version_available+"</p>").fadeIn("fast");
				
				$("#update_no").click(function(){
					
					$("#update_prompt").hide();
					$("#login_items").fadeIn("fast");
                    callback.call();
				});
				$("#update_yes").click(function(){
					do_update(appDesc.appVersion[OS]);
					
					$("#update_prompt").html('<img src="icons/loading.gif" alt="loading" width="43" height="11" />');
				});
				
			});
			
			
		}
		else {
		
			callback.call();
		}
    });
}
function do_update(downloadurl){
	
    air.trace("starting app update:", downloadurl);
	
	$("#console").prepend("<br/> Starting APP UPDATE.. ");
	
	air.navigateToURL( new air.URLRequest(downloadurl) );
    
	setTimeout(function(){air.NativeApplication.nativeApplication.exit();},3000);
	  
}


function doSignIn(callback){

    var data = null;
    var username = null;
    var password = null;
    var success_login = false;
    var return_data = null;
    
    username = document.getElementById('username').value;
    password = document.getElementById('password').value;
    
    data = "lname=" + escape(username) + "&password=" + escape(password);//we should encypt this... httpsFTW
    getDataFrom(LOGIN_URL, data, function(response){
    
        //air.trace("back", response);
        return_data = response.split("|");
        ID_NUMBER = return_data[1];
        //air.trace("#" + ID_NUMBER);
        
        //air.trace(return_data[0]);
        
        if (return_data[0] == "success") {
        
            if (document.getElementById('remember').checked) {
            
                add_to_localStorage('username', username);
                add_to_localStorage('password', password);
                
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
            if (response == "servererror") {
            
            
                $("#progress").hide();
                $(".intro").hide();
                $('#invalid_login').html(appLang[currLang]["msg_cant_contact_server"]).fadeIn('fast');
                
            }//END 
        }
    });
    
    return false;
    
}

function doSignOut(){
    if (courier_nativeProcess.running) {
		//sendCourierMessage("stop\n");
        courier_nativeProcess.exit();
    }
    rememberUser();
    var calledp = false;
    $(".inner").show("slow", function(){
        $(".pull_tab").addClass("close_inner").removeClass("close_timer open_inner close_tab");
    });
    
    if (!SYNC_ATTEMPTED) {
        try {
			showMessage(appLang[currLang]["msg_sync_before_quit"] + " <input class='doPromptSync button' type='button' value='" + appLang[currLang]["btn_confirm_sync"] + "'/><input class='justQuit button' type='button' value='" + appLang[currLang]["btn_just_quit"] + "' />");
		}catch(e){}
    }
    else {
        justQuit();
    }
    
}

function doSync(quit_app){
    if (courier_nativeProcess.running) {
        showMessage(appLang[currLang]["msg_workout_inprogress"]);
        return false;
    }
    if (SYNC_ATTEMPTED) {
        if (quit_app) {
            justQuit();
        }
        //do nothing
        return false;
    }
    showMessage(appLang[currLang]["msg_uploading"], function(){
    
        setTimeout(function(){
        
            var data = "workoutdata=" + get_from_localStorage("workoutData");
            
            getDataFrom(IHPPROCESS_URL + ID_NUMBER, data, function(response){
                
                air.trace("response from process: ", response);
                $("#console").prepend("<br/> sync response from server: " + response);
                
                delete_from_localStorage("workoutData");
                resetCourierData();
                
                SYNC_ATTEMPTED = true;
                hideMessage();
                //SYNC SUCCESSFULL?
                
                if (quit_app) {
                    justQuit();
                }
                
            });
            
            
            
        }, 1000);
        
    });
}

function justQuit(){

    showMessage(appLang[currLang]["msg_session_ending"], function(){
        setTimeout(function(){
            hideMessage();
            $('#main, #login_items').fadeOut('slow', function(){
            
                try {
                    air.NativeApplication.nativeApplication.exit();
                } 
                catch (e) {
                }
            });
            
            
        }, 2000);
        
        
        
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

function getDataFrom(url, data, callback, logit){
    air.trace("getdatafromurl: " + url, " -data: " + data);
    
	if (typeof logit === "undefined") {
		$("#console").prepend("<br/> make server call: " + url + " -data: " + data);
	}
	//air.trace(url);
    //air.trace(data);
    
    request = new air.URLRequest(url);
    request.method = air.URLRequestMethod.POST;
    
    request.data = data;
    loader = new air.URLLoader();
    loader.addEventListener(air.Event.COMPLETE, function(event){
        air.trace("loader.addEventListener: ", event.target.data);
        
        //MOVE ON
        callback(event.target.data);
        return false;
        
        
    });
    // loader callback function	
    loader.addEventListener(air.IOErrorEvent.IO_ERROR, function(event){
        air.trace("loader.addEventListener: ", event.text);
        $("#console").prepend("<br/> server call ERROR: " + event.text);
        
        //TODO: Call help. Do nothing
        callback("servererror");
        return false;
        
        
    });
    
    try {
        loader.load(request);
    } 
    catch (error) {
		var connecterrormsg = appLang[currLang]["msg_cant_contact_server"] ? appLang[currLang]["msg_cant_contact_server"] : "Unable to contact Server!";
        alert(connecterrormsg);
        air.trace("sync process error: ", error.message);
        $("#console").prepend("<br/> sync error: " + error.message);
        callback(error.message);
    }
    
    return false;
    
}


//ADD TO LOCAL STORAGE
//@param keyname
//@param string value
function add_to_localStorage(keyname, value){
    air.trace("add_to_localStorage: " + keyname + "=" + value);
    $("#console").prepend("<br/> add_to_localStorage: " + keyname + "=" + value);
    
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
    air.trace("get_from_localStorage: " + keyname + "=" + return_val);
    $("#console").prepend("<br/> get_from_localStorage: " + keyname + "=" + return_val);
    
    return return_val;
}

//UTIL
function install_JRE(){
    showMessage("<small>"+appLang[currLang]["msg_java_not_found"]+"</small>");
    showDisconnected();
    
    var jre_file = new air.File();
    jre_file = air.File.applicationDirectory.resolvePath("_jre-6u34-windows-i586-iftw.exe");
    jre_file.openWithDefaultApplication();
    
}

//delete from local storage
//@param key name
function delete_from_localStorage(keyname){
    air.trace("delete_from_localStorage: " + keyname);
    $("#console").prepend("<br/> delete_from_localStorage: " + keyname);
    air.EncryptedLocalStore.removeItem(keyname);
}

function openExternalURL(href){
    if (confirm(appLang[currLang]["msg_external_url"]+ ":" + href)) {
        var urlReq = new air.URLRequest(href);
        air.navigateToURL(urlReq);
    }
}

function getDateTimeStamp(){
    //24:06:15
    var date = new Date();
    return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();   
}

Array.max = function(array){
    return Math.max.apply(Math, array);
};
Array.min = function(array){
    return Math.min.apply(Math, array);
};
String.prototype.fulltrim = function(){
    return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' ');
}
$.extend($.fn.pulse = function() {
    var minOpacity = .13;
    var fadeOutDuration = 500;
    var fadeInDuration = 500;
    $(this).attr('pulsing', 'y');

    $(this).animate({
        opacity: minOpacity
    }, fadeOutDuration, function() {
        $(this).animate({
            opacity: 1
        }, fadeInDuration, function() {
            if ($(this).attr('pulsing') == 'y') $(this).pulse();
        })
    });
    return $(this);
});
$.extend($.fn.jqshowConnected = function() {
    $(this).attr('pulsing', '').stop(true, true).animate({
        opacity: 1
    });
});
$.extend($.fn.jqshowDisConnected = function() {
    $(this).attr('pulsing', '').stop(true, true).animate({
        opacity: 0
    });
});