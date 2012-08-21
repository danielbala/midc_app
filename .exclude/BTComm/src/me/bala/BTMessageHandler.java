package me.bala;


import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import javax.bluetooth.RemoteDevice;
import javax.microedition.io.Connector;
import javax.microedition.io.StreamConnection;
import javax.microedition.io.StreamConnectionNotifier;

import com.intel.bluetooth.RemoteDeviceHelper;

public class BTMessageHandler implements Runnable{
	

	private String messageFormat = "{ \"address\": \"%s\", \"devicetype\": \"%s\", \"flag\": \"%s\",  \"uom\": %d, \"steps\": %d, \"calories\": %d, \"speed\": { \"whole\": %d, \"fraction\": %d   }, \"distance\": { \"whole\": %d, \"fraction\": %d   },\"time\": { \"hour\": %d, \"minute\": %d, \"second\": %d  }}";
	private String urlFormat = "btspp://%s:1;authenticate=false;encrypt=false;master=false";
	//private int consecutiveStepCount;
	//private int prevStep;
	//private int currStep;
	private String deviceType = "";
	private boolean shutDown;
	private boolean initializing = true;
	
	class MessageProcess{
		public String address;
		public String flag = "";
		public int uom = -1;
		public int steps = -1;
		public int calories = -1;
		public int distance_whole = -1;
		public int distance_fraction = -1;
		public int time_hour = -1;
		public int time_minute = -1;
		public int time_second = -1;
		public int treadbelt_speed_whole = -1;
		public int treadbelt_speed_fraction = -1;
		public String devicetype = "";
		
		public String toString(){
			return String.format(messageFormat
					,address 
					,devicetype
					,flag
					,uom
					,steps
					,calories
					,treadbelt_speed_whole
					,treadbelt_speed_fraction
					,distance_whole
					,distance_fraction
					,time_hour
					,time_minute
					,time_second
					);
		}
	}
	
    private List<ConnectionErrorListener> _listeners = new ArrayList<ConnectionErrorListener>();

	private Object lock = new Object();
	
	private static final byte EMPTY = (byte) 0x00;
	private static final byte STATUS_OK = (byte) 0xAA;
	private static final byte STATUS_FAIL = (byte) 0xFF;
	private static final byte STATUS_WRONG_PARAMETER = (byte) 0xEE;
	
	private static final byte MSG_FIRMWARE = (byte) 0xC2;
	private static final byte MSG_ENGAGE_EX_CTL = (byte) 0x04;
	private static final byte MSG_DISENGAGE_EX_CTL = (byte) 0x05;
	private static final byte MSG_DEVICE_ID = (byte) 0x02;
	
	private static final byte MSG_DEVICE_ID_TREADMILL = (byte) 0x11;
	private static final byte MSG_DEVICE_ID_BIKE = (byte) 0x22;
	private static final byte MSG_DEVICE_ID_ELLIPTICAL = (byte) 0x44;
	private static final byte MSG_DEVICE_ID_STEPPER = (byte) 0x88;
	
	private static final byte MSG_VARIABLE = (byte) 0xA1;
	
	private static final byte MSG_VARIABLE_UOM = (byte) 0x81;
	private static final byte MSG_VARIABLE_UOM_METRIC = (byte) 0xAA;
	private static final byte MSG_VARIABLE_UOM_IMPERIAL = (byte) 0xFF;
	
	private static final byte MSG_VARIABLE_TREADBELT_SPEED = (byte) 0x82;
	private static final byte MSG_VARIABLE_DISTANCE = (byte) 0x85;
	private static final byte MSG_VARIABLE_PULSE = (byte) 0x86;
	private static final byte MSG_VARIABLE_CALORIES = (byte) 0x87;
	private static final byte MSG_VARIABLE_STEP = (byte) 0x88;
	private static final byte MSG_VARIABLE_TIME = (byte) 0x89;
	
	private static final byte MSG_SET_WEIGHT = (byte) 0xE4;
	
	/*
	private static final byte MSG_VARIABLE_STATUS = (byte) 0x91;
	private static final byte MSG_VARIABLE_STATUS_IDLING = (byte) 0x01;
	private static final byte MSG_VARIABLE_STATUS_RUN = (byte) 0x03;
	private static final byte MSG_VARIABLE_STATUS_PAUSE = (byte) 0x05;
	private static final byte MSG_VARIABLE_STATUS_SAFE_KEY_LOSS = (byte) 0x0A;
	
	*/
	
		
	private byte[] requestBytes  = new byte[5];
	private byte[] responseBytes = new byte[6];
	private boolean connected = false;
	private boolean running = true;
	
	String _address;
	String _url;
	RemoteDevice _rd;
	int _userWeight;
	
	StreamConnectionNotifier sc;
	StreamConnection streamCon;
	
	OutputStream outStream;
	InputStream inStream = null;
	
	public void stopListening(){
		running = false;

		try{
			streamCon.close();
		}
		catch(Exception e){
			
		}
		
		try{
			sc.close();
		}
		catch(Exception e){
			
		}
		
		try{
			outStream.close();
		}
		catch(Exception e){
			
		}
		
		try{
			inStream.close();
		}
		catch(Exception e){
			
		}
		
	}
	
	public void closeStream(){
		try{
			sc.close();
		}
		catch(IOException ioe){
			
		}
		finally{
			sc = null;
		}
	}
	
	BTMessageHandler(RemoteDevice rd, String address, int userWeight){
		_address = address;
		_url = String.format(urlFormat,_address);
		_rd = rd;
		_userWeight = userWeight;
		
		try{
			Thread.sleep(500);
			System.out.println("Trying to connect.");
			streamCon=(StreamConnection)Connector.open(_url);
			System.out.println("opened.");
			if(_rd == null){
				_rd = RemoteDevice.getRemoteDevice(streamCon);
			}
			System.out.println("got device.");
			boolean authenticated  = RemoteDeviceHelper.authenticate(_rd,"0000");
			
			System.out.println("authenticated: " + authenticated);
			
			outStream = streamCon.openDataOutputStream();
			
			System.out.println("CONNECTED|" + _address);
			connected = true;
		}
		catch(javax.bluetooth.BluetoothStateException bse){
			System.out.println(bse.toString());
			System.out.println("BTOFF");
		}
		catch(javax.bluetooth.BluetoothConnectionException bce){
			System.out.println(bce.toString());
			System.out.println("NOTFOUND");
		}
		catch(IOException e){
			//fireErrorEvent();
			System.out.println("ioexception");
			System.out.println(e.toString());
		}
		catch(Exception e){
			//fireErrorEvent();
			System.out.println("exception");
			System.out.println(e.toString());
		}// end try
		
	}
	
	public byte[] getResponseBytes(){
		return responseBytes;
	}
	private void clearRequest(){
		for(int i = 0; i<requestBytes.length-1;i++){
			requestBytes[i] = EMPTY;
		}
	}
	private void clearResponse(){
		for(int i = 0; i<responseBytes.length-1;i++){
			responseBytes[i] = EMPTY;
		}
	}
	void cmd_setUserWeight(){
		
		clearRequest();
		requestBytes[0] = MSG_SET_WEIGHT;
		byte[] weightBytes = toBytes(_userWeight);
		printByteArray(weightBytes);
		requestBytes[1] = weightBytes[2];
		requestBytes[2] = weightBytes[3];
		sendMessage();
	}
	
	void cmd_getFirmWareVersion(){
		clearRequest();
		requestBytes[0] = MSG_FIRMWARE;
		sendMessage();
	}
	
	void cmd_getDeviceID(){
		clearRequest();
		requestBytes[0] = MSG_DEVICE_ID;
		sendMessage();
	}
	
	void cmd_getUOM(){
		clearRequest();
		requestBytes[0] = MSG_VARIABLE;
		requestBytes[1] = MSG_VARIABLE_UOM;
		sendMessage();
	}
	
	void cmd_getDistance(){
		clearRequest();
		requestBytes[0] = MSG_VARIABLE;
		requestBytes[1] = MSG_VARIABLE_DISTANCE;
		sendMessage();
	}
	
	void cmd_getPulse(){
		clearRequest();
		requestBytes[0] = MSG_VARIABLE;
		requestBytes[1] = MSG_VARIABLE_PULSE;
		sendMessage();
	}
	
	void cmd_getCalories(){
		clearRequest();
		requestBytes[0] = MSG_VARIABLE;
		requestBytes[1] = MSG_VARIABLE_CALORIES;
		sendMessage();
	}
	
	void cmd_getStep(){
		clearRequest();
		requestBytes[0] = MSG_VARIABLE;
		requestBytes[1] = MSG_VARIABLE_STEP;
		sendMessage();
	}
	
	void cmd_getTime(){
		clearRequest();
		requestBytes[0] = MSG_VARIABLE;
		requestBytes[1] = MSG_VARIABLE_TIME;
		sendMessage();
	}
	
	void cmd_getTreadbeltSpeed(){
		clearRequest();
		requestBytes[0] = MSG_VARIABLE;
		requestBytes[1] = MSG_VARIABLE_TREADBELT_SPEED;
		sendMessage();
	}
	
	void processResponse(MessageProcess msg){
		 switch(responseBytes[0]){
		    case MSG_VARIABLE: 
		    	switch(requestBytes[1]){
		    	    case MSG_VARIABLE_UOM:      
		    	    	msg.uom = (responseBytes[2] == MSG_VARIABLE_UOM_METRIC ? 0 : 1);
		    	    	break;
		    	    case MSG_VARIABLE_STEP:     
		    	    	msg.steps = (this.mergeBytes(responseBytes[2], responseBytes[3]));
		    	    	if( initializing && msg.steps > 0 ){
		    	    		initializing = false;
		    	    	}
		    	    	else if (!initializing && msg.steps == 0 ){
		    	    		shutDown = true;
		    	    	}
		    	    	break;
		    	    case MSG_VARIABLE_CALORIES: 
		    	    	msg.calories= (this.mergeBytes(responseBytes[2], responseBytes[3]));
		    	    	break;
		    	    case MSG_VARIABLE_DISTANCE: 
		    	    	msg.distance_whole =    (int)responseBytes[2];					    
		    	    	msg.distance_fraction = (int)responseBytes[3];
		    	    	break;
		    	    case MSG_VARIABLE_TIME:     
		    	    	msg.time_hour =   (int)responseBytes[2];
		    	    	msg.time_minute = (int)responseBytes[3];
		    	    	msg.time_second = (int)responseBytes[4];
		    	    	break;
		    	    case MSG_VARIABLE_TREADBELT_SPEED:   
		    	    	msg.treadbelt_speed_whole = (int) responseBytes[2] ;
		    	    	msg.treadbelt_speed_fraction = (int) responseBytes[3] ;
		    	    	if(msg.treadbelt_speed_whole == 0 && msg.treadbelt_speed_fraction == 0 ){
		    	    		msg.flag = "P";
		    	    	}
		    	    	else{
		    	    		msg.flag = "";
		    	    	}
		    	    	break;
		    	};
		    	break;
		    case MSG_DEVICE_ID:
		    	switch(responseBytes[2]){
		    	   case MSG_DEVICE_ID_TREADMILL:  deviceType = "T"; break;
		    	   case MSG_DEVICE_ID_BIKE:       deviceType = "B"; break;
		    	   case MSG_DEVICE_ID_ELLIPTICAL: deviceType = "E"; break;
		    	   case MSG_DEVICE_ID_STEPPER:    deviceType = "S"; break;
		    	};
		    	break;
		    case MSG_SET_WEIGHT:
		    	if(responseBytes[1] == STATUS_OK)
		    		System.out.println("weight successfully written.");
		    	else
		    		System.out.println("weight set failure");
		    	
		    	//requestBytes[0] = MSG_DEVICE_ID
		 };
	 }
	
	public void cmd_EngageExternalControl(){
		clearRequest();
		requestBytes[0] = MSG_ENGAGE_EX_CTL;
		sendMessage();
	}
	
	public void cmd_DisengageExternalControl(){
		clearRequest();
		requestBytes[0] = MSG_DISENGAGE_EX_CTL;
		sendMessage();
	}
	
	public int mergeBytes(byte b1, byte b2){
		return (int)(b1 << 8) | (b2 & 0xFF);
	}
	
	public byte[] toBytes(int i)
	{
	  byte[] result = new byte[4];

	  result[0] = (byte) (i >> 24);
	  result[1] = (byte) (i >> 16);
	  result[2] = (byte) (i >> 8);
	  result[3] = (byte) (i /*>> 0*/);

	  return result;
	}

	private void sendMessage(){
		 //connect to the server and send a line of text
		
        //send string
		if(connected){
			
	        try{
	        	outStream.write(requestBytes);
	            outStream.flush();
	        }
	        catch(IOException ioe){
	        	//fireErrorEvent();
	        	stopListening();
	        }
	        //System.out.println("output data");
	       
		}
	}

	public void run() {
		int sequence = -3; //to do 2 one time messages
		boolean request = true;
		MessageProcess msg = null;
		
		//read response
		try{
			
			while(running){
					
					if(request){
						sequence++;
						synchronized(lock){
							switch (sequence){
								case -2:
									cmd_getDeviceID();
									Thread.sleep(100);
									break;
								case -1:
									if(_userWeight!=0){
										cmd_setUserWeight();
										Thread.sleep(100);	
									}
									break;
								//sequence loop starts at 0
								case 1:  
									msg = new MessageProcess();
									msg.address = _address;
									msg.devicetype = deviceType;
									
									cmd_getUOM();
									Thread.sleep(100);
									break;
								case 2:  cmd_getStep();
									Thread.sleep(100);
									break;
								case 3:  cmd_getCalories();
									Thread.sleep(100);
									break;
								case 4:  cmd_getDistance();
									Thread.sleep(100);
									break;
								case 5:  cmd_getTime();
									Thread.sleep(100);
									break;
								case 6:  cmd_getTreadbeltSpeed();
									Thread.sleep(100);
									break;
								
								case 20:
									if(shutDown){
										msg.flag = "S";
									}
									System.out.println(msg.toString());
									if(shutDown){
									   running = false;
 	    							   fireErrorEvent();
									}
									Thread.sleep(400);
									
									sequence = 0;
									break;
							}
						}
					}  //request
					
					else{
						if (inStream == null){
						   inStream= streamCon.openInputStream();
						}
						if(inStream.available() >= 6){
			        		
							//System.out.println("available" + inStream.available());
			        		
							synchronized(lock){
			        			clearResponse();
			        			inStream.read(responseBytes);
			        			//inStream.re
			        			processResponse(msg);
			        		}
							
				    		
							
			        	}
					}
					request = !request;
			}//end while running
        }//end try
		catch(Exception e){
			stopListening();
			//fireErrorEvent();
			System.out.println(e.toString());
			//connected = false;
			//inStream = null;
		}
	}
	private void printByteArray(byte[] bytes){
		
		String sOutput = new String(responseBytes);
		StringBuilder sb = new StringBuilder();
		
	    for (byte b : bytes) {
	        sb.append(String.format("%02X ", b));
	    }
	    System.out.println(sb.toString());
	   
	    System.out.println();
	    

	}
	public synchronized void addEventListener(ConnectionErrorListener listener){
		_listeners.add(listener);
	}
	
	public synchronized void removeEventListener(ConnectionErrorListener listener){
		_listeners.remove(listener);
	}
	
	private synchronized void fireErrorEvent(){
		connected = false;
		running = false;
		ConnectionErrorEvent event = new ConnectionErrorEvent(this);
	    Iterator i = _listeners.iterator();
	    
	    while(i.hasNext())  {
	      ((ConnectionErrorListener) i.next()).ConnectionError(event);
	    }
	    
	}
}
