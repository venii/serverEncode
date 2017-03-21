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

#

ffmpeg.exe -rtsp_transport tcp -i rtsp://admin:admin@w3host.no-ip.org:9009/11 -qscale:a 15 -qscale:v 20 -s 340x340 -r 24 -b:v 160k -pix_fmt yuv420p -codec:v mpeg1video -f mpegts http://localhost:8081/1234 -f mp3 -vn icecast://camera:camera@localhost:8000/camera_1.mp3 

