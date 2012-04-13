//lets get it started... 
function doLoad(env){
	//$("#wrapper).delay(2000).fadeIn("slow");
    
	if (env == "app") {
        window.nativeWindow.x = (air.Capabilities.screenResolutionX - 675);
        window.nativeWindow.y = (air.Capabilities.screenResolutionY - 475) / 2;
		//alert(air.Capabilities.language);
    }
	setTimeout(function(){
		showMessage("Hello, you can close me if you want to!");
	},1000);
	
	// Initialize Steps counter
    var stepsCounter = new flipCounter('stepsflip-counter', {value:0, inc:1, pace:1000, auto:true, precision:5});
	// Initialize Calorie counter
    var calorieCounter = new flipCounter('caloriesflip-counter', {value:0, inc:1, pace:1000, auto:true, precision:4});
	// Initialize Distance counter
    var distanceCounter = new flipCounter('distanceflip-counter', {value:0, inc:1, pace:1000, auto:true, precision:4});
	// Initialize Time Seconds counter
    var timeSecCounter = new flipCounter('timeSecflip-counter', {value:0, inc:1, pace:1000, auto:true, precision:2, maxCount:60});
	// Initialize Time Minute counter
    var timeMinCounter = new flipCounter('timeMinflip-counter', {value:0, inc:1, pace:61000, auto:true, precision:2});
	
	//click handlers
	$('#signin').click(function(){
		
		$("#wrapper").css("background-image","none").css("background-color","transparent");
		
		$("#login_items div").fadeOut("fast", function(){
			$("#login_items").fadeOut("slow", function(){
				
				if (env == "app") {
                    window.nativeWindow.x = (air.Capabilities.screenResolutionX - 675);
                    window.nativeWindow.y = (air.Capabilities.screenResolutionY - 475) / 2;
                }
				
				
				$('#main').fadeIn('slow');
			});
			
			
		});
					
		
	});
	
	$(".pull_tab").live("click", function(){
        if($(".pull_tab").hasClass("close_all")){
			$(".inner").hide("slow", function(){
				$(".timer").hide("slow", function(){
					$(".pull_tab").addClass("close_tab open_timer").removeClass("close_all");
				});
			});
		}else if($(".pull_tab").hasClass("open_timer")){
            $(".timer").show("fast", function(){
                $(".pull_tab").addClass("open_inner").removeClass("open_timer");
                
            });
        }else{
			$(".inner").show("slow", function(){
                $(".pull_tab").addClass("close_all").removeClass("open_inner close_tab");
                
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
		//TODO LOCALIZE
		showMessage("uploading exercise data...");
		return false;
	});
	$(".chart_menu a").click(function(){
		$(".chart_menu li").removeClass("selected");
		$(this).parent().addClass("selected");
	});
	$('body').keypress(function(e){
		if (e.which == 13) {
		
			$('#signin').click();
			
			e.preventDefault();
			return false;
		}
		
	});
	return;
}
//HELPER FUNCTIONS
function showMessage(msg){
	$(".alert_message p").html(msg);
	$(".alert_message").animate({top: "-86px"}, "slow", function(){
		
        $(".alert_message").css({zIndex: "2"});
    });
}
function hideMessage(){
	$(".alert_message p").html("");
	$(".alert_message").css({zIndex: "-1"}).animate({top: "25px"}, "slow");
}
