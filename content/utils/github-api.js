export class GitHubAPI {
  constructor() {
    this.baseURL = 'https://api.github.com';
    this.cache = new Map();
  }

  parseRepoURL(url) {
    if (!url) return null;
    
    const match = url.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
    if (!match) return null;
    
    return {
      owner: match[1],
      repo: match[2]
    };
  }

  getCacheKey(owner, repo, endpoint) {
    return `${owner}/${repo}/${endpoint}`;
  }

  async fetchWithCache(url, cacheKey) {
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const response = await fetch(url);
    
    if (response.status === 404) {
      throw new Error('Repository not found or is private');
    }
    
    if (response.status === 403) {
      const resetTime = response.headers.get('X-RateLimit-Reset');
      if (resetTime) {
        const resetDate = new Date(parseInt(resetTime) * 1000);
        const minutes = Math.ceil((resetDate - new Date()) / 60000);
        throw new Error(`Rate limit exceeded. Try again in ${minutes} minutes`);
      }
      throw new Error('API rate limit exceeded');
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, data);
    
    return data;
  }

  async getRepoInfo(owner, repo) {
    const url = `${this.baseURL}/repos/${owner}/${repo}`;
    const cacheKey = this.getCacheKey(owner, repo, 'info');
    return this.fetchWithCache(url, cacheKey);
  }

  async getFileTree(owner, repo) {
    const cacheKey = this.getCacheKey(owner, repo, 'tree');
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let treeData = null;
    
    try {
      const url = `${this.baseURL}/repos/${owner}/${repo}/git/trees/main?recursive=1`;
      treeData = await this.fetchWithCache(url, cacheKey);
    } catch (e) {
      try {
        const url = `${this.baseURL}/repos/${owner}/${repo}/git/trees/master?recursive=1`;
        treeData = await this.fetchWithCache(url, cacheKey);
      } catch (e2) {
        throw new Error('Unable to fetch file tree');
      }
    }

    return this.buildTree(treeData.tree || []);
  }

  buildTree(items) {
    const root = [];
    const lookup = {};

    items.sort((a, b) => a.path.localeCompare(b.path));

    items.forEach(item => {
      const parts = item.path.split('/');
      
      parts.forEach((part, index) => {
        const currentPath = parts.slice(0, index + 1).join('/');
        
        if (!lookup[currentPath]) {
          const isFile = index === parts.length - 1 && item.type === 'blob';
          const node = {
            name: part,
            type: isFile ? 'file' : 'dir',
            path: currentPath,
            children: isFile ? null : []
          };
          
          lookup[currentPath] = node;
          
          if (index === 0) {
            root.push(node);
          } else {
            const parentPath = parts.slice(0, index).join('/');
            const parent = lookup[parentPath];
            if (parent && parent.children) {
              parent.children.push(node);
            }
          }
        }
      });
    });

    return root;
  }

  async getCommits(owner, repo) {
    const url = `${this.baseURL}/repos/${owner}/${repo}/commits?per_page=50`;
    const cacheKey = this.getCacheKey(owner, repo, 'commits');
    const commits = await this.fetchWithCache(url, cacheKey);
    
    return commits.map(c => ({
      sha: c.sha.substring(0, 7),
      message: c.commit.message.split('\n')[0],
      author: c.commit.author.name,
      date: new Date(c.commit.author.date).toISOString().split('T')[0],
      url: c.html_url
    }));
  }

  async getDependencies(owner, repo) {
    try {
      const url = `${this.baseURL}/repos/${owner}/${repo}/contents/package.json`;
      const cacheKey = this.getCacheKey(owner, repo, 'package');
      const packageData = await this.fetchWithCache(url, cacheKey);
      
      if (!packageData.content) {
        return { production: [], development: [] };
      }

      const content = JSON.parse(atob(packageData.content));
      const production = [];
      const development = [];

      Object.entries(content.dependencies || {}).forEach(([name, version]) => {
        production.push({ name, version });
      });

      Object.entries(content.devDependencies || {}).forEach(([name, version]) => {
        development.push({ name, version });
      });

      return { production, development };
    } catch (e) {
      return { production: [], development: [] };
    }
  }

  async getActivity(owner, repo) {
    const url = `${this.baseURL}/repos/${owner}/${repo}/commits?per_page=100`;
    const cacheKey = this.getCacheKey(owner, repo, 'activity');
    
    try {
      const commits = await this.fetchWithCache(url, cacheKey);
      const activityMap = {};
      
      commits.forEach(c => {
        const date = new Date(c.commit.author.date);
        const weekKey = this.getWeekKey(date);
        activityMap[weekKey] = (activityMap[weekKey] || 0) + 1;
      });

      const weeks = Object.entries(activityMap)
        .map(([week, count]) => ({ week, count }))
        .sort((a, b) => b.week.localeCompare(a.week))
        .slice(0, 12);

      return weeks;
    } catch (e) {
      return [];
    }
  }

  getWeekKey(date) {
    const year = date.getFullYear();
    const weekNum = this.getWeekNumber(date);
    return `${year}-W${weekNum.toString().padStart(2, '0')}`;
  }

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  clearCache() {
    this.cache.clear();
  }
}
