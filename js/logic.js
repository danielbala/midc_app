//lets get it started... 
function doLoad(env){
	//$("#wrapper).delay(2000).fadeIn("slow");
    if (env == "app") {
        window.nativeWindow.x = (air.Capabilities.screenResolutionX - 675);
        window.nativeWindow.y = (air.Capabilities.screenResolutionY - 475) / 2;
    }
	
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
			$(".inner").hide("fast", function(){
				$(".timer").hide("fast", function(){
					$(".pull_tab").addClass("close_tab open_timer").removeClass("close_all");
				});
			});
		}else if($(".pull_tab").hasClass("open_timer")){
            $(".timer").show("fast", function(){
                $(".pull_tab").addClass("open_inner").removeClass("open_timer");
                
            });
        }else{
			$(".inner").show("fast", function(){
                $(".pull_tab").addClass("close_all").removeClass("open_inner close_tab");
                
            });
		}
		
        return false;
    });
	
	$(".tab_link").click(function(){
		if($(".drop_tab").hasClass("open_drop_tab")){
			$(".drop_tab").removeClass("open_drop_tab","fast");
            $(".tab_link").removeClass("close_tab_link");
		}else{
			$(".drop_tab").addClass("open_drop_tab","fast");
            $(".tab_link").addClass("close_tab_link","fast");
		}
		
		
		return false;
	});
	
	$(".close_message").click(function(){
		$(".alert_message").fadeOut();
		return false;
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
