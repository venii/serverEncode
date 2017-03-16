

var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var exec = require('child_process').exec;

gulp.task('serve', function () {
  
  nodemon({ script: 'daemon.js'
          , ext: 'html js'
          , ignore: ['ignored.js']
          , tasks: [] })
    .on('restart', function () {
      console.log('restarted!')
    });
})