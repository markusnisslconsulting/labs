export async function githubJson(path: string): Promise<unknown> {
  const token = process.env["GITHUB_TOKEN"];
  if (!token || !path.startsWith("/repos/"))
    throw new Error("Missing GitHub release context");
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    signal: AbortSignal.timeout(30_000),
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(
      `GitHub release metadata request failed (${response.status})`,
    );
  return response.json();
}

export function repositoryPath() {
  const repository = process.env["GITHUB_REPOSITORY"];
  if (!repository || !/^[\w.-]+\/[\w.-]+$/.test(repository))
    throw new Error("Invalid GitHub repository context");
  return `/repos/${repository}`;
}
