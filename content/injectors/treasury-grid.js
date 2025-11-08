let isActive = false;
let treasuryData = [];

export function injectTreasuryGrid() {
  if (isActive) return;
  
  setupTreasuryTrigger();
}

function setupTreasuryTrigger() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'g' && e.shiftKey && !isActive) {
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
  
  gridArea.innerHTML = `
    <div style="color: #d4a574; font-family: 'IM Fell English', serif; font-size: 1.5rem; text-align: center; margin-top: 10rem;">
      Treasury data loading...
    </div>
  `;
}
