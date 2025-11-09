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
    background: linear-gradient(135deg, #1a1410 0%, #2d1f1a 100%);
    z-index: 99999;
    overflow: hidden;
    font-family: 'IM Fell English', serif;
  `;
  
  overlay.innerHTML = `
    <div id="treasury-container" style="width: 100%; height: 100%; display: flex; flex-direction: column;">
      <div id="treasury-header" style="
        padding: 1.5rem 2.5rem;
        border-bottom: 1px solid rgba(120, 84, 55, 0.3);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(0, 0, 0, 0.2);
      ">
        <div style="
          font-family: 'IM Fell English', serif;
          font-size: 1.5rem;
          color: #d4a574;
          letter-spacing: 0.3rem;
          text-transform: uppercase;
        ">Siege Treasury</div>
        <div style="
          font-family: 'IM Fell English', serif;
          color: rgba(212, 165, 116, 0.6);
          font-size: 0.9rem;
          letter-spacing: 0.1rem;
        ">Press ESC to exit</div>
      </div>
      
      <div id="treasury-main" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 2.5rem;">
        <div id="treasury-grid-area" style="flex: 1; overflow-y: auto; overflow-x: hidden;">
          <div style="
            color: rgba(212, 165, 116, 0.5);
            font-size: 1rem;
            text-align: center;
            margin-top: 10rem;
            letter-spacing: 0.15rem;
          ">Loading treasury data...</div>
        </div>
      </div>
      
      <div id="treasury-footer" style="
        padding: 2rem 2.5rem;
        border-top: 1px solid rgba(120, 84, 55, 0.3);
        background: rgba(0, 0, 0, 0.2);
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
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
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 1px;
    max-width: 100%;
    background: rgba(120, 84, 55, 0.1);
    padding: 1px;
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
    background: #0d0a08;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.12s ease;
    position: relative;
    border: none;
  `;
  
  cell.innerHTML = `
    <div style="
      font-family: 'Jaini', serif;
      font-size: 1.4rem;
      color: rgba(120, 84, 55, 0.8);
      letter-spacing: 0.05rem;
      margin-bottom: 0.25rem;
    ">${project.coin_value}</div>
    <div style="
      font-family: 'IM Fell English', serif;
      font-size: 0.6rem;
      color: rgba(120, 84, 55, 0.4);
      text-align: center;
      padding: 0 0.35rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      width: 100%;
      letter-spacing: 0.02rem;
    ">${project.name}</div>
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
      cell.style.background = 'rgba(120, 84, 55, 0.15)';
    }
  });
  
  cell.addEventListener('mouseleave', () => {
    if (!cell.classList.contains('selected')) {
      cell.style.background = '#0d0a08';
    }
  });
  
  cell.addEventListener('click', () => {
    toggleCellSelection(cell);
  });
}

function toggleCellSelection(cell) {
  if (cell.classList.contains('selected')) {
    cell.classList.remove('selected');
    cell.style.background = '#0d0a08';
    cell.style.boxShadow = 'none';
  } else {
    cell.classList.add('selected');
    cell.style.background = 'rgba(120, 84, 55, 0.3)';
    cell.style.boxShadow = 'inset 0 0 0 2px rgba(212, 165, 116, 0.6)';
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
    <div style="display: flex; gap: 4rem; align-items: center;">
      <div style="display: flex; flex-direction: column; gap: 0.25rem;">
        <div style="
          font-family: 'IM Fell English', serif;
          color: rgba(212, 165, 116, 0.5);
          font-size: 0.75rem;
          letter-spacing: 0.15rem;
          text-transform: uppercase;
        ">Selected</div>
        <div style="
          font-family: 'Jaini', serif;
          color: #d4a574;
          font-size: 2.5rem;
        ">${selectedCells.length}</div>
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 0.25rem;">
        <div style="
          font-family: 'IM Fell English', serif;
          color: rgba(212, 165, 116, 0.5);
          font-size: 0.75rem;
          letter-spacing: 0.15rem;
          text-transform: uppercase;
        ">Total Coins</div>
        <div style="
          font-family: 'Jaini', serif;
          color: #d4a574;
          font-size: 2.5rem;
        ">${totalCoins}</div>
      </div>
    </div>
    
    <div style="display: flex; gap: 1rem;">
      <button id="clear-selection-btn" style="
        font-family: 'IM Fell English', serif;
        padding: 0.85rem 2rem;
        background: transparent;
        border: 1px solid rgba(120, 84, 55, 0.4);
        color: rgba(212, 165, 116, 0.7);
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.15s;
        letter-spacing: 0.1rem;
        text-transform: uppercase;
      ">Clear Selection</button>
    </div>
  `;
  
  const clearBtn = document.getElementById('clear-selection-btn');
  if (clearBtn) {
    clearBtn.addEventListener('mouseenter', () => {
      clearBtn.style.background = 'rgba(120, 84, 55, 0.1)';
      clearBtn.style.borderColor = 'rgba(212, 165, 116, 0.6)';
      clearBtn.style.color = '#d4a574';
    });
    
    clearBtn.addEventListener('mouseleave', () => {
      clearBtn.style.background = 'transparent';
      clearBtn.style.borderColor = 'rgba(120, 84, 55, 0.4)';
      clearBtn.style.color = 'rgba(212, 165, 116, 0.7)';
    });
    
    clearBtn.addEventListener('click', clearAllSelections);
  }
}

function clearAllSelections() {
  const selectedCells = document.querySelectorAll('.treasury-cell.selected');
  selectedCells.forEach(cell => {
    cell.classList.remove('selected');
    cell.style.background = '#0d0a08';
    cell.style.boxShadow = 'none';
  });
  
  updateFooterStats();
}
