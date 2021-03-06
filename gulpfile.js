var gulp = require('gulp');
var less = require('gulp-less');
var browserSync = require('browser-sync').create();
var header = require('gulp-header');
var cleanCSS = require('gulp-clean-css');
var rename = require("gulp-rename");
var uglify = require('gulp-uglify');
var pkg = require('./package.json');
var del = require('del');
var shell = require('gulp-shell');
var runSequence = require('run-sequence');
var chalk = require('chalk');

// destination bucket
var bucket = {
  'name': 'www.benfowler.design',
  'url': "s3://www.benfowler.design"
}

// Set the banner content
var banner = ['/*!\n',
    ' * Start Bootstrap - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
    ' * Copyright 2013-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
    ' * Licensed under <%= pkg.license.type %> (<%= pkg.license.url %>)\n',
    ' */\n',
    ''
].join('');

// ****************************************************************
// Copy over required files to ./www folder and sync with s3 bucket
gulp.task('sync', function(callback) {
  runSequence(
    ['default', 'clean'],
    ['www', 'css', 'js', 'fonts', 'vendor','img'],
    'upload',
    function (error) {
      if (error) {
        //bad
        console.log(chalk.red("Damn damn damn....  " + error));
      }
      else {
        //good
        console.log(chalk.green("All Done!"));
      }
    });
});
gulp.task('clean', function () {
  return del(['./www']).then(paths => {
    console.log('Deleted : ', paths.join('\n'));
  });
});
gulp.task('css', function () {
  return gulp.src('./css/**/*.min.css')
    .pipe(gulp.dest('./www/css'))
});
gulp.task('img', function () {
  return gulp.src('./img/**/*')
    .pipe(gulp.dest('./www/img'))
});
gulp.task('www', function () {
  return gulp.src('./index.html')
    .pipe(gulp.dest('./www'))
});
gulp.task('js', function () {
  return gulp.src('./js/**/*.min.js')
    .pipe(gulp.dest('./www/js'))
});
gulp.task('vendor', function () {
  return gulp.src('./vendor/**/*')
    .pipe(gulp.dest('./www/vendor'))
});
gulp.task('fonts', function () {
  return gulp.src('./fonts/**/*')
    .pipe(gulp.dest('./www/fonts'))
});
gulp.task('upload', function () {
  return gulp.src('./www', {read: false})
    .pipe(shell([
      'aws s3 sync <%= file.path %> <%= bucket() %>'
    ], {
      templateData: {
        bucket: function () {
          return bucket.url;
        }
      }
    }))
});
// ****************************************************************



// Compile LESS files from /less into /css
gulp.task('less', function() {
    return gulp.src('less/grayscale.less')
        .pipe(less())
        // .pipe(header(banner, { pkg: pkg }))
        .pipe(gulp.dest('css'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Minify compiled CSS
gulp.task('minify-css', ['less'], function() {
    return gulp.src('css/grayscale.css')
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('css'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Minify JS
gulp.task('minify-js', function() {
    return gulp.src('js/grayscale.js')
        .pipe(uglify())
        // .pipe(header(banner, { pkg: pkg }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('js'))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// Copy vendor libraries from /node_modules into /vendor
gulp.task('copy', function() {
    gulp.src(['node_modules/bootstrap/dist/**/*', '!**/npm.js', '!**/bootstrap-theme.*', '!**/*.map'])
        .pipe(gulp.dest('vendor/bootstrap'))

    gulp.src(['node_modules/jquery/dist/jquery.js', 'node_modules/jquery/dist/jquery.min.js'])
        .pipe(gulp.dest('vendor/jquery'))

    gulp.src([
            'node_modules/font-awesome/**',
            '!node_modules/font-awesome/**/*.map',
            '!node_modules/font-awesome/.npmignore',
            '!node_modules/font-awesome/*.txt',
            '!node_modules/font-awesome/*.md',
            '!node_modules/font-awesome/*.json'
        ])
        .pipe(gulp.dest('vendor/font-awesome'))
})

// Run everything
gulp.task('default', ['less', 'minify-css', 'minify-js', 'copy']);

// Configure the browserSync task
gulp.task('browserSync', function() {
    browserSync.init({
        server: {
            baseDir: ''
        },
    })
})

// Dev task with browserSync
gulp.task('dev', ['browserSync', 'less', 'minify-css', 'minify-js'], function() {
    gulp.watch('less/*.less', ['less']);
    gulp.watch('css/*.css', ['minify-css']);
    gulp.watch('js/*.js', ['minify-js']);
    // Reloads the browser whenever HTML or JS files change
    gulp.watch('*.html', browserSync.reload);
    gulp.watch('js/**/*.js', browserSync.reload);
});
