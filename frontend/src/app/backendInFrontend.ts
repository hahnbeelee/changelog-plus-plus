import axios from "axios";

interface Commit {
    author: {
        avatar_url: string,
        login: string
    },
    commit: {
        author: {
            email: string,
            name: string
        }
    },
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
    profilePicMap: object
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
            {additions: 0, deletions: 0}
        );

        const netDiff = totals.additions - totals.deletions;

        const diffs = commits.flatMap((commit) =>
            commit.files.map((file) => `Author: ${commit.author.login}. File: ${file.filename}\n${file.patch}`)
        );

        const profilePicMap = commits.reduce(
            (acc, commit) => {
                acc[commit.author.login] = commit.author.avatar_url;
                return acc;
            },
            {}
        );

        return {
            additions: totals.additions,
            deletions: totals.deletions,
            netDiff,
            diffs,
            profilePicMap
        };
    } catch (error) {
        console.error("Error fetching repository data:", error);
        throw error;
    }
}

async function generateChangelog(diffs: string[], profilePicMap: object, repo: string, owner: string): Promise<string> {
    const greptileApiKey = process.env.NEXT_PUBLIC_GREPTILE_API_KEY;
    const githubToken = process.env.NEXT_PUBLIC_GITHUB_PAT;

    if (!greptileApiKey) {
        throw new Error("Greptile API key is missing");
    }

    if (!githubToken) {
        throw new Error("GitHub token is missing");
    }


    const profilePics = Object.keys(profilePicMap).reduce((accumulate, key)=> {
        return accumulate += '\n' + 'user:' + key + '  profile picture:' + profilePicMap[key];
    }, '')

    try {
        const queryPayload = {
            messages: [
                {
                    content: `Generate a concise changelog based on the following diffs. 
                              Make sure to group the changes by each developer with their profile picture in markdown: ${diffs.join(
                        "\n\n"
                    )} Here is a map of all the developer profile pictures:` + profilePics,
                    role: "user",
                },
            ],
            repositories: [
                {
                    remote: "github",
                    repository: `${owner}/${repo}`,
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
        console.log(changelogData);
        return changelogData.message;
    } catch (error) {
        console.error("Error generating changelog:", error);
        throw error;
    }
}

export async function generateChangelogForGreptileDocs(url: string, days: number) {
    const tokens = url.split('/');
    const repo = tokens.pop();
    const owner = tokens.pop();

    if (!repo || !owner) {
        return;
    }
    try {
        const repoDiffResult = await getRepoDiff(
            `https://github.com/${owner}/${repo}`,
            days
        );
        console.log(repoDiffResult.diffs);
        const changelog = await generateChangelog(repoDiffResult.diffs, repoDiffResult.profilePicMap, repo, owner);
        return changelog;
    } catch (error) {
        console.error("Error generating changelog for greptileai/docs:", error);
    }
}
