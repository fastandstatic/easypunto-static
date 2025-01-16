import path from "path"
import { fileURLToPath } from "url"

// Define paths
// Get the current directory of this file
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Define paths using absolute paths
export const PRO_PATH = path.resolve(__dirname, "../../")
export const LITE_PATH = path.resolve(__dirname, "../../../mapsvg-lite")
export const SVN_PATH = path.resolve(__dirname, "../../../mapsvg-lite-interactive-vector-maps")
export const SVN_TRUNK_PATH = path.join(SVN_PATH, "trunk")

export const handleTerminalOutput = (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`)
  }
  console.log(stdout)
  if (stderr) {
    console.error(`stderr: ${stderr}`)
  }
}
