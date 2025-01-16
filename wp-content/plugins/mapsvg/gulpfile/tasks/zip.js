import gulp from "gulp"
import zip from "gulp-zip"
//import { argv } from 'yargs/yargs';

gulp.task("mapsvg_zip", function () {
  return gulp
    .src(
      [
        "./**",
        "!.git",
        "!./.git",
        "!.githooks",
        "!./dist/wp.mapsvg*",
        "!.eslintignore",
        "!.gitignore",
        "!.prettierignore",
        "!./clockwork/*",
        "!./{node_modules,node_modules/**}",
        "!./{tests,tests/**}/",
        "!./gulpfile.js",
      ],
      { base: "../", encoding: false },
    )
    .pipe(zip("wp.mapsvg-latest.zip"))
    .pipe(gulp.dest("./dist"))
})
