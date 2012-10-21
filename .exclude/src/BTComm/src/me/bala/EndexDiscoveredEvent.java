package me.bala;

import java.util.EventObject;

import javax.bluetooth.RemoteDevice;

public class EndexDiscoveredEvent extends EventObject{
	private String message;
	private RemoteDevice _rd;
	private String _address;
	
	public EndexDiscoveredEvent(Object source, RemoteDevice rd, String address){
		super(source);
		_rd = rd;
		_address = address;
	}
	public RemoteDevice getRemoteDevice(){
		return _rd;
	}
	
	public String getAddress(){
		return _address;
	}
	
}
