package me.bala;

import java.util.EventObject;

import javax.bluetooth.RemoteDevice;



public class ConnectionErrorEvent extends EventObject{

	public ConnectionErrorEvent(Object source){
		super(source);
	}
	
}
