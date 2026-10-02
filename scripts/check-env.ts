import { loadEnvConfig } from "@next/env";
import { parse } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { WEB_ENV_KEYS, webEnvErrors } from "../lib/env-validation";

loadEnvConfig(process.cwd());
const selectedFile = process.argv.includes("--file")
  ? process.argv[process.argv.indexOf("--file") + 1]
  : existsSync(".env.local") ? ".env.local" : existsSync(".env") ? ".env" : undefined;
if (process.argv.includes("--file") && !selectedFile) throw new Error("Pass a filename after --file");

const excluded = existsSync(".env.yup-exclude")
  ? readFileSync(".env.yup-exclude", "utf8").split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#"))
  : [];
if (selectedFile && excluded.includes(selectedFile.replace(/^\.\//, ""))) {
  console.log(`${selectedFile} is excluded from the local env file check.`);
  process.exit(0);
}

const example = parse(readFileSync(resolve(".env.example")));
const undocumented = WEB_ENV_KEYS.filter((key) => !(key in example));
const values = selectedFile
  ? (existsSync(selectedFile) ? parse(readFileSync(resolve(selectedFile))) : undefined)
  : process.env;
const missingFromFile = selectedFile && values
  ? Object.keys(example).filter((key) => !(key in values))
  : [];
const errors = [
  ...undocumented.map((key) => `${key} is missing from .env.example`),
  ...missingFromFile.map((key) => `${key} is missing from ${selectedFile}`),
  ...(values ? webEnvErrors(values) : [`${selectedFile} does not exist`]),
];
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Environment validated${selectedFile ? `: ${selectedFile}` : " from process variables"}.`);
}
