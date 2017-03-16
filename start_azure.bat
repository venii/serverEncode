@echo OFF
start cmd.exe /k "node %cd%jsmpeg-master/websocket-relay.js 1234 8081 8082"
start cmd.exe /k "gulp serve"
start cmd.exe /k "cd C:\Program Files (x86)\Icecast KH && icecast.exe -c icecast.xml"
