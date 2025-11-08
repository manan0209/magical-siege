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
  updateFooterStats();
}

function createTreasuryCell(project, index) {
  const cell = document.createElement('div');
  cell.className = 'treasury-cell';
  cell.dataset.index = index;
  cell.dataset.coins = project.coin_value;
  cell.dataset.projectName = project.name;
  
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
  
  setupCellInteractions(cell);
  
  return cell;
}

//cupcakes here :3 
//actually im tryin to build a refine like gamem but for siege treasury!

//so far i like it but i dont know about how it actually turns out!
function setupCellInteractions(cell) {
  cell.addEventListener('mouseenter', () => {
    if (!cell.classList.contains('selected')) {
      cell.style.background = '#2d1f1a';
      cell.style.borderColor = '#785437';
      cell.style.transform = 'scale(1.05)';
    }
  });
  
  cell.addEventListener('mouseleave', () => {
    if (!cell.classList.contains('selected')) {
      cell.style.background = '#1a1410';
      cell.style.borderColor = '#3d2817';
      cell.style.transform = 'scale(1)';
    }
  });
  
  cell.addEventListener('click', () => {
    toggleCellSelection(cell);
  });
}

function toggleCellSelection(cell) {
  if (cell.classList.contains('selected')) {
    cell.classList.remove('selected');
    cell.style.background = '#1a1410';
    cell.style.borderColor = '#3d2817';
    cell.style.transform = 'scale(1)';
  } else {
    cell.classList.add('selected');
    cell.style.background = '#3d2817';
    cell.style.borderColor = '#d4a574';
    cell.style.transform = 'scale(0.95)';
    cell.style.boxShadow = 'inset 0 0 20px rgba(212, 165, 116, 0.3)';
  }
  
  updateFooterStats();
}

function updateFooterStats() {
  const footer = document.getElementById('treasury-footer');
  if (!footer) return;
  
  const selectedCells = document.querySelectorAll('.treasury-cell.selected');
  const totalCoins = Array.from(selectedCells).reduce((sum, cell) => {
    return sum + parseInt(cell.dataset.coins || 0);
  }, 0);
  
  footer.innerHTML = `
    <div style="display: flex; justify-content: space-around; align-items: center; height: 100%; padding: 0 2rem;">
      <div style="text-align: center;">
        <div style="font-family: 'IM Fell English', serif; color: #5a3d28; font-size: 0.9rem;">SELECTED</div>
        <div style="font-family: 'Jaini', serif; color: #d4a574; font-size: 2.5rem;">${selectedCells.length}</div>
      </div>
      <div style="text-align: center;">
        <div style="font-family: 'IM Fell English', serif; color: #5a3d28; font-size: 0.9rem;">TOTAL COINS</div>
        <div style="font-family: 'Jaini', serif; color: #d4a574; font-size: 2.5rem;">${totalCoins}</div>
      </div>
      <div style="text-align: center;">
        <button id="clear-selection-btn" style="
          font-family: 'IM Fell English', serif;
          padding: 0.75rem 2rem;
          background: transparent;
          border: 2px solid #785437;
          color: #d4a574;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        ">CLEAR SELECTION</button>
      </div>
    </div>
  `;
  
  const clearBtn = document.getElementById('clear-selection-btn');
  if (clearBtn) {
    clearBtn.addEventListener('mouseenter', () => {
      clearBtn.style.background = '#3d2817';
      clearBtn.style.borderColor = '#d4a574';
    });
    
    clearBtn.addEventListener('mouseleave', () => {
      clearBtn.style.background = 'transparent';
      clearBtn.style.borderColor = '#785437';
    });
    
    clearBtn.addEventListener('click', clearAllSelections);
  }
}

function clearAllSelections() {
  const selectedCells = document.querySelectorAll('.treasury-cell.selected');
  selectedCells.forEach(cell => {
    cell.classList.remove('selected');
    cell.style.background = '#1a1410';
    cell.style.borderColor = '#3d2817';
    cell.style.transform = 'scale(1)';
    cell.style.boxShadow = 'none';
  });
  
  updateFooterStats();
}
