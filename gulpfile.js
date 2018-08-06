const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const gm = require('gulp-gm');
const injectCSS = require('gulp-inject-css');

gulp.task('default', () => {
	// TODO Break these up into their own tasks
	gulp.src('img/src/*')
		.pipe(imagemin([
			imagemin.jpegtran({progressive: true})
		]))
		.pipe(gulp.dest('img/dist'))

	gulp.src('img/src/*')
		.pipe(gm(function(gmfile) {
			return gmfile.resize(5, 5);
		}, {imageMagick: true}))
		.pipe(gulp.dest('img/dist/small'));

	gulp.src('img/src/*')
		.pipe(gm(function(gmfile) {
			return gmfile.resize(5, 5);
		}, {imageMagick: true}))
		.pipe(webp())
		.pipe(gulp.dest('img/dist/small/webp'));


	gulp.src('img/src/*')
		.pipe(webp())
		.pipe(gulp.dest('img/dist/webp'))

	return gulp.src('src/*.html')
		.pipe(injectCSS())
		.pipe(gulp.dest('.'));
});
