
const autoprefixer = require('gulp-autoprefixer');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const cache = require('gulp-cache');
const cssnano = require('gulp-cssnano');
const del = require('del');
const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const livereload = require('gulp-livereload');
const notify = require('gulp-notify');
const path = require('path');
const rename = require('gulp-rename');
const sass = require('gulp-sass');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');

// Styles
gulp.task('styles', function() {
  return gulp.src('public/stylesheets/main.scss')
    .pipe(sass())
    .pipe(autoprefixer('last 2 version'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(cssnano())
    .pipe(gulp.dest('dist/stylesheets'))
    .pipe(notify({ message: 'Styles task complete', onLast: true }));
});

// Scripts
gulp.task('scripts', function() {
  var b = browserify({
    entries: './public/javascripts/main.js',
    debug: !gulp.env.production,
    paths: [
      path.join(__dirname, 'node_modules')
    ]
    // transform: [reactify]
  }).transform('babelify', {
    presets: ['es2015']
  });

  return b.bundle()
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist/javascripts'))
    .pipe(notify({ message: 'Scripts task complete', onLast: true }));
});

// Images
gulp.task('images', function() {
  return gulp.src('public/images/**/*')
    .pipe(cache(imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('dist/images'))
    .pipe(notify({ message: 'Images task complete', onLast: true }));
});

// Clean
gulp.task('clean', function() {
  return del(['dist/styles', 'dist/scripts', 'dist/images']);
});

// Default task
gulp.task('default', ['clean'], function() {
  gulp.start('styles', 'scripts', 'images');
});

// Watch
gulp.task('watch', ['default'], function() {
  // Watch .scss files
  gulp.watch('public/stylesheets/**/*.scss', ['styles']);
  // Watch .js files
  gulp.watch('public/javascripts/**/*.js', ['scripts']);
  // Watch image files
  gulp.watch('public/images/**/*', ['images']);
  // Create LiveReload server
  livereload.listen();
  // Watch any files in dist/, reload on change
  gulp.watch(['dist/**']).on('change', livereload.changed);
});
