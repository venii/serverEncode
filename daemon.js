
var fs = require("fs");
var port = 81;
var express = require("express");
var cors = require('cors');
var app = express();
app.use(express.static(__dirname + "/public")); //use static files in ROOT/public folder
app.options('*', cors());

var audioEncoder = {};
var encoder   = {};
var processos = {};
var portas_abertas = {};

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods", "GET, POST","PUT");
  next();

});

app.get("/ultima_porta",function(request,response){
    //http://rtec.westus.cloudapp.azure.com:81/ultima_porta
    var portas = Object.keys(portas_abertas);
    
    var port_start_in   = 8081;
    var port_start_out  = 8082;
    var distancia_portas= 2;

    if(portas.length == 0){
        response.json({ portaUsarRelay:port_start_in,
                        portaUsarWs:port_start_out});
        return;
    }else{
        var iPF = portas.splice(-1,1)[0];
        var iPI = portas.splice(-1,1)[0];
        
        var novaPortaI = parseInt(iPI)+distancia_portas;
        var novaPortaF = parseInt(iPF)+distancia_portas;
        
        response.json({ portaUsarRelay:novaPortaI,
                        portaUsarWs :novaPortaF});
        return;
    }
    
});

app.get("/abre_relay", function(request, response){ //root dir
    var distancia_portas= 2;
    //http://rtec.westus.cloudapp.azure.com:81/abre_relay?idCamera=1&portaUsarRelay=8081&portaUsarWs=8082&secret=1234
    //request.param('portaInicial')
    //request.param('portaFinal')
    //request.param('idCamera')

    if(!request.param('portaUsarRelay')){
      response.json({ error:'falta o parametro portaUsarRelay.'});      
      return;
    }

    if(!request.param('portaUsarWs')){
      response.json({ error:'falta o parametro portaUsarWs.'});    
      return;
    }

    if(!request.param('idCamera')){
      response.json({ error:'falta o parametro idCamera.'});    
      return;
    }

    if(!request.param('secret')){
      response.json({ error:'falta o parametro secret.'});      
      return;
    }
    //previni abrir outros relays
    
    if(processos[request.param('idCamera')]){
        var portasIndices = Object.keys(portas_abertas);
        var portasUsadas = new Array;

        for(i in portasIndices){
          var porta = portas_abertas[portasIndices[i]];
          if(porta == request.param('idCamera')){
            portasUsadas.push(portasIndices[i]);
          }
        }

        portalReal = portasUsadas[1];
        response.json({ error:'relay já aberto para esta camera.',
                        wsVideo: "ws://"+hostSemPorta+":"+portalReal,
                        httpAudio: "http://"+hostSemPorta+":8000"+"/camera_"+request.param('idCamera')+".mp3"
                      });
        return;
    }
            
    if(portas_abertas[request.param('portaUsarRelay')]){
        response.json({ error:'porta inicial ja usada.'});
        return;
    }

    if(portas_abertas[request.param('portaUsarWs')]){
        response.json({ error:'porta final ja usada.'});
        return;
    }

    var childProcess = require('child_process')
    var params = [request.param('secret'),
                  request.param('portaUsarRelay'),
                  request.param('portaUsarWs')];

    runScript(childProcess,"fork",
              './jsmpeg-master/websocket-relay.js',
              request.param('idCamera'),
              params,

        function(idCamera){

          portas_abertas[request.param('portaUsarRelay')] = idCamera;
    	    portas_abertas[request.param('portaUsarWs')]   = idCamera;

          response.json({ idCamera:idCamera, 
                          portaUsarRelay: request.param('portaUsarRelay'),
                          portaUsarWs: request.param('portaUsarWs')});
 
        }, 
        function (err) {
       	 console.log('Error:',err);
	 
    });
    
});

app.get("/fecha_relay", function(request, response){ //root dir
    //http://rtec.westus.cloudapp.azure.com:81/fecha_relay?idCamera=1
    //request.param('idCamera')

    if(!request.param('idCamera')){
      response.json({ error:'falta o parametro idCamera.'});    
      return;
    }

    if(processos[request.param('idCamera')]){
            var childProcess = require('child_process');

            if(encoder[request.param('idCamera')]){
              var pidCamera = encoder[request.param('idCamera')].pid;
              process.kill(pidCamera,'SIGINT');
              
              console.log('PID CAMERA KILL',pidCamera);
              delete encoder[request.param('idCamera')];
            }

            var processo = processos[request.param('idCamera')];
            if(processo){
              process.kill(processo.pid,'SIGINT');
              
              console.log('PID RELAY KILL',processo.pid);
              delete processos[request.param('idCamera')];
              
              var portasIndex = Object.keys(portas_abertas);
              

              for(iPortasDel in portasIndex){
                portaI = portasIndex[iPortasDel];
                
                if(portas_abertas[portaI] == request.param('idCamera')){
                  delete portas_abertas[portaI];
                }
              }

              response.json({ ok:'relay foi fechado.'});
              return;

            }
      }else{
        response.json({ error:'camera não foi achada.'});
      }
            
}); 	

  
app.get("/encode_video", function(request, response){ //root dir
    //http://rtec.westus.cloudapp.azure.com:81/encode_video?idCamera=1&portaUsarRelay=8081&portaUsarWs=8082&rtsp=admin:admin@w3host.no-ip.org:9009/11&secret=1234
    // audio incluso
    //http://rtec.westus.cloudapp.azure.com:81/encode_video?audio=1&idCamera=1&portaUsarRelay=8081&portaUsarWs=8082&rtsp=admin:admin@w3host.no-ip.org:9009/11&secret=1234

    //request.param('rtsp')
    //request.param('idCamera')
    //request.param('portaUsar')

    if(!request.param('rtsp')){
      response.json({ error:'falta o parametro rtsp.'});
      return;
    }

    if(!request.param('idCamera')){
      response.json({ error:'falta o parametro idCamera.'});     
      return;
    }

    if(!request.param('portaUsarRelay')){
      response.json({ error:'falta o parametro portaUsarRelay.'});      
      return;
    }

    if(!request.param('portaUsarWs')){
      response.json({ error:'falta o parametro portaUsarWs.'});      
      return;
    }

    if(!request.param('secret')){
      response.json({ error:'falta o parametro secret.'});    
      return;
    }

    
    if(encoder[request.param('idCamera')]){
      response.json({ error:'esta camera ja esta fazendo streaming.'});    
      return;
    }
    
    if(!processos[request.param('idCamera')]){
      response.json({ error:'voce deve abrir o relay desta camera antes.'});    
      return;
    }
    
    var childProcess = require('child_process');
    var params = ['-an',
                  '-rtsp_transport',
                  'tcp',
                  '-i',
                  'rtsp://'+request.param('rtsp'),  
                  '-an',                 
                  '-codec:v', 
                  'mpeg1video',   
                  '-f',
                  'mpegts',
                  '-s', '340x340', 
                  '-r', '25', 
                  '-b:v', '150k', 
                  '-bf', '0', 
                  '-muxdelay', '0.001', 
                  '-pix_fmt', 'yuv420p',
                  '-an', 
                  'http://localhost:'+request.param('portaUsarRelay')+'/'+request.param('secret')
                  ];

    if(request.param('audio')){
      var params = params.concat([ '-vn',
                                  '-rtsp_transport',
                                  'tcp',
                                  '-i',
                                  'rtsp://'+request.param('rtsp'),  
                                  '-vn',                 
                                  '-ac', 
                                  '2',   
                                  '-ar',
                                  '22050',
                                  '-ab', '100k', 
                                  '-f', 'mp3', 
                                  
                                  'icecast://camera:camera@localhost:8000/camera_'+request.param('idCamera')+".mp3"
                                  ]);
     
    } 
    
    console.log('ffmpeg.exe '+params.join(' '));
    
    hostSemPorta = request.headers.host.split(":")[0];

    runScript(childProcess,
              "video",
              'ffmpeg.exe',
              request.param('idCamera'),
              params,
        function(idCamera){
            response.json({ idCamera:idCamera,
                            portaUsar:request.param('portaUsar'),
                            wsVideo: "ws://"+hostSemPorta+":"+request.param('portaUsarWs'),
                            httpAudio : "http://"+hostSemPorta+":8000"+"/camera_"+idCamera+".mp3"
                          });

        }, 
        function (err) {
            console.log('Error:',err);
    });
    
}); 	

app.get("/fecha_camera", function(request, response){ //root dir
    //http://rtec.westus.cloudapp.azure.com:81?idCamera=1
    
    //request.param('idCamera')
    if(!request.param('idCamera')){
      response.json({ error:'falta o parametro idCamera.'});
      return;
    }
    //previni abrir outros relays
    
    if(encoder[request.param('idCamera')]){
            
      var encodeCam = encoder[request.param('idCamera')]
      process.kill(encodeCam.pid,'SIGINT');
        
      delete encoder[request.param('idCamera')];
      
      response.json({ ok:'camera foi fechada.'});
      return;
    }else{
      response.json({ error:'camera não foi achada.'});
    }
            
    
});  

app.get("/encode_audio", function(request, response){ //root dir
    //http://rtec.westus.cloudapp.azure.com:81/encode_audio?idCamera=1&rtsp=w3host.no-ip.org:9009/11
    //request.param('idCamera')

    if(!request.param('rtsp')){
      response.json({ error:'falta o parametro rtsp.'});
      return;
    }

    if(!request.param('idCamera')){
      response.json({ error:'falta o parametro idCamera.'});     
      return;
    }

    
    if(audioEncoder[request.param('idCamera')]){
      response.json({ error:'audio ja esta sendo streaming.'});    
      return;
    }
    
    var childProcess = require('child_process');
    var params = ['-vn',
                  '-rtsp_transport',
                  'tcp',
                  '-i',
                  'rtsp://'+request.param('rtsp'),  
                  '-vn',                 
                  '-ac', 
                  '2',   
                  '-ar',
                  '22050',
                  '-ab', '100k', 
                  '-f', 'mp3', 
                  
                  'icecast://camera:camera@localhost:8000/camera_'+request.param('idCamera')+".mp3"
                  ];
    
    console.log('ffmpeg.exe '+params.join(' '));
    
    hostSemPorta = request.headers.host.split(":")[0];

    runScript(childProcess,
              "audio",
              'ffmpeg.exe',
              request.param('idCamera'),
              params,
        function(idCamera){
            response.json({ idCamera:idCamera,
                            httpAudio: "http://"+hostSemPorta+":8000"+"/camera_"+idCamera+".mp3"});

        }, 
        function (err) {
            console.log('Error:',err);
    });
    
}); 

app.get("/fecha_audio", function(request, response){ //root dir
    //http://rtec.westus.cloudapp.azure.com:81?idCamera=1
    
    //request.param('idCamera')
    if(!request.param('idCamera')){
      response.json({ error:'falta o parametro idCamera.'});
      return;
    }
    //previni abrir outros relays
    
    if(audioEncoder[request.param('idCamera')]){

        var encodeCam = audioEncoder[request.param('idCamera')]
        process.kill(encodeCam.pid,'SIGINT');
        
        response.json({ ok:'audio foi fechada.'});
        
        delete audioEncoder[request.param('idCamera')];
        return;
    }else{
        response.json({ error:'audio não foi achada.'});
        return;
    }
            
   
});  

app.listen(port);
//no evento de sair do webrelay
//fazer o webrealy do jsmpeg enviar sinal para desligar ffmpeg e relay

function runScript(childProcess,tipo,scriptPath,idCamera,params,callbackSucess,callbackError) {

    var invoked = false;
    
    if(tipo == "fork"){
    	var process = childProcess.fork(scriptPath,params);
        processos[idCamera] = process;

        process.on('error', function (err) {
            if (invoked) 
                return;

            invoked = true;

            callbackError(err);
        });

        // execute the callback once the process has finished running
        process.on('exit', function (code) {
            if (invoked) 
                return;

            invoked = true;

            //var err = code === 0 ? null : new Error('exit code ' + code);
            err = "Fechando processo.";
            callbackError(err);
        });
        callbackSucess(idCamera);
    }

    if(tipo =="video" || tipo == "audio"){
	      //var process = childProcess.execFile(scriptPath,params);
        var process = childProcess.spawn(scriptPath,params);
        
        if(tipo == "video"){
          encoder[idCamera] = process;
        }

        if(tipo == "audio"){
          audioEncoder[idCamera] = process;
        }

        process.stdout.on('data', function(data) {
            //console.log(data);
        });

        process.stderr.on('data', function(data) {
           
            if(tipo == "video")
              console.log('camera video ('+idCamera+'): recebendo video');
            if(tipo == "audio")
              console.log('camera audio ('+idCamera+'): recebendo audio');
        });

        process.on('close', function() {
            if(tipo == "video"){
              //mata camera
              delete encoder[idCamera];
              
              //SIGINT processo
              try{
                if(processos[idCamera]){
                  var pidRelay = processos[idCamera].pid;
                  console.log('PID RELAY',pidRelay);
                  childProcess.kill(pidRelay,'SIGINT');
                }
              }catch(ex){
                console.log("PARANDO RELAY ("+idCamera+")",ex);
              }
              //mata relay
              delete processos[idCamera];
              
              //libera portas
              var portasIndex = Object.keys(portas_abertas);
              
              for(iPortasDel in portasIndex){
                var portaI = portasIndex[iPortasDel];
                
                if(portas_abertas[portaI] == idCamera){
                  delete portas_abertas[portaI];
                }
              }
              console.log('camera video ('+idCamera+'): desligada');
              
            }
            if(tipo == "audio"){
              delete audioEncoder[idCamera];
              
              console.log('camera audio ('+idCamera+'): desligada');
            }
           
        });

        callbackSucess(idCamera);
    }

}

