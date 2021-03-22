const { src, dest, parallel } = require('gulp')
const pug = require('gulp-pug')
const minifyCSS = require('gulp-csso')
const concat = require('gulp-concat')
const data = require('gulp-data')
var locals = require('./localsPug.js')

function html() {
  return src('src/*.pug')
    .pipe(data(locals))
    .pipe(pug())
    .pipe(dest('build/'))
}

function css() {
  return src('src/style/*.css')
    .pipe(concat('style.css'))
    .pipe(minifyCSS())
    .pipe(dest('build/'))
}

exports.css = css;
exports.html = html;
exports.default = parallel(html, css);
