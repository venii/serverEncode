
var fs = require("fs");
var port = 81;
var express = require("express");

var app = express();
app.use(express.static(__dirname + "/public")); //use static files in ROOT/public folder

var encoder   = {};
var processos = {};
var portas_abertas = {};



app.get("/ultima_porta",function(request,response){
    var portas = Object.keys(portas_abertas);
    
    var port_start_in   = 8081;
    var port_start_out  = 8082;

    if(portas.lenght == 0){
        response.json({ portaInicial:port_start_in,
                        portaFinal:port_start_out});
        return;
    }else{

        response.json({ portaInicial:processos[portas.lenght-1],
                        portaFinal:processos[portas.lenght-2]});
        return;
    }
    
});

app.get("/relay", function(request, response){ //root dir
    //http://rtec.westus.cloudapp.azure.com:81/encode?idCamera=1&portaUsar=8081&rtsp=admin:admin@w3host.no-ip.org:9009/11&secret=1234

    //request.param('portaInicial')
    //request.param('portaFinal')
    //request.param('idCamera')

    //previni abrir outros relays
    try{
        if(processos[request.param('idCamera')] !== undefined){
            response.json({ error:'relay já aberto para esta camera.'});
            return;
        }
            
    }catch(ex){

    }

    //previni portas
    try{
        if(portas_abertas[request.param('portaInicial')] !== undefined){
            response.json({ error:'porta inicial ja usada.'});
            return;
        }
        if(portas_abertas[request.param('portaFinal')] !== undefined){
            response.json({ error:'porta final ja usada.'});
            return;
        }
    }catch(ex){

    }
    
    var childProcess = require('child_process')
    var params = [request.param('secret'),
                  request.param('portaInicial'),
                  request.param('portaFinal')];

    runScript(childProcess,"fork",
              './jsmpeg-master/websocket-relay.js',
              request.param('idCamera'),
              params,

        function(idCamera){

          portas_abertas[request.param('portaInicial')] = 1;
    	  portas_abertas[request.param('portaFinal')]   = 1;

          response.json({ idCamera:idCamera, 
                          portaUsar:request.param('portaInicial')});

        }, 
        function (err) {
       	 console.log('Error:',err);
	 
    });
    
});

app.get("/fecha_relay", function(request, response){ //root dir
    //http://rtec.westus.cloudapp.azure.com:81?idCamera=1&secret=1234&portaInicial=8081&portaFinal=8082&rtsp=w3host.no-ip.org
    
    //request.param('idCamera')

    //previni abrir outros relays
    try{
        if(processos[request.param('idCamera')] !== undefined){

            processos[request.param('idCamera')].kill('SIGHUP');
            response.json({ ok:'relay foi fechado.'});
            return;
        }else{
            response.json({ error:'camera não foi achada.'});
        }
            
    }catch(ex){
        console.log(ex);
        response.json({ error:'camera não foi achada.'});
    }
}); 	








app.get("/fecha_camera", function(request, response){ //root dir
    //http://rtec.westus.cloudapp.azure.com:81?idCamera=1
    
    //request.param('idCamera')

    //previni abrir outros relays
    try{
        if(encoder[request.param('idCamera')] !== undefined){

            encoder[request.param('idCamera')].kill('SIGHUP');
            response.json({ ok:'relay foi fechado.'});
            return;
        }else{
            response.json({ error:'camera não foi achada.'});
        }
            
    }catch(ex){
        console.log(ex);
        response.json({ error:'camera não foi achada.'});
    }
});     






















app.get("/encode", function(request, response){ //root dir
    //http://rtec.westus.cloudapp.azure.com:81/encode?idCamera=1&portaUsar=8082&rtsp=w3host.no-ip.org:9009/11&secret=1234
    //request.param('rtsp')
    //request.param('idCamera')
    //request.param('portaUsar')
   
    var childProcess = require('child_process');

    var params = ['-re',
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
                  'http://localhost:'+request.param('portaUsar')+'/'+request.param('secret')
                  ];
    
    console.log('ffmpeg.exe '+params.join(' '));

    runScript(childProcess,
              "spawn",
              'ffmpeg.exe',
              request.param('idCamera'),
              params,
        function(idCamera){
            response.json({ idCamera:idCamera,
                            portaUsar:request.param('portaUsar')});

        }, 
        function (err) {
            console.log('Error:',err);
    });
    
}); 	


app.listen(port);

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

            var err = code === 0 ? null : new Error('exit code ' + code);
            
            callbackError(err);
        });
        callbackSucess(idCamera);
    }

    if(tipo =="spawn"){
	    //var process = childProcess.execFile(scriptPath,params);
        var process = childProcess.execFile(scriptPath,params);
        
        encoder[idCamera] = process;
        
        process.stdout.on('data', function(data) {
            //console.log(data);
        });

        process.stderr.on('data', function(data) {
            console.log('camera '+idCamera+': ');
            console.log(data);
        });

        process.on('close', function() {
            console.log('camera desligada: '+idCamera);
        });

        callbackSucess(idCamera);
    }

}