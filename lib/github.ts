import { Octokit } from 'octokit';

const owner = process.env.GH_OWNER;
const repo = process.env.GH_REPO;
const branch = process.env.GH_BRANCH || 'main';
const pat = process.env.GH_PAT;

export function getOcto() {
  if (!pat) return null;
  return new Octokit({ auth: pat });
}

export async function getRepoFile(path: string) {
  if (!owner || !repo || !branch || !pat) return { sha: undefined, content: undefined };
  const octo = getOcto();
  if (!octo) return { sha: undefined, content: undefined };
  try {
    const res: any = await octo.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner, repo, path, ref: branch
    });
    const sha = res.data.sha;
    const content = Buffer.from(res.data.content, 'base64').toString('utf8');
    return { sha, content };
  } catch {
    return { sha: undefined, content: undefined };
  }
}

export async function upsertFile(path: string, content: string, message: string, sha?: string) {
  if (!owner || !repo || !branch || !pat) return;
  const octo = getOcto();
  if (!octo) return;
  await octo.request('PUT /repos/{owner}/{repo}/contents/{path}', {
    owner, repo, path, branch, message,
    content: Buffer.from(content).toString('base64'),
    sha
  });
}