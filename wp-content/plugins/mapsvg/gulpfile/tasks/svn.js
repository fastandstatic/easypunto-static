import { exec } from "child_process"
import fs from "fs"
import gulp from "gulp"
import path from "path"
import { LITE_PATH, SVN_PATH, SVN_TRUNK_PATH, handleTerminalOutput } from "../utils/paths.js"

const excludeDirs = [".svn", "node_modules", "gulpfile", "gulpfile.js"]

// Task to sync files from project to SVN working copy
function copyFiles(done) {
  const excludeOptions = excludeDirs.map((dir) => `--exclude='${dir}'`).join(" ")
  exec(
    `rsync -av --delete ${excludeOptions} "${LITE_PATH}/" "${SVN_TRUNK_PATH}/"`,
    { maxBuffer: 1024 * 1024 * 10 }, // 10MB buffer
    (err, stdout, stderr) => {
      handleTerminalOutput(err, stdout, stderr)
      done()
    },
  )
}

// Task to delete missing files from SVN
function deleteMissingFiles(done) {
  const deleteCommand = `
    cd "${SVN_PATH}" &&
    svn status | grep '^!' | awk '{print $2}' | sed 's/@/\\\\@/g' | xargs -I {} svn delete --force "{}"
  `
  exec(deleteCommand, (err, stdout, stderr) => {
    handleTerminalOutput(err, stdout, stderr)
    done()
  })
}

// Task to add and commit changes in SVN
function commitChanges(done) {
  const commitCommand = `
    cd "${SVN_PATH}" &&
    svn add * --force &&
    svn commit -m "Automated sync of project folder with SVN trunk, including deletions"
  `
  exec(commitCommand, (err, stdout, stderr) => {
    handleTerminalOutput(err, stdout, stderr)
    done()
  })
}

// Task to create a new tag in SVN using the version number from package.json
function tagVersion(done) {
  const packageJson = JSON.parse(fs.readFileSync(path.resolve("package.json"), "utf8"))
  const version = packageJson.version

  const tagCommand = `
    cd "${SVN_PATH}" &&
    svn cp trunk tags/${version} && svn ci -m "Tagging version ${version}"
  `
  exec(tagCommand, (err, stdout, stderr) => {
    handleTerminalOutput(err, stdout, stderr)
    done()
  })
}

gulp.task("svn-copy", copyFiles)
gulp.task("svn-delete", deleteMissingFiles)
gulp.task("svn-commit", commitChanges)
gulp.task("svn-tag", tagVersion)

// Define the main svn-sync task using gulp.series
gulp.task("svn-sync", gulp.series(copyFiles, deleteMissingFiles, commitChanges, tagVersion))
