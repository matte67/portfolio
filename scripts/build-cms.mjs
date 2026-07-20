import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
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
const result = spawnSync(executable, ["build", "--noTelemetry"], {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
