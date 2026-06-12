import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  applyLocalMigrations,
  localDatabaseEnv,
} from "./local-postgres.mjs";

const projectRoot = resolve(import.meta.dirname, "..");
const stableBuildDir = resolve(projectRoot, ".next-stable");
const expectedBuildDir = join(projectRoot, ".next-stable");

if (stableBuildDir !== expectedBuildDir) {
  throw new Error("Unexpected build directory.");
}

rmSync(stableBuildDir, { recursive: true, force: true });

const nextBin = join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const env = localDatabaseEnv({
  ...process.env,
  NODE_ENV: "production",
  VOWLY_STABLE: "1",
});
applyLocalMigrations(env);

function runNext(args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [nextBin, ...args], {
      cwd: projectRoot,
      env,
      stdio: "inherit",
      windowsHide: true,
    });

    child.once("error", rejectRun);
    child.once("exit", (code, signal) => {
      if (signal) {
        rejectRun(new Error(`Next.js stopped with signal ${signal}.`));
        return;
      }

      resolveRun(code ?? 1);
    });
  });
}

console.log("Preparing a stable local build without Next.js DevTools...");
const buildCode = await runNext(["build"]);

if (buildCode !== 0) {
  process.exit(buildCode);
}

console.log("Starting Vowly at http://127.0.0.1:3000");
const startCode = await runNext(["start", "--hostname", "127.0.0.1", "--port", "3000"]);
process.exit(startCode);
