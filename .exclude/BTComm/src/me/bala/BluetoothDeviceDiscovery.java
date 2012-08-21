package me.bala;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Vector;
 
import javax.bluetooth.DeviceClass;
import javax.bluetooth.DiscoveryAgent;
import javax.bluetooth.DiscoveryListener;
import javax.bluetooth.LocalDevice;
import javax.bluetooth.RemoteDevice;
import javax.bluetooth.ServiceRecord;
import javax.bluetooth.UUID;

import me.bala.Socket.SocketMessageEvent;
import me.bala.Socket.SocketMessageListener;
 
 
/**
* Class that discovers all bluetooth devices in the neighbourhood
* and displays their name and bluetooth address.
*/
public class BluetoothDeviceDiscovery implements DiscoveryListener, Runnable{
	
    //object used for waiting
    //private Object lock = new Object();
   
    //vector containing the devices discovered
    //private Vector<RemoteDevice> vecDevices=new Vector<RemoteDevice>();
    private Map<String,RemoteDevice> mapDevices = new HashMap<String,RemoteDevice>();
    
    private String url;
   // private ServiceRecord selectedServRecord;
    private Object lock = new Object();
    private boolean connected = false;
    private boolean endexDiscovered = false;
    private RemoteDevice endexDevice;
    
    private List<EndexDiscoveredListener> _listeners = new ArrayList<EndexDiscoveredListener>();

    private List<ConnectionErrorListener> _Errorlisteners = new ArrayList<ConnectionErrorListener>();

    
    private boolean running = true;
    
    public String getURL(){
    	return url;
    }
    private boolean flagLocalDeviceDone;
    
    public boolean getLocalDeviceDone(){
    	return flagLocalDeviceDone;
    }
    public void reset(){
    	url = "";
    	endexDiscovered = false;
    	endexDevice = null;
    	mapDevices.clear();
    	
    }
    public void setRunning(boolean value){
    	running = value;
    }
    
    private boolean flagServiceSearchDone;
    
    public boolean getServiceSearchDone(){
    	return flagServiceSearchDone;
    }
    /*
    public Vector<RemoteDevice> getRemoteDevices(){
    	return vecDevices;
    }*/
    /*public ServiceRecord getServiceRecord(){
    	return selectedServRecord;
    }*/
   public void populateLocalDevices() throws IOException{
	   //flagLocalDeviceDone = false;
	   
		   LocalDevice.getLocalDevice().getDiscoveryAgent().startInquiry( DiscoveryAgent.GIAC, this);
	   
   }
   public void populateServices(RemoteDevice rd) /*throws BluetoothStateException*/{
System.out.println("populating services");
	   flagServiceSearchDone = false;
	   
	   UUID[] uuidSet = new UUID[1];
       //uuidSet[0]=new UUID(0x1101);
	   uuidSet[0]=new UUID(0x1002);
	   try{
		   LocalDevice.getLocalDevice().getDiscoveryAgent().searchServices(null, uuidSet, rd , this);
	   
	   }
	   catch(Exception e){
		   System.out.println(e.toString());
	   }
	   
   }
    //main method of the application
    /*
    public static void main(String[] args) throws IOException {
       
        //create an instance of this class
        BluetoothDeviceDiscovery bluetoothDeviceDiscovery=new BluetoothDeviceDiscovery();
       
        //display local device address and name
        LocalDevice localDevice = LocalDevice.getLocalDevice();
        //System.out.println("Address: "+localDevice.getBluetoothAddress());
        //System.out.println("Name: "+localDevice.getFriendlyName());
       
        //find devices
        DiscoveryAgent agent = localDevice.getDiscoveryAgent();
      
        System.out.println("Starting device inquiry...");
        agent.startInquiry(DiscoveryAgent.GIAC, bluetoothDeviceDiscovery);
       
        try {
            synchronized(lock){
                lock.wait();
            }
        }
        catch (InterruptedException e) {
            e.printStackTrace();
        }
       
       
        System.out.println("Device Inquiry Completed. ");
       
        //print all devices in vecDevices
        int deviceCount=vecDevices.size();
       
        if(deviceCount <= 0){
            System.out.println("No Devices Found .");
        }
        else{
            //print bluetooth device addresses and names in the format [ No. address (name) ]
            System.out.println("Bluetooth Devices: ");
            for (int i = 0; i <deviceCount; i++) {
                RemoteDevice remoteDevice=(RemoteDevice)vecDevices.elementAt(i);
                System.out.println((i+1)+". "+remoteDevice.getBluetoothAddress()+" ("+remoteDevice.getFriendlyName(true)+")");
            }
        }
       
       
    }//end main
 */
    //methods of DiscoveryListener
   
    /**
     * This call back method will be called for each discovered bluetooth devices.
     */
    public void deviceDiscovered(RemoteDevice btDevice, DeviceClass cod) {
        //System.out.println("Device discovered: "+btDevice.getBluetoothAddress());
        //add the device to the vector
    	String friendlyName;
    	try{
    		friendlyName = btDevice.getFriendlyName(false);
    		System.out.println(friendlyName);
    		
    		 if(!mapDevices.containsKey(friendlyName)){
    	        	
    			 	if(friendlyName.equalsIgnoreCase("ENDEX")){
    			 		//System.out.println("found endex in BDD;");
    			 		populateServices(btDevice);
    			 		endexDiscovered = true;
    			 		endexDevice = btDevice;
    			 		url = btDevice.getBluetoothAddress();
    			 		//fireEvent();
    			 		
    			 	}
    	        	mapDevices.put(friendlyName,btDevice);
    	        }
    	}
    	catch(IOException ioe){
    		running = false;
    		System.err.print(ioe.toString());
    	}
    }
    
    public void servicesDiscovered(int transID, ServiceRecord[] servRecord) {
    	
    	System.out.println("Service count: " + servRecord.length);
    	int i;
    	
    	for(i=0;i<servRecord.length;i++){
    		url = servRecord[0].getConnectionURL(0,false);
    		System.out.println(url);
    	}
    	
    	//selectedServRecord = servRecord[0];
    	
    	
    	
    }
 
    //no need to implement this method since services are not being discovered
    public void serviceSearchCompleted(int transID, int respCode) {
    	
    	System.out.println("Service Search done");
    	flagServiceSearchDone = true;
    	
    	
    }
 
   
    /**
     * This callback method will be called when the device discovery is
     * completed.
     */
    public void inquiryCompleted(int discType) {
       
        
    	String friendlyName;
    	String blueToothAddress;
    	
        switch (discType) {
            case DiscoveryListener.INQUIRY_COMPLETED :
                System.out.println("INQUIRY_COMPLETED");
                try{
                	if(!endexDiscovered){
                		System.out.println("NOTFOUND");
                		
                	}
                	
                	/*
                	for (Map.Entry<String, RemoteDevice> entry : mapDevices.entrySet())
                	{
                	    System.out.println( entry.getValue().getBluetoothAddress() + " (" + entry.getKey() + ")");
                	}
                	System.out.println("");
                	*/
                	/*
                	for(RemoteDevice rd: getRemoteDevices()){
            			friendlyName = rd.getFriendlyName(true);
            			blueToothAddress = rd.getBluetoothAddress(); 
            			System.out.println(blueToothAddress + " (" +  friendlyName + ")");
            			if(friendlyName.equalsIgnoreCase("ENDEX")){
            				//rdConnect = rd;
            				//addressConnect = blueToothAddress;
            			}
            		}*/
                }
               catch(Exception e){
            	   System.out.println(e.toString());
               }
               break;
            case DiscoveryListener.INQUIRY_TERMINATED :
                System.out.println("INQUIRY_TERMINATED");
                break;
               
            case DiscoveryListener.INQUIRY_ERROR :
                System.out.println("INQUIRY_ERROR");
                break;
 
            default :
                System.out.println("Unknown Response Code");
                break;
        }
        
        synchronized(lock){
            lock.notify();
        }
        running = false;
        fireErrorEvent();
        flagLocalDeviceDone = true;
    }//end method

	public void run() {
		while(running){
			try{
				populateLocalDevices();
				synchronized(lock){
					lock.wait();
				}
				//Thread.sleep(500);
			}
			catch(javax.bluetooth.BluetoothStateException bse){
				   System.out.println("BTOFF");
				   running = false;
			}
			catch(IOException ioe){
				System.out.println(ioe.toString());
				running = false;
			}
			catch(InterruptedException ie){
				System.out.println(ie.toString());
				running = false;
			}
		}
	}
	
	public synchronized void addErrorEventListener(ConnectionErrorListener listener){
		_Errorlisteners.add(listener);
	}
	
	public synchronized void addEventListener(EndexDiscoveredListener listener){
		_listeners.add(listener);
	}
	
	public synchronized void removeEventListener(EndexDiscoveredListener listener){
		_listeners.remove(listener);
	}
	
	private synchronized void fireEvent(){
		EndexDiscoveredEvent event = new EndexDiscoveredEvent(this,endexDevice,url);
	    Iterator i = _listeners.iterator();
	    
	    while(i.hasNext())  {
	      ((EndexDiscoveredListener) i.next()).DeviceDiscovered(event);
	    }
	    running = false;
	}
	
	private synchronized void fireErrorEvent(){
		ConnectionErrorEvent event = new ConnectionErrorEvent(this);
	    Iterator i = _listeners.iterator();
	    
	    while(i.hasNext())  {
	      ((ConnectionErrorListener) i.next()).ConnectionError(event);
	    }
	    running = false;
	}
}//end class