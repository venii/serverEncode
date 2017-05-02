#!/bin/bash
#/etc/init.d/icecast_kh

### BEGIN INIT INFO
# Provides:          name
# Required-Start:    $syslog
# Required-Stop:     $syslog
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: add service
# Description: 
#
### END INIT INFO

# Some things that run always
# sudo nodeDaeminBin.sh /etc/init.d/app_8181
# service app_818 start
# Some things that run always

case "$1" in
  start)
    echo "Starting icecast"
    touch /var/lock/icecast_kh
    sudo icecast -c /home/rtec/serverEncode/icecast_linux.xml &
    ;;
  stop)
    echo " Stopping "
    rm/var/lock/icecast_kh
    sudo pkill -f icecast
    ;;
  status)
   if [ -e /var/lock/icecast_kh ]
   then
        echo "icecast_kh is running"
   else
        echo "icecast_kh is not running"
   fi
   ;;
  *)
    echo "Usage:service icecast_kh{start|stop|status}"
    exit 1
    ;;
esac

exit 0