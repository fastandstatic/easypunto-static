import { exec } from "child_process"

import gulp from "gulp"
import concat from "gulp-concat"
import * as rollup from "rollup"
import rollupConfig from "../../rollup.config.mjs"
//import { argv } from 'yargs/yargs';
import { hideBin } from "yargs/helpers"
import yargs from "yargs/yargs"

import "./lite.js"

gulp.task("gutenberg", function (done) {
  exec(
    "npx cross-env BABEL_ENV=default NODE_ENV=production webpack",
    function (err, stdout, stderr) {
      console.log(stdout)
      console.log(stderr)
      done(err)
    },
  )
})

gulp.task("hbsToHtml", function () {
  return gulp
    .src(["js/mapsvg/FormBuilder/FormElements/**/*.hbs"])
    .pipe(concat("form-builder.html"))
    .pipe(gulp.dest("dist"))
})

gulp.task("rollup", () => {
  return rollup.rollup(rollupConfig[0]).then((bundle) => {
    return bundle.write(rollupConfig[0].output)
  })
})

gulp.task("build", function (cb) {
  const argv = yargs(hideBin(process.argv)).argv
  const buildLite = argv.lite === true

  const tasks = buildLite
    ? gulp.series(gulp.parallel("gutenberg", "hbsToHtml", "rollup"), "prepare-lite", "build-lite")
    : gulp.parallel("gutenberg", "hbsToHtml", "rollup")

  return tasks(cb)
})
