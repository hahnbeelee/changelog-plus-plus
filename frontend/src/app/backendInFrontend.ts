import axios from "axios";

interface Commit {
  stats: {
    total: number;
    additions: number;
    deletions: number;
  };
  files: {
    filename: string;
    patch: string;
  }[];
}

type SomeType = {
  url: string;
};

async function getRepoDiff(
  repoUrl: string,
  days: number
): Promise<{
  additions: number;
  deletions: number;
  netDiff: number;
  diffs: string[];
}> {
  const [owner, repo] = repoUrl.split("/").slice(-2);
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits`;

  const since = new Date();
  since.setDate(since.getDate() - days);

  try {
    const githubPAT = process.env.NEXT_PUBLIC_GITHUB_PAT;
    if (!githubPAT) {
      throw new Error("GitHub Personal Access Token is missing");
    }

    const response = await axios.get(apiUrl, {
      params: {
        since: since.toISOString(),
      },
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `token ${githubPAT}`,
      },
    });

    const commits: Commit[] = await Promise.all(
      response.data.map((commit: SomeType) =>
        axios
          .get(commit.url, {
            headers: {
              Accept: "application/vnd.github.v3+json",
              Authorization: `token ${githubPAT}`,
            },
          })
          .then((res) => res.data)
      )
    );

    const totals = commits.reduce(
      (acc, commit) => {
        acc.additions += commit.stats.additions;
        acc.deletions += commit.stats.deletions;
        return acc;
      },
      { additions: 0, deletions: 0 }
    );

    const netDiff = totals.additions - totals.deletions;

    const diffs = commits.flatMap((commit) =>
      commit.files.map((file) => `File: ${file.filename}\n${file.patch}`)
    );

    return {
      additions: totals.additions,
      deletions: totals.deletions,
      netDiff,
      diffs,
    };
  } catch (error) {
    console.error("Error fetching repository data:", error);
    throw error;
  }
}

async function generateChangelog(diffs: string[]): Promise<string> {
  const greptileApiKey = process.env.NEXT_PUBLIC_GREPTILE_API_KEY;
  const githubToken = process.env.NEXT_PUBLIC_GITHUB_PAT;

  if (!greptileApiKey) {
    throw new Error("Greptile API key is missing");
  }

  if (!githubToken) {
    throw new Error("GitHub token is missing");
  }

  try {
    const queryPayload = {
      messages: [
        {
          content: `Generate a concise changelog based on the following diffs: ${diffs.join(
            "\n\n"
          )}`,
          role: "user",
        },
      ],
      repositories: [
        {
          remote: "github",
          repository: "helicone/helicone",
          branch: "main",
        },
      ],
      genius: true,
    };

    const changelogResponse = await fetch("https://api.greptile.com/v2/query", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${greptileApiKey}`,
        "X-Github-Token": githubToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(queryPayload),
    });

    if (!changelogResponse.ok) {
      console.error("Response:", changelogResponse);
      throw new Error(
        `Failed to generate changelog: ${changelogResponse.statusText}`
      );
    }
    const changelogData = await changelogResponse.json();
    return changelogData.message;
  } catch (error) {
    console.error("Error generating changelog:", error);
    throw error;
  }
}

export async function generateChangelogForGreptileDocs() {
  try {
    const repoDiffResult = await getRepoDiff(
      "https://github.com/helicone/helicone",
      2
    );
    const changelog = await generateChangelog(repoDiffResult.diffs);
    console.log("Generated Changelog for helicone/helicone:");
    console.log(changelog);
  } catch (error) {
    console.error("Error generating changelog for greptileai/docs:", error);
  }
}
