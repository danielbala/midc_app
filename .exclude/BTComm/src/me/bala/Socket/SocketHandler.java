package me.bala.Socket;
import java.io.DataInputStream;
import java.io.IOException;
import java.io.PrintStream;
import java.net.Socket;
import java.net.ServerSocket;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
//import me.bala.Socket.*;

public class SocketHandler implements Runnable{
	
	private int port, maxConnections=0;
	private boolean running;
	private byte[] byteBuffer;
	
	
	private List<SocketMessageListener> _listeners = new ArrayList<SocketMessageListener>();

	//private doSocketComms commHandler;
	private Thread socketThread;
	
	Socket server;
	ServerSocket listener;
	
	SocketHandler(){
		this(8888);
	}

	SocketHandler(int pPort){
		try{
			System.out.println("listening for incoming connection");
			
			server = listener.accept();
			System.out.println("someone connected");
			
			//commHandler = new doSocketComms(server);
			socketThread = new Thread(this);
			socketThread.run();
			
		}
		catch(IOException ioe){
			System.out.println("Could not connect on port " + port);
		}
	}
	
	public synchronized void addEventListener(SocketMessageListener listener){
		_listeners.add(listener);
	}
	
	public synchronized void removeEventListener(SocketMessageListener listener){
		_listeners.remove(listener);
	}
	
	private synchronized void fireEvent(){
		SocketMessageEvent event = new SocketMessageEvent(this);
	    Iterator i = _listeners.iterator();
	    
	    while(i.hasNext())  {
	      ((SocketMessageListener) i.next()).MessageReceived(event);
	    }
	    
	}

	public void stopRunning(){
		running = false;
	}
	
	public void run() { 
		String input;
		input="";
		StringBuilder sb = new StringBuilder();
		
		try 
		{
			// Get input from the client
			DataInputStream in = new DataInputStream (server.getInputStream());
			PrintStream out = new PrintStream(server.getOutputStream());

			while(running) {
				if(in.available() > 0){
					byteBuffer = new byte[in.available()];
	        		
	        		in.read(byteBuffer); //(responseBytes);
	        		//String sOutput = new String(responseBytes);
	        		
	        		sb.append(new String( byteBuffer ));

	        	    //for (byte b : byteBuffer) {
	        	    //    sb.append(  );
	        	    //}
	        	    //System.out.println(sb.toString());
				}
				
			}

			//System.out.println("Overall message is:" + input);
			//out.println("Overall message is:" + input);

			//server.close();
		} catch (IOException ioe) {
			System.out.println("IOException on socket listen: " + ioe);
			ioe.printStackTrace();
		}
	}
}


