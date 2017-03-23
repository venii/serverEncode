Abrir portas a serem usadas
colocar o ffmpeg no PATH do sistema para poder usar cmd
dar npm install no dir



instalar ffmpeg
		 icecast versao kh
		 xamp(apache/mysql)
		 nodejs
		 jsmpeg


API 81 SERVER ENCODE

pega porta
http://rtec.westus.cloudapp.azure.com:81/ultima_porta



abre relay
http://rtec.westus.cloudapp.azure.com:81/abre_relay?idCamera=1&portaUsarRelay=8081&portaUsarWs=8082&secret=1234

##
CAMERAS USAR NO PARAM RTSP
app:racional123@w3host.no-ip.org:9010/Streaming/Channels/2
admin:admin@w3host.no-ip.org:9009/11
##
abre encode

http://rtec.westus.cloudapp.azure.com:81/encode_video?idCamera=1&secret=1234&portaUsarRelay=8081&portaUsarWs=8082&rtsp=w3host.no-ip.org:9010/Streaming/Channels/2

ou

http://rtec.westus.cloudapp.azure.com:81/encode_video?idCamera=2&secret=1234&portaUsarRelay=8082&portaUsarWs=8083&rtsp=w3host.no-ip.org:9009/11


ffmpeg.exe -vn -rtsp_transport tcp -i rtsp://admin:admin@w3host.no-ip.org:9009/11 -vn -ac 2 -ar 22050 -ab 100k -f mp3 icecast://camera:camera@localhost:8000/mp3/camera1.mp3



TESTAR input 1 e 2 do encoder 


#TODOS
//NAO USAR MUXING_DELAY

ffmpeg -rtsp_transport tcp -re -i rtsp://admin:admin@w3host.no-ip.org:9009/11 -map 0:0 -vcodec mpeg1video -qscale:v 20 -s 320x320 -b:v 200k -bf 0 -r 25 -f mpegts http://localhost:8081/1234 -map 0:1 -c:a aac -ac 1 -ar 44100 -qscale:a 20 -ab 64k -f mpeg icecast://camera:camera@localhost:8000/camera.mp3




ffmpeg -rtsp_transport tcp -re -i rtsp://w3host.no-ip.org:9009/Streaming/Channels/ -map 0:0 -vcodec mpeg1video -qscale:v 20 -s 320x320 -b:v 200k -bf 0 -r 25 -f mpegts http://localhost:8081/1234 -map 0:1 -c:a aac -ac 1 -ar 44100 -qscale:a 20 -ab 64k -f mpeg icecast://camera:camera@localhost:8000/camera.mp3



#VIDEO
 ffmpeg -stats -report -rtsp_transport tcp -re -i rtsp://admin:admin@w3host.no-ip.org:9009/11 -map 0:0 -vcodec mpeg2 -qscale:v 12 -f mpegts http://localhost:8081/1234 

#AUDIO
 ffmpeg -stats -report -rtsp_transport tcp -re -i rtsp://admin:admin@w3host.no-ip.org:9009/11 -map 0:1 -c:a aac -ac 1 -ar 44100 -qscale:a 20 -ab 64k -f mpeg icecast://camera:camera@localhost:8000/camera.mp3











#audio deo certo
ffmpeg -rtsp_transport tcp -re -i rtsp://192.168.0.36/11 -c:a aac -qscale:a 12 -f mpeg icecast://camera:camera@rtec.westus.cloudapp.azure.com:8000/camera.mp3