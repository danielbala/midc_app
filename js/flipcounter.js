/**
 * Apple-Style Flip Counter
 * Version 0.5.3 - May 7, 2011 
 *
 * Copyright (c) 2010 Chris Nanney
 * http://cnanney.com/journal/code/apple-style-counter-revisited/
 *
 * Licensed under MIT
 * http://www.opensource.org/licenses/mit-license.php
 */
 
var flipCounter = function(d, options){

	// Default values
	var defaults = {
		value: 0,
		inc: 1,
		pace: 1000,
		auto: true
	};
	
	var o = options || {},
	doc = window.document;
	
	for (var opt in defaults) o[opt] = (opt in o) ? o[opt] : defaults[opt];

	var digitsOld = [], digitsNew = [], digitsAnimate = [], x, y, nextCount = null,
		best = {
			q: null,
			pace: 0,
			inc: 0
		};
	
	/**
	 * Sets the value of the counter and animates the digits to new value.
	 * 
	 * Example: myCounter.setValue(500); would set the value of the counter to 500,
	 * no matter what value it was previously.
	 *
	 * @param {int} n
	 *   New counter value
	 */
	this.setValue = function(n){
		if (isNumber(n)){
			x = o.value;
			y = n;
			o.value = n;
			digitCheck(x,y);
		}
		return this;
	};
	
	/**
	 * Sets the increment for the counter. Does NOT animate digits.
	 */
	this.setIncrement = function(n){
		o.inc = isNumber(n) ? n : defaults.inc;
		return this;
	};
	
	/**
	 * Sets the pace of the counter. Only affects counter when auto == true.
	 *
	 * @param {int} n
	 *   New pace for counter in milliseconds
	 */
	this.setPace = function(n){
		o.pace = isNumber(n) ? n : defaults.pace;
		return this;
	};
	
	/**
	 * Sets counter to auto-increment (true) or not (false).
	 *
	 * @param {bool} a
	 *   Should counter auto-increment, true or false
	 */
	this.setAuto = function(a){
		var sa = typeof a !== "boolean" ? true : a;
		if (o.auto){
			if (! sa){
				if (nextCount) clearNext();
				o.auto = false;
			}
		}
		else{
			if (sa){
				if (nextCount) clearNext();
				o.auto = true;
				doCount();
			}
		}
		return this;
	};
	
	/**
	 * Increments counter by one animation based on set 'inc' value.
	 */
	this.step = function(){
		if (! o.auto) doCount();
		return this;
	};
	
	/**
	 * Adds a number to the counter value, not affecting the 'inc' or 'pace' of the counter.
	 *
	 * @param {int} n
	 *   Number to add to counter value
	 */
	this.add = function(n){
		if (isNumber(n)){
			x = o.value;
			o.value += n;
			y = o.value;
			digitCheck(x,y);
		}
		return this;
	};
	
	/**
	 * Subtracts a number from the counter value, not affecting the 'inc' or 'pace' of the counter.
	 *
	 * @param {int} n
	 *   Number to subtract from counter value
	 */
	this.subtract = function(n){
		if (isNumber(n)){
			x = o.value;
			o.value -= n;
			if (o.value >= 0){
				y = o.value;
			}
			else{
				y = "0";
				o.value = 0;
			}
			digitCheck(x,y);
		}
		return this;
	};
	
	/**
	 * Increments counter to given value, animating by current pace and increment.
	 *
	 * @param {int} n
	 *   Number to increment to
	 * @param {int} t (optional)
	 *   Time duration in seconds - makes increment a 'smart' increment
	 * @param {int} p (optional)
	 *   Desired pace for counter if 'smart' increment
	 */
	this.incrementTo = function(n, t, p){
		if (nextCount) clearNext();
		
		// Smart increment
		if (typeof t !== "undefined"){
			var time = isNumber(t) ? t * 1000 : 10000,
				pace = typeof p !== "undefined" && isNumber(p) ? p : o.pace,
				diff = typeof n !== "undefined" && isNumber(n) ? n - o.value : 0,
				cycles, inc, i = 0;
			best.q = null;
			
			// Initial best guess
			pace = (time / diff > pace) ? Math.round((time / diff) / 10) * 10 : pace;
			cycles = Math.floor(time / pace);
			inc = Math.floor(diff / cycles);
			
			var check = checkSmartValues(diff, cycles, inc, pace, time);
			
			if (diff > 0){
				while (check.result === false && i < 100){				
					pace += 10;
					cycles = Math.floor(time / pace);
					inc = Math.floor(diff / cycles);
					
					check = checkSmartValues(diff, cycles, inc, pace, time);
					i++;
				}
				
				if (i == 100){
					// Could not find optimal settings, use best found so far
					o.inc = best.inc;
					o.pace = best.pace;
				}
				else{
					// Optimal settings found, use those
					o.inc = inc;
					o.pace = pace;
				}
				
				doIncrement(n, true, cycles);
			}
		
		}
		// Regular increment
		else{
			doIncrement(n);
		}
		
	}
	
	/**
	 * Gets current value of counter.
	 */
	this.getValue = function(){
		return o.value;
	}
	
	/**
	 * Stops all running increments.
	 */
	this.stop = function(){
		if (nextCount) clearNext();
		return this;
	}
	
	//---------------------------------------------------------------------------//
	
	function doCount(first){
		var first_run = typeof first === "undefined" ? false : first;
		x = o.value;
		if (! first_run) o.value += o.inc;
		y = o.value;
		digitCheck(x,y);
	  // Do first animation
	  if (o.auto === true) nextCount = setTimeout(doCount, o.pace);
	}
	
	function doIncrement(n, s, c){
		var val = o.value,
			smart = (typeof s === "undefined") ? false : s,
			cycles = (typeof c === "undefined") ? 1 : c;
		
		if (smart === true) cycles--;
		
		if (val != n){
			x = o.value;
			o.auto = true;

			if (val + o.inc <= n && cycles != 0) val += o.inc;
			else val = n;
			
			o.value = val;
			y = o.value;
			
			
			if (y === o.maxCount) {
				o.value = 0;
				n = 0;
				x = 0;
				y = 0;
				doCount(true);
				digitCheck(x,y);
			}
			else {
				digitCheck(x,y);
				nextCount = setTimeout(function(){
					doIncrement(n, smart, cycles)
				}, o.pace);
			}
		}
		else o.auto = false;
	}
	
	function digitCheck(x,y){
		//
		if (y === o.maxCount) {
			//console.log(x,y, o.maxCount);
			o.value = 0;
			n = 0;
			x = 0;
			y = 0;
			//doCount(true);
			//digitCheck(x, y);
		}
		
		digitsOld = splitToArray(x);
		digitsNew = splitToArray(y);
		var ylen = digitsNew.length;
		for (var i = 0; i < ylen; i++){
			digitsAnimate[i] = digitsNew[i] != digitsOld[i];
		}
        draw_counter();
	}
	
	// Creates array of digits for easier manipulation
	function splitToArray(input){
		return input.toString().split('').reverse();
	}

	// Sets the correct digits on load
	function draw_counter(){
		var count = digitsNew.length,
		bit = 1, i, ch='<ul>', dNew, dOld;
		for (i = 0; i < o.precision; i++){
			dNew = isNumber(digitsNew[i]) ? digitsNew[i] : '0';
			dOld = isNumber(digitsOld[i]) ? digitsOld[i] : '0';
			ch += '<li class="digit"><div class="digit-a'+i+' digit-wrap"><div class="shadow"></div>'+
			'<div class="top-new"><span>'+dNew+'</span></div>'+
			'<div class="digit-hinge"><div class="top-old"><span>'+dOld+'</span></div>'+
			'<div class="bottom-new"><span>'+dNew+'</span></div></div>'+
			'<div class="bottom-old"><span>'+dOld+'</span></div></div></li>';
			if (bit != (count) && bit % 3 == 0){
				//ch += '<li class="digit-separator">:</li>';
			}
			bit++;
		}
		ch += '</ul>';
		var element = doc.getElementById(d);
		
		//console.log(element);
		element.innerHTML = ch;

		var alen = digitsAnimate.length;
		for (i = 0; i < alen; i++){
			if (digitsAnimate[i]){
				var a = $(element).find('.digit-a'+i);
				a.className = 'digit-wrap do-digit-animate';
			}
		}

	}
	
	// Checks values for smart increment and creates debug text
	function checkSmartValues(diff, cycles, inc, pace, time){
		var check = {result: true}, q;
		// Test conditions, all must pass to continue:
		// 1: Unrounded inc value needs to be at least 1
		check.test1 = (diff / cycles >= 1);
		// 2: Don't want to overshoot the target number
		check.test2 = (cycles * inc <= diff);
		// 3: Want to be within 10 of the target number
		check.test3 = (Math.abs(cycles * inc - diff) <= 10);
		// 4: Total time should be within 100ms of target time.
		check.test4 = (Math.abs(cycles * pace - time) <= 100);
		// 5: Calculated time should not be over target time
		check.test5 = (cycles * pace <= time);
		
		// Keep track of 'good enough' values in case can't find best one within 100 loops
		q = Math.abs(diff - (cycles * inc)) + Math.abs(cycles * pace - time);
		if (best.q === null) best.q = q;
		if (q <= best.q){
			best.q = q;
			best.pace = pace;
			best.inc = inc;
		}
		
		for(var test in check) {
			if (check[test] === false) check.result = false;
		}

		return check;
	}
	
	// http://stackoverflow.com/questions/18082/validate-numbers-in-javascript-isnumeric/1830844
	function isNumber(n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}
	
	function clearNext(){
		clearTimeout(nextCount);
		nextCount = null;
	}
	
	// Start it up
	doCount(true);
};