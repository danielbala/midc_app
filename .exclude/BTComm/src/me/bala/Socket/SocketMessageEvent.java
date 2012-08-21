package me.bala.Socket;

import java.util.EventObject;

public class SocketMessageEvent extends EventObject {

		private String message;
		
		public SocketMessageEvent(Object source){
			super(source);
		}
		
}



