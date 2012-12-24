#!/bin/bash
DIR=$( cd "$( dirname "$0" )" && pwd )
export DYLD_LIBRARY_PATH=$DIR
open -F -b org.uweschmidt.wiimote.whiteboard.WiimoteWhiteboard