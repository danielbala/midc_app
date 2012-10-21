package me.bala;

import java.util.EventListener;


public interface EndexDiscoveredListener extends EventListener {
    public void DeviceDiscovered(EndexDiscoveredEvent evt);
    
}
