import { spawn } from "node:child_process";
import { join, resolve } from "node:path";

import {
  applyLocalMigrations,
  localDatabaseEnv,
} from "./local-postgres.mjs";

const projectRoot = resolve(import.meta.dirname, "..");
const nextBin = join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const env = localDatabaseEnv({
  ...process.env,
  NODE_ENV: "development",
});
applyLocalMigrations(env);

const child = spawn(
  process.execPath,
  [nextBin, "dev", "--webpack", "--hostname", "127.0.0.1", "--port", "3000"],
  {
    cwd: projectRoot,
    env,
    stdio: "inherit",
    windowsHide: true,
  },
);

child.once("exit", (code) => process.exit(code ?? 1));
