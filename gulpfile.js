const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const gm = require('gulp-gm');
const injectCSS = require('gulp-inject-css');
const watch = require('gulp-watch');

const imageMinFunction = () => {
	gulp.src('img/src/*')
		.pipe(imagemin([
			imagemin.jpegtran({progressive: true})
		]))
		.pipe(gulp.dest('img/dist'))
}

const gmFunction = () => {
	gulp.src('img/src/*')
		.pipe(gm(function(gmfile) {
			return gmfile.resize(5, 5);
		}, {imageMagick: true}))
		.pipe(gulp.dest('img/dist/small'));
}

const gmWebpFunction = () => {
	gulp.src('img/src/*')
		.pipe(gm(function(gmfile) {
			return gmfile.resize(5, 5);
		}, {imageMagick: true}))
		.pipe(webp())
		.pipe(gulp.dest('img/dist/small/webp'));
}

const webpFunction = () => {
	gulp.src('img/src/*')
		.pipe(webp())
		.pipe(gulp.dest('img/dist/webp'))
}

const injectCSSFunction = () => {
	gulp.src('src/*.html')
		.pipe(injectCSS())
		.pipe(gulp.dest('.'));
}

gulp.task('default', () => {
	return new Promise((resolve, reject) => {
		imageMinFunction();
		gmFunction();
		gmWebpFunction();
		webpFunction();
		injectCSSFunction();
		resolve();
	});
});

gulp.task('html', () => {
	return watch(['src/*', 'src/css/*'], () => {
		injectCSSFunction();
	});
});
