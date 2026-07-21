import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const localEnvironmentFile = join(projectRoot, ".env");
const TINA_HEAP_OPTION = "--max-old-space-size=4096";

// Netlify injects variables into the process. Local production builds instead
// read the ignored .env file, while existing shell variables retain priority.
if (existsSync(localEnvironmentFile)) loadEnvFile(localEnvironmentFile);

const hasCloudConfiguration = Boolean(
  process.env.TINA_PUBLIC_CLIENT_ID && process.env.TINA_TOKEN,
);

if (!hasCloudConfiguration) {
  console.log(
    "Skipping the production Tina admin build: TINA_PUBLIC_CLIENT_ID and TINA_TOKEN are not configured.",
  );
  process.exit(0);
}

const executable = join(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tinacms.cmd" : "tinacms",
);
const nodeOptions = process.env.NODE_OPTIONS ?? "";
const tinaEnvironment = {
  ...process.env,
  NODE_OPTIONS: nodeOptions.includes("--max-old-space-size")
    ? nodeOptions
    : `${nodeOptions} ${TINA_HEAP_OPTION}`.trim(),
};
const tinaArguments = ["build", "--noTelemetry"];
if (process.env.TINA_SKIP_CLOUD_CHECKS === "true") {
  // Useful for local previews while a schema change is intentionally kept unpushed.
  tinaArguments.push("--skip-cloud-checks");
}

const result = spawnSync(executable, tinaArguments, {
  cwd: projectRoot,
  env: tinaEnvironment,
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
