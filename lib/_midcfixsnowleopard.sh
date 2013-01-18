#!/bin/bash
DIR=$( cd "$( dirname "$0" )" && pwd )

echo "performing bluetooth configuration..."
while sleep 5; do
    
    export DYLD_LIBRARY_PATH=$DIR
    open /Applications/Treadmill\ Desk.app
    
    echo $DIR
    
    echo $DYLD_LIBRARY_PATH
    
    echo "done!"
    
#    osascript -e 'tell application "Terminal" to quit'
    
    exit 0     
   
done