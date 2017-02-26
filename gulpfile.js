var gulp = require('gulp');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify'); 
var cleanCSS = require('gulp-clean-css');


var paths = {
  sass: ['./scss/**/*.scss']
};
/*
gulp.task('default', ['sass']);

gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

*/

var jsFiles = [	
				'www/lib/ionic/js/ionic.bundle.js',
                'www/lib/ionic-platform-web-client/dist/ionic.io.bundle.min.js',
                'www/lib/ngCordova/dist/ng-cordova.min.js',
                'www/lib/ionic-date-picker/ionic-datepicker.bundle.min.js',
                'www/lib/angular-moment/moment.js',
                'www/lib/angular-moment/angular-moment.js',
				'www/lib/angular-svg-round-progressbar/build/roundProgress.min.js',
              'www/lib/highcharts/highcharts.src.js',
                'www/lib/highcharts/highcharts-ng.min.js'                                
				];
				
var jsDest = 'www/js';

gulp.task('minifyjs', function() {  
    return gulp.src(jsFiles, {base: 'www/'})
        .pipe(concat('libaries.js'))
        .pipe(rename('libraries.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(jsDest));
});




var cssFiles = ['www/lib/lato.css',
		'www/lib/ionic/css/ionic.min.css'			
				];
				
var cssDest = 'www/css';				
				
gulp.task('minifycss', function() {
  return gulp.src(cssFiles, {base: 'www/'})
	.pipe(concat('libaries.css'))
	.pipe(rename('libraries.min.css'))
    .pipe(cleanCSS())
    .pipe(gulp.dest(cssDest));
});


