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
http://rtec.westus.cloudapp.azure.com:81/abre_relay?idCamera=1&portaInicial=8081&portaFinal=8082&secret=1234


abre encode

http://rtec.westus.cloudapp.azure.com:81/encode_video?idCamera=1&secret=1234&portaUsar=8081&rtsp=w3host.no-ip.org:9010/Streaming/Channels/2
ou
http://rtec.westus.cloudapp.azure.com:81/encode_video?idCamera=1&secret=1234&portaUsar=8081&rtsp=w3host.no-ip.org:9009/11


usar endereço para abrir com jsmpeg utilizando ws


http://rtec.westus.cloudapp.azure.com:81/relay?idCamera=2&portaInicial=8083&portaFinal=8084&secret=1234

http://rtec.westus.cloudapp.azure.com:81/encode?idCamera=2&secret=1234&portaUsar=8083&rtsp=w3host.no-ip.org:9009/11

