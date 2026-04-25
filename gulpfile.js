'use strict';

const gulp        = require('gulp');
const sass        = require('gulp-sass')(require('sass'));
const pug         = require('gulp-pug');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS    = require('gulp-clean-css');
const uglify      = require('gulp-uglify');
const rename      = require('gulp-rename');
const sourcemaps  = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const plumber     = require('gulp-plumber');
const notify      = require('gulp-notify');
const del         = require('del');

// ─────────────────────────────────────────────
// RUTAS
// ─────────────────────────────────────────────
const paths = {
  pug: {
    src:   'src/pages/**/*.pug',
    watch: 'src/**/*.pug',
    dest:  'dist/'
  },
  scss: {
    src:   'src/styles/styles.scss',
    watch: 'src/components/**/*.scss',
    dest:  'dist/assets/css/'
  },
  js: {
    src:   'src/assets/js/**/*.js',
    dest:  'dist/assets/js/'
  },
  images: {
    src:   'src/assets/images/**/*.{jpg,jpeg,png,svg,gif,webp}',
    dest:  'dist/assets/img/'
  },
  fonts: {
    src:   'src/assets/fonts/**/*',
    dest:  'dist/assets/fonts/'
  }
};

// ─────────────────────────────────────────────
// MANEJO DE ERRORES (no rompe el watch)
// ─────────────────────────────────────────────
function onError(taskName) {
  return plumber({
    errorHandler: notify.onError({
      title:   `Error en ${taskName}`,
      message: '<%= error.message %>'
    })
  });
}

// ─────────────────────────────────────────────
// LIMPIAR dist/
// ─────────────────────────────────────────────
function clean() {
  return del(['dist/']);
}

// ─────────────────────────────────────────────
// PUG → HTML
// ─────────────────────────────────────────────
function compilePug() {
  return gulp
    .src(paths.pug.src)
    .pipe(onError('Pug'))
    .pipe(pug({ pretty: true }))
    .pipe(gulp.dest(paths.pug.dest))
    .pipe(browserSync.stream());
}

// ─────────────────────────────────────────────
// SCSS → CSS
// ─────────────────────────────────────────────
function compileSCSS() {
  return gulp
    .src(paths.scss.src)
    .pipe(onError('SCSS'))
    .pipe(sourcemaps.init())
    .pipe(sass({ outputStyle: 'expanded' }))
    .pipe(autoprefixer({ cascade: false }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.scss.dest))
    .pipe(browserSync.stream());
}

// ─────────────────────────────────────────────
// SCSS → CSS minificado para producción
// ─────────────────────────────────────────────
function compileSCSSProd() {
  return gulp
    .src(paths.scss.src)
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(autoprefixer({ cascade: false }))
    .pipe(cleanCSS({ level: 2 }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(paths.scss.dest));
}

// ─────────────────────────────────────────────
// JS (concatenar + minificar para prod)
// ─────────────────────────────────────────────
function compileJS() {
  return gulp
    .src(paths.js.src)
    .pipe(onError('JS'))
    .pipe(gulp.dest(paths.js.dest))
    .pipe(browserSync.stream());
}

function compileJSProd() {
  return gulp
    .src(paths.js.src)
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(paths.js.dest));
}

// ─────────────────────────────────────────────
// FUENTES (copiar sin modificar)
// ─────────────────────────────────────────────
function copyFonts() {
  return gulp
    .src(paths.fonts.src)
    .pipe(gulp.dest(paths.fonts.dest));
}

// ─────────────────────────────────────────────
// SERVIDOR LOCAL con BrowserSync
// ─────────────────────────────────────────────
function serve() {
  browserSync.init({
    server: { baseDir: 'dist/' },
    port:   3000,
    open:   true,
    notify: false
  });

  gulp.watch(paths.pug.watch,   compilePug);
  gulp.watch(paths.scss.watch,  compileSCSS);
  gulp.watch(paths.js.src,      compileJS);
}

// ─────────────────────────────────────────────
// TAREAS EXPORTADAS
// ─────────────────────────────────────────────

// gulp             → desarrollo con watch + BrowserSync
// gulp build       → compilación completa sin servidor
// gulp prod        → build optimizado para producción (minificado)

const dev = gulp.series(
  clean,
  gulp.parallel(compilePug, compileSCSS, compileJS, copyFonts),
  serve
);

const build = gulp.series(
  clean,
  gulp.parallel(compilePug, compileSCSS, compileJS, copyFonts)
);

const prod = gulp.series(
  clean,
  gulp.parallel(compilePug, compileSCSSProd, compileJSProd, copyFonts)
);

exports.default      = dev;
exports.build        = build;
exports.prod         = prod;
exports.clean        = clean;
exports.pug          = compilePug;
exports.scss         = compileSCSS;
exports.js           = compileJS;
