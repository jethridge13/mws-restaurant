const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');

gulp.task('default', () => {
	// TODO
	gulp.src('img/src/*')
		.pipe(imagemin([
			imagemin.jpegtran({progressive: true})
		]))
		.pipe(gulp.dest('img/dist'))

	return gulp.src('img/src/*')
		.pipe(webp())
		.pipe(gulp.dest('img/dist/webp'))
});
