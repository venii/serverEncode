
var fs = require("fs");
var port = 81;
var express = require("express");
var cors = require('cors');
var app = express();
app.use(express.static(__dirname + "/public")); //use static files in ROOT/public folder
app.options('*', cors());

var audioEncoder   = {};
var encoder        = {};
var processos      = {};
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
    
    if(!request.param('idCamera')){
      response.json({ error:'falta o parametro idCamera.'});    
      return;
    }

    var port_start_in    = 8001;
    var port_start_out   = 8002;
    var distancia_portas = 2;

    if(portas.length == 0){
        response.json({ portaUsarRelay:port_start_in,
                        portaUsarWs:port_start_out});
        return;
    }else{

        var portasIndices = Object.keys(portas_abertas);
        var portasUsadas = new Array;

        for(i in portasIndices){
          var porta = portas_abertas[portasIndices[i]];
          if(porta == request.param('idCamera')){
            portasUsadas.push(portasIndices[i]);
          }
        }

        if(portasUsadas.length == 0){
          var iPF = portas.splice(-1,1)[0];
          var iPI = portas.splice(-1,1)[0];
          
          var novaPortaI = parseInt(iPI)+distancia_portas;
          var novaPortaF = parseInt(iPF)+distancia_portas;
       
        }else{
          novaPortaI = portasUsadas[0];
          novaPortaF = portasUsadas[1];
        }

        response.json({ portaUsarRelay:novaPortaI,
                        portaUsarWs :novaPortaF});
        return;

    }
    
});

app.get("/abre_relay", function(request, response){ //root dir
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
    

    //SE O PROCESSO JA ESTIVER FUNCIONANDO
    if(processos[request.param('idCamera')]){
        var portasIndices = Object.keys(portas_abertas);
        var portasUsadas = new Array;

        for(i in portasIndices){
          var porta = portas_abertas[portasIndices[i]];
          if(porta == request.param('idCamera')){
            portasUsadas.push(portasIndices[i]);
          }
        }

        hostSemPorta = request.headers.host.split(":")[0];
        portalReal = portasUsadas[1];

        if(request.param('rtsp') ){
          if(!encoder[request.param('idCamera')]){

              var rtsp_transport = 'tcp';
              if(request.param('rtsp_transport')){
                rtsp_transport = request.param('rtsp_transport');
              }

              var childProcess = require('child_process');
              paramEncoderVideo(rtsp_transport,request.param('rtsp'),request.param('portaUsarRelay'),request.param('secret'));

              console.log('ffmpeg '+params.join(' '));
              hostSemPorta = request.headers.host.split(":")[0];

              runScript(childProcess,
                        "video",
                        'ffmpeg',
                        request.param('idCamera'),
                        params,
                  function(idCamera){
                      
                      response.json({ idCamera  : idCamera,
                                      portaUsar : request.param('portaUsar'),
                                      wsVideo   : "ws://"+hostSemPorta+":"+request.param('portaUsarWs'),
                                      httpAudio : "http://"+hostSemPorta+":8000"+"/camera_"+idCamera+".mp3",
                                      reencoded : true
                                    });

                  }, 
                  function (err) {
                      console.log('Error:',err);
              });  
          }else{
            response.json({ error    : 'relay já aberto para esta camera.',
                            wsVideo  : "ws://"+hostSemPorta+":"+portalReal,
                            httpAudio: "http://"+hostSemPorta+":8000"+"/camera_"+request.param('idCamera')+".mp3"
                          });
            return;
          }
        }else{
          response.json({ error    :'relay já aberto para esta camera.',
                          wsVideo  : "ws://"+hostSemPorta+":"+portalReal,
                          httpAudio: "http://"+hostSemPorta+":8000"+"/camera_"+request.param('idCamera')+".mp3"
                        });
          return;

        }

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

    var rtsp_transport = 'tcp';
    if(request.param('rtsp_transport')){
      rtsp_transport = request.param('rtsp_transport');
    }

    var childProcess = require('child_process');
    paramEncoderVideo(rtsp_transport,request.param('rtsp'),request.param('portaUsarRelay'),request.param('secret'));

    console.log('use audio?',request.param('audio'));
    if(request.param('audio')){
      if(request.param('audio') == 1){
        var params = params.concat(['-map'    , '0:1',  
                                    '-codec:a','libmp3lame',
                                    '-ab'     ,'64k',
                                    '-ar'     , '44100',
                                    '-ac'     ,  '1',
                                    '-f'      , 'mp3', 
                                    'icecast://camera:camera@localhost:8000/camera_'+request.param('idCamera')+".mp3"
                                    ]);
      }
    }
    console.log('ffmpeg '+params.join(' '));
    
    hostSemPorta = request.headers.host.split(":")[0];

    runScript(childProcess,
              "video",
              'ffmpeg',
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

app.get("/status_relay", function(request, response){
  if(!request.param('idCamera')){
    response.json({ error:'falta o parametro idCamera.'});
    return;
  }
  try{

    response.json({ idCamera:request.param('idCamera'),
                    statusTrasmissao:processos[request.param('idCamera')].statusTrasmissao
                  });
  }catch(ex){
    response.json({ idCamera:request.param('idCamera'),
                    statusTrasmissao:"RELAY_NOT_FOUND",
                   
                  });
  }
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
app.listen(port);

//no evento de sair do webrelay
//fazer o webrealy do jsmpeg enviar sinal para desligar ffmpeg e relay

function runScript(childProcess,tipo,scriptPath,idCamera,params,callbackSucess,callbackError) {

    var invoked = false;
    
    if(tipo == "fork"){
    	var process = childProcess.fork(scriptPath,params);
        processos[idCamera] = process;
        processos[idCamera].statusTrasmissao = "OK";
        
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
            err = "camera relay fechado ("+idCamera+").";

            try{
              processos[idCamera].statusTrasmissao = "FAIL";
            }catch(ex){

            }

            callbackError(err);
        });

        callbackSucess(idCamera);

    }

    if(tipo =="video"){
	      var process = childProcess.execFile(scriptPath,params);
        //var process = childProcess.spawn(scriptPath,params);
      
        if(tipo == "video"){
          encoder[idCamera] = process;
          processos[idCamera].statusTrasmissao = "OK";
        }

        process.stdout.on('data', function(data) {
            if(tipo == "video"){
              processos[idCamera].statusTrasmissao = "OK";
              //console.log('camera video ('+idCamera+'): recebendo video',data);
            }
        });

        process.stderr.on('data', function(data) {
           
            if(tipo == "video"){
              processos[idCamera].statusTrasmissao = "OK";
              console.log('camera video ('+idCamera+'): recebendo video',data);
            }
      
        });

        process.on('close', function() {
            if(tipo == "video"){
              //mata camera
              delete encoder[idCamera];
              //SIGINT processo
              console.log('camera video ('+idCamera+'): desligada');
              
              try{
                processos[idCamera].statusTrasmissao = "FAIL";
              }catch(ex){ 

              }
            }
        });
        callbackSucess(idCamera);
    }

}

function paramEncoderVideo(rtsp_transport,rtsp,portaUsarRelay,secret){
  var params = ['-re',
  '-rtsp_transport',rtsp_transport,
  '-i', 'rtsp://'+rtsp,  
  '-map' , '0:0',  
  '-codec:v','mpeg1video',
  '-b','64k',
  '-s', '340x340', 
  '-r', '24', 
  '-f','mpegts', /*ou mpegts*/
  'http://localhost:'+portaUsarRelay+'/'+secret
  ];
}
