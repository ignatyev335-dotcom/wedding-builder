import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const projectRoot = resolve(import.meta.dirname, "..");
const dataDir = join(projectRoot, ".local-postgres");
const port = 55432;
const databaseUrl = `postgresql://vowly@127.0.0.1:${port}/wedding_builder?schema=public`;

function postgresBin(name) {
  const root = "C:\\Program Files\\PostgreSQL\\18\\bin";
  const candidate = join(root, `${name}.exe`);
  return existsSync(candidate) ? candidate : name;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    windowsHide: true,
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `${command} failed`);
  }
  return result.stdout;
}

function isReady() {
  return (
    spawnSync(
      postgresBin("pg_isready"),
      ["-h", "127.0.0.1", "-p", String(port)],
      { windowsHide: true, stdio: "ignore" },
    ).status === 0
  );
}

function waitForReady() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (isReady()) return;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
  }
  throw new Error("Local PostgreSQL did not become ready in time.");
}

export function ensureLocalPostgres() {
  if (process.platform !== "win32") {
    return null;
  }

  if (!existsSync(join(dataDir, "PG_VERSION"))) {
    mkdirSync(dataDir, { recursive: true });
    run(postgresBin("initdb"), [
      "-D",
      dataDir,
      "-U",
      "vowly",
      "--auth=trust",
      "--encoding=UTF8",
      "--no-locale",
    ]);
  }

  if (!isReady()) {
    const server = spawn(
      postgresBin("postgres"),
      ["-D", dataDir, "-h", "127.0.0.1", "-p", String(port)],
      {
        cwd: projectRoot,
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      },
    );
    server.unref();
    waitForReady();
  }

  const databases = run(postgresBin("psql"), [
    "-h",
    "127.0.0.1",
    "-p",
    String(port),
    "-U",
    "vowly",
    "-d",
    "postgres",
    "-tAc",
    "SELECT 1 FROM pg_database WHERE datname='wedding_builder'",
  ]);
  if (!databases.trim()) {
    run(postgresBin("createdb"), [
      "-h",
      "127.0.0.1",
      "-p",
      String(port),
      "-U",
      "vowly",
      "wedding_builder",
    ]);
  }

  return databaseUrl;
}

export function localDatabaseEnv(base = process.env) {
  const url = ensureLocalPostgres();
  return url
    ? {
        ...base,
        DATABASE_URL: url,
        POSTGRES_PRISMA_URL: url,
        POSTGRES_URL_NON_POOLING: url,
      }
    : base;
}

export function applyLocalMigrations(env) {
  const prismaBin = join(
    projectRoot,
    "node_modules",
    "prisma",
    "build",
    "index.js",
  );
  run(process.execPath, [prismaBin, "migrate", "deploy"], { env });
}
