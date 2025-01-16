import fs from "fs"
import gulp from "gulp"
import upload from "gulp-file-post"
import path from "path"

gulp.task("deploy-zip", function () {
  // Read the version from package.json
  const packageJson = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf8"))
  const version = packageJson.version

  return gulp.src("./dist/wp.mapsvg-latest.zip").pipe(
    upload({
      url: "https://updates.mapsvg.com/",
      data: {
        version: version,
      },
      timeout: 1000000,
    })
      .on("error", function (err) {
        console.log("Upload result: " + err)
      })
      .on("end", function (resp) {
        // console.log("Upload result: "+resp);
      }),
  )
})

gulp.task("deploy", gulp.series("deploy-zip"))
