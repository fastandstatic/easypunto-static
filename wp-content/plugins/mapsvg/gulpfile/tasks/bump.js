import { exec } from "child_process"
import fs from "fs"

import gulp from "gulp"
import path from "path"
//import { argv } from 'yargs/yargs';
import { execSync } from "child_process"
import { hideBin } from "yargs/helpers"
import yargs from "yargs/yargs"
import { PRO_PATH } from "../utils/paths.js"

// Utility function to read JSON file
function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"))
}

// Utility function to write JSON file
function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n")
}

// Utility function to read file as text
function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8")
}

// Utility function to write text to file
function writeFile(filePath, data) {
  fs.writeFileSync(filePath, data)
}

// Utility function to bump version number
function bumpVersion(version, type) {
  const versionParts = version.split(".").map(Number)

  switch (type) {
    case "major":
      versionParts[0] += 1
      versionParts[1] = 0
      versionParts[2] = 0
      break
    case "minor":
      versionParts[1] += 1
      versionParts[2] = 0
      break
    case "patch":
      versionParts[2] += 1
      break
    default:
      throw new Error(`Unknown bump type: ${type}`)
  }

  return versionParts.join(".")
}

gulp.task("bump", function (done) {
  const argv = yargs(hideBin(process.argv)).argv
  const bumpType = argv.minor ? "minor" : argv.major ? "major" : "patch" // default to 'patch' if not specified
  try {
    // Check for uncommitted changes
    execSync("git diff --exit-code")
  } catch (err) {
    console.error(
      "Error: There are uncommitted changes. Please commit or stash them before bumping the version.",
    )
    done()
    return
  }

  const packageJsonPath = path.resolve(PRO_PATH + "/package.json")
  const phpFilePath = path.resolve(PRO_PATH + "/mapsvg.php")
  const readmePath = path.resolve(PRO_PATH + "/README.txt")

  // Read and update package.json
  const packageJson = readJSON(packageJsonPath)
  const oldVersion = packageJson.version
  const newVersion = bumpVersion(oldVersion, bumpType)

  packageJson.version = newVersion
  writeJSON(packageJsonPath, packageJson)

  // Read and update mapsvg.php
  let phpFileContent = readFile(phpFilePath)
  const versionRegex = new RegExp(oldVersion.replace(/\./g, "\\."), "g")
  phpFileContent = phpFileContent.replace(versionRegex, newVersion)
  writeFile(phpFilePath, phpFileContent)

  // Read and update README.txt
  let readmeContent = readFile(readmePath)
  const stableTagRegex = /(Stable tag:\s*)[\d.]+/
  readmeContent = readmeContent.replace(stableTagRegex, `$1${newVersion}`)
  writeFile(readmePath, readmeContent)

  console.log(`Version bumped to ${newVersion}`)

  // Commit, tag, and push the new version using Git
  exec(
    `git commit -am "build: bump version to ${newVersion}" && git tag v${newVersion} && git push origin v${newVersion}`,
    (err, stdout, stderr) => {
      if (err) {
        console.error(`Error executing Git commands: ${stderr}`)
        done(err)
        return
      }
      console.log(stdout)
      done()
    },
  )
})
