const gulp = require('gulp');
const rename = require('gulp-rename');
const browserSync = require('browser-sync').create();
const fs = require('fs');

gulp.task('serve', function () {
    browserSync.init({
        server: "."
    });
    gulp.watch("*.html").on('change', browserSync.reload);
    gulp.watch("css/*.css").on('change', browserSync.reload);
    gulp.watch("js/*.js").on('change', browserSync.reload);
});


gulp.task('default', gulp.series('serve'));
