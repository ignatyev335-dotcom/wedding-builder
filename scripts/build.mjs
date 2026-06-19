import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";

import { localDatabaseEnv } from "./local-postgres.mjs";

const projectRoot = resolve(import.meta.dirname, "..");
const prismaBin = join(projectRoot, "node_modules", "prisma", "build", "index.js");
const nextBin = join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const encodingCheckScript = join(projectRoot, "scripts", "check-encoding.mjs");

const env =
  process.env.VERCEL || process.env.CI
    ? { ...process.env }
    : localDatabaseEnv({
        ...process.env,
        NODE_ENV: "production",
      });

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env,
    stdio: "inherit",
    windowsHide: true,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(process.execPath, [encodingCheckScript]);
run(process.execPath, [prismaBin, "generate"]);
run(process.execPath, [prismaBin, "migrate", "deploy"]);
run(process.execPath, [nextBin, "build"]);
