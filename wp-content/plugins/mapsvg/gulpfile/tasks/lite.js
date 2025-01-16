import { exec } from "child_process"
import fs from "fs"

import gulp from "gulp"
import path from "path"
//import { argv } from 'yargs/yargs';
import { Transform } from "stream"
import { hideBin } from "yargs/helpers"
import yargs from "yargs/yargs"
import { LITE_PATH, PRO_PATH, handleTerminalOutput } from "../utils/paths.js"

const plans = [
  {
    name: "lite",
    title: "MapSVG - Vector maps, Image maps, Google Maps",
    removeFeatures: [
      // "support",
      "gleap_auth",
      "common",
      "purchase_code",
      "debug",
      "tokens",
      "directory",
      "filters",
      "zip_search",
      "limit_search_by_country",
      // "distance_search",
      "csv",
      "links",
      "clustering",
      "gallery",
      "data_source_posts",
      "data_source_api",
      "show_another_map",
      "javascript",
      "zip_address_search",
      "marker_upload",
      "templates",
      "css",
    ],
  },
  {
    name: "starter",
    title: "MapSVG Starter - Vector maps, Image maps, Google Maps",
    removeFeatures: [
      "clustering",
      "gallery",
      "data_source_posts",
      "data_source_api",
      "show_another_map",
      "javascript",
      "middleware",
      "acf",
      "metabox",
    ],
  },
  {
    name: "pro",
    title: "MapSVG Pro - Vector maps, Image maps, Google Maps",
    removeFeatures: ["data_source_api", "middleware"],
  },
  {
    name: "elite",
    title: "MapSVG Elite - Vector maps, Image maps, Google Maps",
    removeFeatures: [],
  },
]

const getPlan = () => {
  const argv = yargs(hideBin(process.argv)).argv
  const planName = argv.elite ? "elite" : argv.pro ? "pro" : argv.starter ? "starter" : "lite" // default to 'lite' if not specified
  const currentPlan = plans.find((plan) => plan.name === planName)
  return currentPlan
}

const getPath = (name) => {
  return path.resolve(__dirname, "../../../mapsvg-" + name)
}

// Function to replace features in PHP files
function replaceFeaturesPhpJs(content, featuresToRemove) {
  const regex =
    /(?:\/\/)\s*START\s+(\w+)([\s\S]*?)(?:\/\/\sREPLACE\s*?\S*?([\s\S]*?))?(?:\/\/)\s*END\s*?/g

  return content.replace(regex, (match, featureName, code, replace) => {
    if (featuresToRemove.includes(featureName)) {
      return replace ? replace.replace(/^\s*\/\/\s*/gm, "") : ""
    }
    return match
  })
}

// Function to replace features in HTML/Handlebars files
function replaceFeaturesHTML(content, featuresToRemove) {
  featuresToRemove.forEach((feature) => {
    const htmlRegex = new RegExp(
      `<!--\\s*START\\s*${feature}\\s*-->[\\s\\S]*?<!--\\s*END(?:\\s*REPLACE[\\s\\S]*?)?\\s*-->`,
      "g",
    )

    content = content.replace(htmlRegex, (match) => {
      const replaceMatch = match.match(/<!--\s*END\s*REPLACE([\s\S]*?)-->/)
      if (replaceMatch) {
        // Extract code between END REPLACE and -->
        return replaceMatch[1].trim()
      }
      // If no REPLACE part, keep the original content between START and END
      const originalMatch = match.match(/<!--\s*START[\s\S]*?-->[\s\S]*?<!--\s*END\s*-->/)
      return originalMatch ? originalMatch[0].replace(/<!--[\s\S]*?-->/g, "").trim() : ""
    })
  })

  return content
}

gulp.task("cut-out-premium-features", function (done) {
  const currentPlan = getPlan()
  const PATH = getPath(currentPlan.name)
  const liteFilesToReplace = [
    "**/*.php",
    "**/*.js",
    "**/*.ts",
    "**/*.hbs",
    "**/*.html",
    "!node_modules/**",
    "!js/vendor/**",
    "!vendor/**",
    "!mapsvg2/**",
    "!php/Vendor/**",
  ].map((pattern) => {
    if (pattern.startsWith("!")) {
      return `!${PATH}/${pattern.slice(1)}`
    }
    return `${PATH}/${pattern}`
  })

  return gulp
    .src(liteFilesToReplace)
    .on("data", (file) => console.log(`Matched file: ${file.path}`))
    .pipe(
      new Transform({
        objectMode: true,
        transform(file, enc, callback) {
          if (file.isBuffer()) {
            let content = file.contents.toString()
            if (file.extname === ".php") {
              content = replaceFeaturesPhpJs(content, currentPlan.removeFeatures)
              content = replaceFeaturesHTML(content, currentPlan.removeFeatures)
              // Add this block to change the plugin name
              if (file.path.endsWith("mapsvg.php")) {
                content = content.replace(
                  /Plugin Name: MapSVG Pro/,
                  "Plugin Name: " + currentPlan.title,
                )
                content = content.replace(/Text Domain: mapsvg/, "Text Domain: mapsvg-lite")
                content = content.replace(/\s*Update URI: .*\n?/, "")
              }
            } else if (file.extname === ".js" || file.extname === ".ts") {
              content = replaceFeaturesPhpJs(content, currentPlan.removeFeatures)
            } else if (file.extname === ".hbs" || file.extname === ".html") {
              content = replaceFeaturesHTML(content, currentPlan.removeFeatures)
            }
            console.log(`Writing file: ${file.path}`)
            file.contents = Buffer.from(content)
          }
          callback(null, file)
        },
      }),
    )
    .pipe(gulp.dest(LITE_PATH))
})

gulp.task("lite-npm-build", function (done) {
  const currentPlan = getPlan()
  const PATH = getPath(currentPlan.name)
  exec("pnpm run build", { cwd: PATH }, (error, stdout, stderr) => {
    handleTerminalOutput(error, stdout, stderr)
    console.log("Building complete for mapsvg-lite")
    done()
  })
})

gulp.task("lite-npm-install", function (done) {
  const currentPlan = getPlan()
  const PATH = getPath(currentPlan.name)
  exec("pnpm install", { cwd: PATH }, (error, stdout, stderr) => {
    handleTerminalOutput(error, stdout, stderr)
    console.log("Building complete for mapsvg-lite")
    done()
  })
})

gulp.task("copy-lite-files", function (done) {
  const currentPlan = getPlan()
  const PATH = getPath(currentPlan.name)
  // Check if mapsvg-lite directory exists
  if (fs.existsSync(PATH)) {
    // Delete all contents except node_modules
    fs.readdirSync(PATH).forEach((file) => {
      const currentPath = path.join(LITE_PATH, file)
      if (file !== "node_modules") {
        if (fs.lstatSync(currentPath).isDirectory()) {
          fs.rmSync(currentPath, { recursive: true, force: true })
        } else {
          fs.unlinkSync(currentPath)
        }
      }
    })
  } else {
    // If the directory doesn't exist, create it
    fs.mkdirSync(LITE_PATH)
  }

  // Files to not copy
  // We need to keep gulpfile.js because we need to run pnpm install in the mapsvg-lite directory
  const liteFilesToNotCopy = [
    // Files
    "./api.md",
    "./README.md",
    "./.cursorignore",
    "./.eslintignore",
    "./.eslintrc.json",
    "./.gitignore",
    "./.prettierignore",
    "./.prettierrc.json",
    // "./composer.json",
    // "./composer.lock",
    "./.gitattributes",
    "./.githooks",
    "./.git",
    "./.vscode",
    "./typedoc.json",
    // Folders
    "./clockwork",
    "./dist",
    "./mapsvg2",
    "./tests",
    // "./vendor/composer",
    // "./vendor/guzzlehttp",
    // "./vendor/psr",
    // "./vendor/itsgoingd",
    // "./vendor/psr",
    // "./vendor/ralouphie",
    // "./vendor/symphony",
    // TS files
    "./js/mapsvg/FormBuilder/FormElements/Search",
    "./js/mapsvg/Gallery",
    "./js/mapsvg/Directory",
    "./js/mapsvg-gallery",
    // "./js/mapsvg/MarkerCluster",
    // PHP files
    "./php/Core/LoggerAuth.php",
    //"./php/Core/Logger.php",
    "./php/Core/RemoteRepository.php",
    "./php/Domain/Clockwork",
    "./php/Domain/Logs",
    "./php/Domain/MapV2",
    "./php/Domain/PurchaseCode",
    "./php/Domain/Token",
    "./php/Vendor/plugin-update-checker",
    "./php/Domain/Info",
  ]

  const hiddenFileExceptions = [".htaccess"] // Add any hidden files you want to keep

  // Copy everything except /node_modules
  fs.cpSync(PRO_PATH, PATH, {
    recursive: true,
    filter: (src) => {
      const relativePath = "./" + path.relative(".", src)
      const basename = path.basename(src)
      const isMacSystemFile = basename === ".DS_Store"

      // Skip node_modules entirely in this pass
      if (relativePath === "./node_modules" || relativePath.startsWith("./node_modules/")) {
        return false
      }

      return !liteFilesToNotCopy.some((excluded) => relativePath === excluded) && !isMacSystemFile
    },
  })

  done()
})

gulp.task(
  "build-plan",
  gulp.series("copy-lite-files", "cut-out-premium-features", "lite-npm-install", "lite-npm-build"),
)
