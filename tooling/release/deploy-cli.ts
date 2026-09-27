import { spawn } from "node:child_process";
import { z } from "zod";
import { deployRelease, DeploymentFailure } from "./deployment.ts";
import { FtpsStore } from "./ftps.ts";
import { githubJson, repositoryPath } from "./github.ts";
import { verifyRelease } from "./assemble.ts";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing deployment setting: ${name}`);
  return value;
}
const store = new FtpsStore({
  host: required("FTP_SERVER"),
  user: required("FTP_USERNAME"),
  password: required("FTP_PASSWORD"),
});
try {
  const sourceSha = required("RELEASE_SHA");
  await verifyRelease("dist/deploy-release", sourceSha);
  console.log("Connecting to the configured FTPS destination");
  await store.reconnect();
  const result = await deployRelease({
    directory: "dist/deploy-release",
    sourceSha,
    store,
    report: console.log,
    beforePromotion: async () => {
      if (process.env["GITHUB_EVENT_NAME"] !== "workflow_run") return;
      const main = z
        .object({ object: z.object({ sha: z.string() }) })
        .parse(await githubJson(`${repositoryPath()}/git/ref/heads/main`));
      if (main.object.sha !== sourceSha)
        throw new DeploymentFailure(
          "Main advanced while assets were uploading; this release was not promoted",
        );
    },
    smoke: async () => {
      const env: NodeJS.ProcessEnv = {
        ...process.env,
        RELEASE_URL: "https://labs.markusnissl.com",
        RELEASE_DIRECTORY: "dist/deploy-release",
      };
      for (const name of [
        "FTP_SERVER",
        "FTP_USERNAME",
        "FTP_PASSWORD",
        "GITHUB_TOKEN",
      ])
        delete env[name];
      await new Promise<void>((resolve, reject) => {
        const child = spawn(
          "pnpm",
          [
            "exec",
            "playwright",
            "test",
            "--config",
            "tests/release/playwright.smoke.config.ts",
          ],
          { stdio: "inherit", env },
        );
        child.once("error", reject);
        child.once("exit", (code) =>
          code === 0
            ? resolve()
            : reject(new Error("Deployed browser smoke checks failed")),
        );
      });
    },
  });
  console.log(
    `Deployed ${result.releaseId}; previous entries retained as transaction ${result.backupId}`,
  );
} catch (error) {
  // FTP replies and connection errors can contain account details.
  console.error(
    error instanceof DeploymentFailure
      ? error.message
      : "Deployment failed. See the last reported phase; an unfinished private journal must be recovered before another release.",
  );
  process.exitCode = 1;
} finally {
  store.close();
}
