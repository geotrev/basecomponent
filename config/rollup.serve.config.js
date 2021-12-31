import path from "path"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import replace from "@rollup/plugin-replace"
import babel from "@rollup/plugin-babel"
import serve from "rollup-plugin-serve"
import livereload from "rollup-plugin-livereload"
import findUnused from "rollup-plugin-unused"
import commonjs from "@rollup/plugin-commonjs"

const { ENTRY } = process.env
const dirname = process.cwd()

const TEST_PATH = path.resolve(dirname, ENTRY ? `test/${ENTRY}` : "test")
const SOURCE_PATH = TEST_PATH + "/examples.js"
const OUTPUT_PATH = TEST_PATH + "/bundle.js"

export default {
  input: SOURCE_PATH,
  output: {
    file: OUTPUT_PATH,
    format: "iife",
  },
  plugins: [
    findUnused(),
    babel({ babelHelpers: "bundled", exclude: "node_modules" }),
    nodeResolve(),
    commonjs(),
    livereload({ watch: TEST_PATH }),
    serve({
      open: true,
      contentBase: TEST_PATH,
      historyApiFallback: true,
      host: "localhost",
      port: 3000,
    }),
    replace({
      preventAssignment: true,
      values: { BUILD_ENV: JSON.stringify("development") },
    }),
  ],
}
