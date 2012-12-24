#!/bin/bash
#DIR=$( cd "$( dirname "$0" )" && pwd )
#export DYLD_LIBRARY_PATH=$DIR
#echo $DIR
echo "performing bluetooth configuration..."

#cp /System/Library/Frameworks/IOBluetooth.framework/Versions/A/IOBluetooth /System/Library/Frameworks/IOBluetooth.framework/Versions/A/IOBluetooth_BU

cp /Applications/Treadmill\ Desk.app/Contents/Resources/lib/IOBluetooth /System/Library/Frameworks/IOBluetooth.framework/Versions/A/IOBluetooth

echo "done!"
