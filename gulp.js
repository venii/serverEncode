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


gulp.task('serve', function () {
  
  nodemon({ script: 'daemon.js'
          , ext: 'html js'
          , ignore: ['ignored.js']
          , tasks: [] })
    .on('restart', function () {
      console.log('APP RESTARTED')
    });
})