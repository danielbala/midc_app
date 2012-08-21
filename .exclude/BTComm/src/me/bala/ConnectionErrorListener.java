package me.bala;

import java.util.EventListener;

public interface ConnectionErrorListener extends EventListener {
    public void ConnectionError(ConnectionErrorEvent evt);
}
