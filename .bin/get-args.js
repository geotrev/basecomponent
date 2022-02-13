#!/usr/bin/env node

import yargs from "yargs"

export function getArgs() {
  return yargs(process.argv.slice(2))
    .option("target", {
      alias: "t",
      describe: "The semver target.",
    })
    .option("preid", {
      alias: "p",
      describe: "The prerelease id. Overriden by '-n' when publishing.",
    })
    .option("npm-tag", {
      alias: "n",
      describe: "The npm tag. Falls back to preid or 'latest'.",
    })
    .option("dry-run", {
      alias: "d",
      default: false,
      type: "boolean",
      describe: "Prints commands, but doesn't execute them.",
    }).argv
}