package me.bala;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.Vector;
import javax.bluetooth.*;


import com.intel.bluetooth.BlueCoveImpl;
import com.intel.bluetooth.RemoteDeviceHelper;

public class Courier implements EndexDiscoveredListener, ConnectionErrorListener, Runnable{
	

	private boolean exitFlag = false;
	
	private BTMessageHandler btm = null;
	private Thread messageThread = null;
	private boolean running = true;
	public int bodyWeight = 0;
	
	Thread inputThread;
	
	BluetoothDeviceDiscovery bdd;
	Thread discoveryThread;
	
	public Courier(String address, String bodyWeight){
		
		if(!bodyWeight.equals("empty")){
			this.bodyWeight = Integer.parseInt(bodyWeight);
		}
		
		if(address.equals("empty")){
			bdd = new BluetoothDeviceDiscovery();
			
			discoveryThread = new Thread(bdd);
			discoveryThread.start();
			
			bdd.addEventListener(this);
			bdd.addErrorEventListener(this);
			//discoveryThread.wait();
			//inputThread = new Thread(this);
			//inputThread.start();
			//inputThread.join();
			
		}
		else{
			this.startMessageHandler(null, address);
		}
	}
	
	public static void main(String[] args) {
		if(args.length != 2){
			System.out.println("Courier requires 2 parameters: Address and BodyWeight. Exiting Application.");
			System.exit(0);
		}
		
		//BlueCoveImpl.setConfigProperty("bluecove.inquiry.duration", "2");
		//BlueCoveImpl.setConfigProperty("bluecove.inquiry.report_asap", "true");
		//BlueCoveImpl.setConfigProperty("bluecove.connect.timeout","45");
		
		
		
		RemoteDevice rdConnect = null;
		String friendlyName = null;
		String blueToothAddress = null;
		String addressConnect = null;
		
		try{
			
			Courier me = new Courier(args[0], args[1]);
			
			//bdd.setRunning(false);
		
		}
		/*catch(IOException ioe){
			System.err.println(ioe.toString());
		}*/
		catch(Exception e){
			System.out.println(e.toString());
		}
		System.out.println("process exiting");
		/*
		try{
			System.out.println("bt address: " + blueToothAddress);
				bdd.populateServices(rdConnect);
				
				while(!bdd.getServiceSearchDone()){
					Thread.sleep(50);
				}
			
		}
		catch(Exception e){
			
		}
		*/
		
		/*
		if(rdConnect == null){
			System.out.println("Exiting. no device found.");
			System.exit(0);
		}
		
		String url;
		url = "btspp://" + addressConnect + ":1;authenticate=false;encrypt=false;master=false";
		
		BTMessageHandler msgTest = new BTMessageHandler(rdConnect, url);

		Thread listener = new Thread(msgTest);
		listener.start();
	
		try{
			boolean bContinue = true;
			
			while(bContinue){
				BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
			    String anykey = null;
			    System.out.print("Press Anykey to Continue : ");
			    anykey = br.readLine();
			    if (anykey.equals("1")){
			    	msgTest.cmd_getFirmWareVersion();
			    }
			    
			    else if (anykey.equals("2")){
			    	msgTest.cmd_getDeviceID();
			    }
			    else {
			    	bContinue = false;
			    }
			}
		}
		catch(IOException ioe){
			System.out.println(ioe.toString());
		}
		catch(Exception e){
		}
		finally{
		}
		msgTest.stopListening();
	*/	
	}
	
	
	public void run(){
		
		//String line;
		
		InputStreamReader isr = new InputStreamReader(System.in);
		char[] input = new char[1024];
		int streamPos = 0;
		
		while(running){
			try{
				BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
				String line = br.readLine();
				System.out.println ("you said: " + line );
				if(line.equalsIgnoreCase("exit")){
					running = false;
				}
				
				/*if( isr.ready() ){
					char c = 0;
					while(c != -1){
						c = (char)isr.read();
						if(c!= -1){
						   input[streamPos++] = c;
						}
					}
					String tmpString = new String( input,0,streamPos );
					System.out.println ("you said: " + tmpString );
					if(tmpString.equalsIgnoreCase("exit")){
						running = false;
					}
					streamPos = 0;
				}*/
				//
				//line = br.
				
			}
			catch(IOException ioe){
				
			}
			
			//if given url,attempt to connect
			//
			
		}
	}
	public List<String> populateBlueToothDevices(){

		List<String> myList = new ArrayList<String>();
		
		return myList;
	}

	public void DeviceDiscovered(EndexDiscoveredEvent evt) {
		
		startMessageHandler(evt.getRemoteDevice() , evt.getAddress());
		
		//btm.run();
	}
	
	public void startMessageHandler(RemoteDevice rd, String address){
		//String url = String.format(urlFormat, address);
		//System.out.println("url = " + url);
		
		btm = new BTMessageHandler(rd, address, this.bodyWeight );
		messageThread = new Thread(btm);
		//messageThread.start();
		try{
			messageThread.join();
		}
		catch(InterruptedException ie){
			System.out.println("Thread rudely interrupted.");
		}
	}

	public void ConnectionError(ConnectionErrorEvent evt) {
		// TODO Auto-generated method stub
		//inputThread.interrupt();
		
		running = false;
	}
}
