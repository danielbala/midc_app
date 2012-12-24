This is a (hopefully temporary) fix to allow  WiimoteWhiteboard [1] to run on
OS X 10.8 "Mountain Lion". *You do not need this* if you use an
earlier version of OS X.

Please run "WiimoteWhiteboard.command" instead of starting WiimoteWhiteboard
directly (from the Dock or the Applications folder) as you'd normally do.
WiimoteWhiteboard.command is a shell script that will start the regular
WiimoteWhiteboard application (via the Terminal).

You can put this script anywhere you want, but it is important that is
in the same folder as the file "IOBluetooth". For convenience, the script
can also be put in right area of the Dock (where the Trash and folders are),
and can be launched by clicking on it.

[1]: http://www.uweschmidt.org/wiimote-whiteboard