package me.bala.Socket;

import java.util.EventListener;

public interface SocketMessageListener extends EventListener {
    public void MessageReceived(SocketMessageEvent evt);
}

