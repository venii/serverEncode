#!/bin/bash
#/etc/init.d/app_8181

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
    echo "Starting app_node_8181 "
    touch /var/lock/app_node_8181
    cd /home/rtec/serverEncode
    sudo node daemon.js &
    ;;
  stop)
    echo " Stopping "
    rm/var/lock/app_node_8181
    sudo pkill -f node
    ;;
  status)
   if [ -e /var/lock/app_node_8181 ]
   then
        echo "app_node_8181 is running"
   else
        echo "app_node_8181 is not running"
   fi
   ;;
  *)
    echo "Usage:service app_node_8181{start|stop|status}"
    exit 1
    ;;
esac

exit 0