#!/bin/bash
DIR=$( cd "$( dirname "$0" )" && pwd )
export DYLD_LIBRARY_PATH=$DIR
echo $DYLD_LIBRARY_PATH
open /Applications/Treadmill\ Desk.app
exit 0