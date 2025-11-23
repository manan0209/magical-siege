import { GitHubAPI } from '../utils/github-api.js';

const api = new GitHubAPI();
let currentModal = null;
let currentRepo = null;
let currentTab = 'files';
let fileTreeState = {};

export function initXRayScanner() {
  document.addEventListener('click', handleXRayClick);
  document.addEventListener('keydown', handleKeyPress);
}

function handleXRayClick(e) {
  const button = e.target.closest('.xray-scan-btn');
  if (!button) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const repoUrl = button.dataset.repoUrl;
  if (!repoUrl) return;
  
  openXRayModal(repoUrl);
}

function handleKeyPress(e) {
  if (!currentModal) return;
  
  if (e.key === 'Escape') {
    closeXRayModal();
  }
  
  if (e.key === 'Tab' && currentModal) {
    e.preventDefault();
    const tabs = ['files', 'commits', 'deps', 'activity'];
    const currentIndex = tabs.indexOf(currentTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    switchTab(tabs[nextIndex]);
  }
}

function openXRayModal(repoUrl) {
  const repoInfo = api.parseRepoURL(repoUrl);
  if (!repoInfo) {
    showError('Invalid GitHub URL');
    return;
  }

  currentRepo = repoInfo;
  fileTreeState = {};
  
  const modal = document.createElement('div');
  modal.className = 'xray-modal-overlay';
  modal.innerHTML = `
    <div class="xray-modal">
      <div class="xray-header">
        <div class="xray-title">X-RAY SCAN: ${repoInfo.owner}/${repoInfo.repo}</div>
        <button class="xray-close">&times;</button>
      </div>
      <div class="xray-tabs">
        <button class="xray-tab active" data-tab="files">FILES</button>
        <button class="xray-tab" data-tab="commits">COMMITS</button>
        <button class="xray-tab" data-tab="deps">DEPS</button>
        <button class="xray-tab" data-tab="activity">ACTIVITY</button>
      </div>
      <div class="xray-content">
        <div class="xray-loading">Scanning repository...</div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  currentModal = modal;

  modal.querySelector('.xray-close').addEventListener('click', closeXRayModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeXRayModal();
  });

  modal.querySelectorAll('.xray-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  loadTabContent('files');
}

function closeXRayModal() {
  if (currentModal) {
    currentModal.remove();
    currentModal = null;
    currentRepo = null;
    currentTab = 'files';
    fileTreeState = {};
  }
}

function switchTab(tabName) {
  if (!currentModal || !currentRepo) return;

  currentTab = tabName;

  currentModal.querySelectorAll('.xray-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });

  loadTabContent(tabName);
}

async function loadTabContent(tabName) {
  const content = currentModal.querySelector('.xray-content');
  content.innerHTML = '<div class="xray-loading">Loading...</div>';

  try {
    let html = '';

    switch (tabName) {
      case 'files':
        const tree = await api.getFileTree(currentRepo.owner, currentRepo.repo);
        html = renderFileTree(tree);
        break;

      case 'commits':
        const commits = await api.getCommits(currentRepo.owner, currentRepo.repo);
        html = renderCommits(commits);
        break;

      case 'deps':
        const deps = await api.getDependencies(currentRepo.owner, currentRepo.repo);
        html = renderDependencies(deps);
        break;

      case 'activity':
        const activity = await api.getActivity(currentRepo.owner, currentRepo.repo);
        html = renderActivity(activity);
        break;
    }

    content.innerHTML = html;
    attachTreeListeners();

  } catch (error) {
    content.innerHTML = `<div class="xray-error">ERROR: ${error.message}</div>`;
  }
}

function renderFileTree(tree, level = 0) {
  if (!tree || tree.length === 0) {
    return '<div class="xray-empty">No files found</div>';
  }

  let html = '';

  tree.forEach(node => {
    const indent = '  '.repeat(level);
    const isExpanded = fileTreeState[node.path];

    if (node.type === 'dir') {
      const childCount = countFiles(node);
      const icon = isExpanded ? '[-]' : '[+]';
      html += `<div class="xray-tree-item xray-dir" data-path="${node.path}">`;
      html += `${indent}${icon} ${node.name}/ (${childCount})`;
      html += `</div>`;

      if (isExpanded && node.children) {
        html += renderFileTree(node.children, level + 1);
      }
    } else {
      html += `<div class="xray-tree-item xray-file">`;
      html += `${indent}    ${node.name}`;
      html += `</div>`;
    }
  });

  return html;
}

function countFiles(node) {
  if (!node.children) return 0;
  
  let count = 0;
  node.children.forEach(child => {
    if (child.type === 'file') {
      count++;
    } else {
      count += countFiles(child);
    }
  });
  
  return count;
}

function attachTreeListeners() {
  if (!currentModal) return;

  currentModal.querySelectorAll('.xray-dir').forEach(dir => {
    dir.addEventListener('click', (e) => {
      e.stopPropagation();
      const path = dir.dataset.path;
      fileTreeState[path] = !fileTreeState[path];
      loadTabContent('files');
    });
  });
}

function renderCommits(commits) {
  if (!commits || commits.length === 0) {
    return '<div class="xray-empty">No commits found</div>';
  }

  let html = `<div class="xray-section-header">Total commits: ${commits.length}</div>`;

  commits.forEach(commit => {
    const message = commit.message.length > 80 
      ? commit.message.substring(0, 77) + '...' 
      : commit.message;

    html += `<div class="xray-commit">`;
    html += `<a href="${commit.url}" target="_blank" class="xray-commit-sha">${commit.sha}</a>`;
    html += ` - ${commit.author}`;
    html += ` - ${commit.date}`;
    html += `<div class="xray-commit-msg">${message}</div>`;
    html += `</div>`;
  });

  return html;
}

function renderDependencies(deps) {
  const hasProduction = deps.production && deps.production.length > 0;
  const hasDevelopment = deps.development && deps.development.length > 0;

  if (!hasProduction && !hasDevelopment) {
    return '<div class="xray-empty">No package.json found or no dependencies</div>';
  }

  let html = '';

  if (hasProduction) {
    html += `<div class="xray-section-header">Production (${deps.production.length})</div>`;
    deps.production.forEach(dep => {
      html += `<div class="xray-dep">${dep.name}@${dep.version}</div>`;
    });
  }

  if (hasDevelopment) {
    html += `<div class="xray-section-header xray-section-spaced">Development (${deps.development.length})</div>`;
    deps.development.forEach(dep => {
      html += `<div class="xray-dep xray-dep-dev">${dep.name}@${dep.version}</div>`;
    });
  }

  return html;
}

function renderActivity(weeks) {
  if (!weeks || weeks.length === 0) {
    return '<div class="xray-empty">No activity data available</div>';
  }

  const maxCommits = Math.max(...weeks.map(w => w.count));
  const totalCommits = weeks.reduce((sum, w) => sum + w.count, 0);

  let html = `<div class="xray-section-header">Last ${weeks.length} weeks - Total: ${totalCommits} commits</div>`;

  weeks.forEach(week => {
    const barLength = Math.ceil((week.count / maxCommits) * 30);
    const bar = '█'.repeat(barLength) + '░'.repeat(30 - barLength);
    
    html += `<div class="xray-activity-row">`;
    html += `<span class="xray-activity-week">${week.week}:</span> `;
    html += `<span class="xray-activity-bar">${bar}</span> `;
    html += `<span class="xray-activity-count">(${week.count})</span>`;
    html += `</div>`;
  });

  return html;
}

function showError(message) {
  const toast = document.createElement('div');
  toast.className = 'xray-toast xray-toast-error';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('xray-toast-visible');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('xray-toast-visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function injectXRayButtons(container, selector) {
  if (!container) return;

  const cards = container.querySelectorAll(selector);
  
  cards.forEach(card => {
    if (card.querySelector('.xray-scan-btn')) return;

    const repoLink = card.querySelector('a[href*="github.com"]');
    if (!repoLink) return;

    const repoUrl = repoLink.href;
    
    const button = document.createElement('button');
    button.className = 'xray-scan-btn';
    button.textContent = '[X-RAY]';
    button.dataset.repoUrl = repoUrl;
    button.title = 'Scan repository structure';

    card.style.position = 'relative';
    card.appendChild(button);
  });
}
