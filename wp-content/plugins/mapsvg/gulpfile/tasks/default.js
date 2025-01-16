import gulp from "gulp"
import gulpSass from "gulp-sass"
import * as sassModule from "sass"

const sass = gulpSass(sassModule)

gulp.task("sass", function (cb) {
  gulp
    .src("*.scss")
    .pipe(sass())
    .pipe(
      gulp.dest(function (f) {
        return f.base
      }),
    )
  cb()
})

gulp.task(
  "default",
  gulp.series("sass", function (cb) {
    gulp.watch("*.scss", gulp.series("sass"))
    cb()
  }),
)
