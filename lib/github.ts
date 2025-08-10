import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export interface GitHubRelease {
  id: number;
  name: string;
  tag_name: string;
  published_at: string;
  body: string;
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  language: string;
  updated_at: string;
  topics: string[];
}

export async function getRepositoryReleases(owner: string, repo: string, limit: number = 10): Promise<GitHubRelease[]> {
  try {
    const response = await octokit.repos.listReleases({
      owner,
      repo,
      per_page: limit,
    });
    
    return response.data.map(release => ({
      id: release.id,
      name: release.name || release.tag_name,
      tag_name: release.tag_name,
      published_at: release.published_at!,
      body: release.body || '',
      html_url: release.html_url,
      author: {
        login: release.author?.login || 'Unknown',
        avatar_url: release.author?.avatar_url || '',
      },
    }));
  } catch (error) {
    console.error(`Error fetching releases for ${owner}/${repo}:`, error);
    throw error;
  }
}

export async function getRepository(owner: string, repo: string): Promise<GitHubRepository> {
  try {
    const response = await octokit.repos.get({
      owner,
      repo,
    });
    
    return {
      id: response.data.id,
      name: response.data.name,
      full_name: response.data.full_name,
      description: response.data.description || '',
      html_url: response.data.html_url,
      stargazers_count: response.data.stargazers_count,
      language: response.data.language || '',
      updated_at: response.data.updated_at,
      topics: response.data.topics || [],
    };
  } catch (error) {
    console.error(`Error fetching repository ${owner}/${repo}:`, error);
    throw error;
  }
}

export async function searchRepositories(query: string, limit: number = 10): Promise<GitHubRepository[]> {
  try {
    const response = await octokit.search.repos({
      q: query,
      sort: 'updated',
      order: 'desc',
      per_page: limit,
    });
    
    return response.data.items.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description || '',
      html_url: repo.html_url,
      stargazers_count: repo.stargazers_count,
      language: repo.language || '',
      updated_at: repo.updated_at,
      topics: repo.topics || [],
    }));
  } catch (error) {
    console.error('Error searching repositories:', error);
    throw error;
  }
}
