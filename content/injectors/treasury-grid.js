let isActive = false;
let treasuryData = [];
let listenerAdded = false;

export function injectTreasuryGrid() {
  if (listenerAdded) return;
  
  setupTreasuryTrigger();
  listenerAdded = true;
}

function setupTreasuryTrigger() {
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'g' && e.shiftKey && !isActive) {
      e.preventDefault();
      activateTreasuryGrid();
    }
    
    if (e.key === 'Escape' && isActive) {
      deactivateTreasuryGrid();
    }
  });
}

function activateTreasuryGrid() {
  isActive = true;
  createTreasuryOverlay();
  fetchTreasuryData();
}

function deactivateTreasuryGrid() {
  isActive = false;
  const overlay = document.getElementById('ms-treasury-grid');
  if (overlay) {
    overlay.remove();
  }
}

function createTreasuryOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'ms-treasury-grid';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #2d1f1a;
    z-index: 99999;
    overflow: hidden;
  `;
  
  overlay.innerHTML = `
    <div id="treasury-container" style="width: 100%; height: 100%; display: flex; flex-direction: column;">
      <div id="treasury-header" style="height: 80px; border-bottom: 3px solid #785437; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center;">
        <div style="font-family: 'Jaini', serif; font-size: 2rem; color: #d4a574;">SIEGE TREASURY</div>
        <div style="font-family: 'IM Fell English', serif; color: #d4a574; font-size: 1.2rem;">Press ESC to exit</div>
      </div>
      
      <div id="treasury-grid-area" style="flex: 1; overflow: auto; padding: 2rem;">
        <div style="color: #d4a574; font-family: 'IM Fell English', serif; font-size: 1.5rem; text-align: center;">Loading treasury data...</div>
      </div>
      
      <div id="treasury-footer" style="height: 100px; border-top: 3px solid #785437;">
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
}

async function fetchTreasuryData() {
  const gridArea = document.getElementById('treasury-grid-area');
  if (!gridArea) return;
  
  try {
    const response = await fetch('https://siege.hackclub.com/api/public-beta/projects');
    const data = await response.json();
    
    if (data && data.projects) {
      treasuryData = data.projects
        .filter(p => p.status === 'finished' && p.coin_value > 0)
        .slice(0, 100);
      
      renderTreasuryGrid(treasuryData);
    }
  } catch (error) {
    gridArea.innerHTML = `
      <div style="color: #ef4444; font-family: 'IM Fell English', serif; font-size: 1.2rem; text-align: center; margin-top: 10rem;">
        Failed to load treasury data
      </div>
    `;
  }
}

function renderTreasuryGrid(data) {
  const gridArea = document.getElementById('treasury-grid-area');
  if (!gridArea) return;
  
  const grid = document.createElement('div');
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 2px;
    max-width: 1400px;
    margin: 0 auto;
  `;
  
  data.forEach((project, index) => {
    const cell = createTreasuryCell(project, index);
    grid.appendChild(cell);
  });
  
  gridArea.innerHTML = '';
  gridArea.appendChild(grid);
}

function createTreasuryCell(project, index) {
  const cell = document.createElement('div');
  cell.className = 'treasury-cell';
  cell.dataset.index = index;
  cell.dataset.coins = project.coin_value;
  
  cell.style.cssText = `
    aspect-ratio: 1;
    background: #1a1410;
    border: 1px solid #3d2817;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
    position: relative;
  `;
  
  cell.innerHTML = `
    <div style="font-family: 'Jaini', serif; font-size: 1.8rem; color: #785437;">${project.coin_value}</div>
    <div style="font-family: 'IM Fell English', serif; font-size: 0.7rem; color: #5a3d28; text-align: center; padding: 0 0.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%;">${project.name}</div>
  `;
  
  return cell;
}
