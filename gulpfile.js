

var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var exec = require('child_process').exec;



function runCommand(command) {
  return function (cb) {
    exec(command, function (err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      cb(err);

    });
  }
}

var mongoPath = "%cd%\\data";

//Running mongo
//http://stackoverflow.com/a/28048696/46810
gulp.task('start-mongo', runCommand('mongod --dbpath '+mongoPath));
gulp.task('stop-mongo', runCommand('mongo --eval "use admin; db.shutdownServer();"'));

gulp.task('serve', function () {
  
  nodemon({ script: 'app.js'
          , ext: 'html js'
          , ignore: ['ignored.js']
          , tasks: [] })
    .on('restart', function () {
      console.log('restarted!')
    });
})