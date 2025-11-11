let isActive = false;
let treasuryData = [];
let listenerAdded = false;
let focusedCellIndex = 0;
let gridColumns = 0;
let audioContext = null;
let dataPreloaded = false;
let isFirstTime = true;

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTone(frequency, duration, volume = 0.1) {
  if (!audioContext) initAudio();
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

// I have been hella alot busy this week I am giving mocks back to back :sob: so please bear with me

const style = document.createElement('style');
style.textContent = `
  @keyframes treasury-process {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); opacity: 0.7; }
    100% { transform: scale(1); }
  }
  
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  @keyframes modalFadeIn {
    0% { transform: scale(0.95); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }
`;
document.head.appendChild(style);

export function injectTreasuryGrid() {
  if (listenerAdded) return;
  
  setupTreasuryTrigger();
  listenerAdded = true;
  preloadTreasuryData();
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
    
    if (isActive) {
      handleKeyboardNavigation(e);
    }
  });
}

async function preloadTreasuryData() {
  if (dataPreloaded) return;
  
  try {
    const response = await fetch('https://siege.hackclub.com/api/public-beta/projects');
    const data = await response.json();
    
    if (data && data.projects) {
      const baseProjects = data.projects
        .filter(p => p.status === 'finished' && p.coin_value > 0)
        .slice(0, 100);
      
      const repeatCount = Math.ceil(2000 / baseProjects.length);
      treasuryData = [];
      for (let i = 0; i < repeatCount; i++) {
        treasuryData.push(...baseProjects);
      }
      
      dataPreloaded = true;
    }
  } catch (error) {
    console.error('Failed to preload treasury data:', error);
  }
}

function activateTreasuryGrid() {
  isActive = true;
  focusedCellIndex = 0;
  playTone(400, 0.1, 0.05);
  setTimeout(() => playTone(600, 0.15, 0.05), 50);
  
  stopFallingProjects();
  
  if (isFirstTime) {
    showWelcomeScreen();
    isFirstTime = false;
  } else {
    createTreasuryOverlay();
    if (dataPreloaded) {
      renderTreasuryGrid(treasuryData);
    } else {
      fetchTreasuryData();
    }
  }
}

function deactivateTreasuryGrid() {
  isActive = false;
  playTone(600, 0.1, 0.05);
  setTimeout(() => playTone(400, 0.15, 0.05), 50);
  const overlay = document.getElementById('ms-treasury-grid');
  if (overlay) {
    overlay.remove();
  }
  
  const progressBar = document.getElementById('treasury-progress');
  if (progressBar) {
    progressBar.remove();
  }
  
  restartFallingProjects();
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
    z-index: 99998;
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
        <div style="display: flex; gap: 2rem; align-items: center;">
          <div style="
            font-family: 'IM Fell English', serif;
            color: rgba(212, 165, 116, 0.4);
            font-size: 0.75rem;
            letter-spacing: 0.08rem;
          ">Arrow keys to navigate • Space to select • Double-click for details</div>
          <div style="
            font-family: 'IM Fell English', serif;
            color: rgba(212, 165, 116, 0.6);
            font-size: 0.9rem;
            letter-spacing: 0.1rem;
          ">ESC to exit</div>
        </div>
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
  
  if (dataPreloaded && treasuryData.length > 0) {
    renderTreasuryGrid(treasuryData);
    return;
  }
  
  try {
    const response = await fetch('https://siege.hackclub.com/api/public-beta/projects');
    const data = await response.json();
    
    if (data && data.projects) {
      const baseProjects = data.projects
        .filter(p => p.status === 'finished' && p.coin_value > 0)
        .slice(0, 100);
      
      const repeatCount = Math.ceil(2000 / baseProjects.length);
      treasuryData = [];
      for (let i = 0; i < repeatCount; i++) {
        treasuryData.push(...baseProjects);
      }
      
      dataPreloaded = true;
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
  
  setTimeout(() => {
    const cells = document.querySelectorAll('.treasury-cell');
    if (cells.length > 0) {
      updateFocusedCell(cells);
    }
  }, 100);
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
  
  cell.addEventListener('dblclick', () => {
    showProjectDetail(cell);
  });
}

function toggleCellSelection(cell) {
  if (cell.classList.contains('selected')) {
    cell.classList.remove('selected');
    cell.style.background = '#0d0a08';
    cell.style.boxShadow = 'none';
    playTone(300, 0.05, 0.03);
  } else {
    cell.classList.add('selected');
    cell.style.background = 'rgba(120, 84, 55, 0.3)';
    cell.style.boxShadow = 'inset 0 0 0 2px rgba(212, 165, 116, 0.6)';
    playTone(500, 0.05, 0.03);
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
  
  const hasSelection = selectedCells.length > 0;
  
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
      ${hasSelection ? `
      <button id="process-btn" style="
        font-family: 'IM Fell English', serif;
        padding: 0.85rem 2rem;
        background: rgba(212, 165, 116, 0.15);
        border: 1px solid rgba(212, 165, 116, 0.6);
        color: #d4a574;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.15s;
        letter-spacing: 0.1rem;
        text-transform: uppercase;
      ">Process Treasury</button>
      ` : ''}
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
  
  const processBtn = document.getElementById('process-btn');
  if (processBtn) {
    processBtn.addEventListener('mouseenter', () => {
      processBtn.style.background = 'rgba(212, 165, 116, 0.25)';
    });
    
    processBtn.addEventListener('mouseleave', () => {
      processBtn.style.background = 'rgba(212, 165, 116, 0.15)';
    });
    
    processBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      processTreasury();
    });
  }
}

function processTreasury() {
  const selectedCells = document.querySelectorAll('.treasury-cell.selected');
  if (selectedCells.length === 0) return;
  
  const existingProgress = document.getElementById('treasury-progress');
  if (existingProgress) {
    existingProgress.remove();
  }
  
  const progressBar = document.createElement('div');
  progressBar.id = 'treasury-progress';
  progressBar.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 12px !important;
    background: #d4a574 !important;
    z-index: 2147483647 !important;
    pointer-events: none !important;
  `;
  
  const progressFill = document.createElement('div');
  progressFill.style.cssText = `
    height: 100% !important;
    width: 0% !important;
    background: #f4d5a4 !important;
    transition: width 0.3s ease !important;
  `;
  
  progressBar.appendChild(progressFill);
  document.body.appendChild(progressBar);
  
  const totalCells = selectedCells.length;
  let processedCount = 0;
  
  const processInterval = setInterval(() => {
    if (processedCount < totalCells) {
      const cell = selectedCells[processedCount];
      
      cell.style.animation = 'treasury-process 0.5s ease';
      playTone(350 + (processedCount % 5) * 50, 0.08, 0.02);
      
      setTimeout(() => {
        cell.style.opacity = '0.3';
        cell.style.pointerEvents = 'none';
      }, 500);
      
      processedCount++;
      const progress = (processedCount / totalCells) * 100;
      progressFill.style.width = `${progress}%`;
    } else {
      clearInterval(processInterval);
      playTone(700, 0.2, 0.04);
      setTimeout(() => playTone(900, 0.3, 0.04), 100);
      
      setTimeout(() => {
        showCompletionMessage(totalCells);
        progressBar.remove();
      }, 500);
    }
  }, 150);
}

function showCompletionMessage(count) {
  const overlay = document.getElementById('treasury-overlay');
  if (!overlay) return;
  
  const message = document.createElement('div');
  message.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.8);
    background: rgba(13, 10, 8, 0.95);
    border: 2px solid rgba(212, 165, 116, 0.8);
    padding: 3rem 4rem;
    z-index: 10002;
    text-align: center;
    opacity: 0;
    transition: all 0.5s ease;
  `;
  
  message.innerHTML = `
    <div style="
      font-family: 'Jaini', serif;
      color: #d4a574;
      font-size: 4rem;
      margin-bottom: 1rem;
    ">${count}</div>
    <div style="
      font-family: 'IM Fell English', serif;
      color: rgba(212, 165, 116, 0.7);
      font-size: 1rem;
      letter-spacing: 0.15rem;
      text-transform: uppercase;
    ">Projects Processed</div>
  `;
  
  overlay.appendChild(message);
  
  setTimeout(() => {
    message.style.opacity = '1';
    message.style.transform = 'translate(-50%, -50%) scale(1)';
  }, 50);
  
  setTimeout(() => {
    message.style.opacity = '0';
    message.style.transform = 'translate(-50%, -50%) scale(0.8)';
    
    setTimeout(() => {
      message.remove();
      clearAllSelections();
    }, 2000);
  }, 2000);
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

function handleKeyboardNavigation(e) {
  const cells = document.querySelectorAll('.treasury-cell');
  if (cells.length === 0) return;
  
  const gridContainer = cells[0].parentElement;
  if (!gridContainer) return;
  
  const gridStyle = window.getComputedStyle(gridContainer);
  const gridTemplateColumns = gridStyle.gridTemplateColumns.split(' ');
  gridColumns = gridTemplateColumns.length;
  
  let handled = false;
  
  if (e.key === 'ArrowRight') {
    focusedCellIndex = Math.min(focusedCellIndex + 1, cells.length - 1);
    playTone(450, 0.03, 0.02);
    handled = true;
  } else if (e.key === 'ArrowLeft') {
    focusedCellIndex = Math.max(focusedCellIndex - 1, 0);
    playTone(450, 0.03, 0.02);
    handled = true;
  } else if (e.key === 'ArrowDown') {
    focusedCellIndex = Math.min(focusedCellIndex + gridColumns, cells.length - 1);
    playTone(420, 0.03, 0.02);
    handled = true;
  } else if (e.key === 'ArrowUp') {
    focusedCellIndex = Math.max(focusedCellIndex - gridColumns, 0);
    playTone(480, 0.03, 0.02);
    handled = true;
  } else if (e.key === ' ' || e.key === 'Enter') {
    const focusedCell = cells[focusedCellIndex];
    if (focusedCell) {
      focusedCell.click();
    }
    handled = true;
  }
  
  if (handled) {
    e.preventDefault();
    updateFocusedCell(cells);
  }
}

function updateFocusedCell(cells) {
  cells.forEach((cell, index) => {
    if (index === focusedCellIndex) {
      cell.style.outline = '3px solid #d4a574';
      cell.style.outlineOffset = '-3px';
      cell.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      cell.style.outline = 'none';
    }
  });
}

function showProjectDetail(cell) {
  const coins = cell.dataset.coins;
  const projectName = cell.dataset.projectName;
  const index = cell.dataset.index;
  
  playTone(550, 0.1, 0.03);
  setTimeout(() => playTone(750, 0.15, 0.03), 50);
  
  const existingModal = document.getElementById('treasury-detail-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const modal = document.createElement('div');
  modal.id = 'treasury-detail-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: linear-gradient(135deg, #1a1410 0%, #2d1f1a 100%);
    border: 2px solid rgba(212, 165, 116, 0.4);
    padding: 3rem;
    min-width: 400px;
    max-width: 600px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
    animation: modalFadeIn 0.3s ease;
  `;
  
  content.innerHTML = `
    <div style="
      font-family: 'IM Fell English', serif;
      color: rgba(212, 165, 116, 0.5);
      font-size: 0.75rem;
      letter-spacing: 0.2rem;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    ">Project #${parseInt(index) + 1}</div>
    
    <div style="
      font-family: 'Jaini', serif;
      color: #d4a574;
      font-size: 3.5rem;
      margin-bottom: 2rem;
      line-height: 1;
    ">${coins}</div>
    
    <div style="
      font-family: 'IM Fell English', serif;
      color: rgba(212, 165, 116, 0.5);
      font-size: 0.75rem;
      letter-spacing: 0.15rem;
      text-transform: uppercase;
      margin-bottom: 0.75rem;
    ">Project Name</div>
    
    <div style="
      font-family: 'IM Fell English', serif;
      color: #d4a574;
      font-size: 1.25rem;
      margin-bottom: 3rem;
      line-height: 1.4;
    ">${projectName}</div>
    
    <div style="
      font-family: 'IM Fell English', serif;
      color: rgba(212, 165, 116, 0.4);
      font-size: 0.85rem;
      text-align: center;
      letter-spacing: 0.1rem;
    ">Press ESC or click anywhere to close</div>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  const closeModal = () => {
    modal.style.opacity = '0';
    setTimeout(() => modal.remove(), 200);
  };
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  });
  
  modal.style.opacity = '0';
  setTimeout(() => {
    modal.style.transition = 'opacity 0.2s ease';
    modal.style.opacity = '1';
  }, 10);
}

function showWelcomeScreen() {
  const welcome = document.createElement('div');
  welcome.id = 'treasury-welcome';
  welcome.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #1a1410 0%, #2d1f1a 100%);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: linear-gradient(135deg, #1a1410 0%, #2d1f1a 100%);
    border: 3px solid rgba(212, 165, 116, 0.6);
    padding: 4rem;
    max-width: 700px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
    animation: modalFadeIn 0.5s ease;
  `;
  
  content.innerHTML = `
    <div style="
      font-family: 'Jaini', serif;
      color: #d4a574;
      font-size: 4rem;
      margin-bottom: 2rem;
      line-height: 1;
      text-shadow: 0 2px 10px rgba(212, 165, 116, 0.3);
    ">Congratulations</div>
    
    <div style="
      font-family: 'IM Fell English', serif;
      color: rgba(212, 165, 116, 0.9);
      font-size: 1.5rem;
      margin-bottom: 3rem;
      letter-spacing: 0.05rem;
      line-height: 1.6;
    ">You are a Treasurer now</div>
    
    <div style="
      font-family: 'IM Fell English', serif;
      color: rgba(212, 165, 116, 0.7);
      font-size: 1.1rem;
      margin-bottom: 1rem;
      line-height: 1.8;
      max-width: 550px;
      margin-left: auto;
      margin-right: auto;
    ">
      Remember, the work is important and mysterious.<br>
      Select cells and refine the grid.<br>
      Your contributions shape the treasury.
    </div>
    
    <div style="
      font-family: 'IM Fell English', serif;
      color: rgba(212, 165, 116, 0.5);
      font-size: 0.9rem;
      margin-top: 3rem;
      margin-bottom: 2rem;
      letter-spacing: 0.1rem;
    ">Click to select • Double-click for details<br>Arrow keys to navigate • Space to select</div>
    
    <button id="welcome-begin" style="
      font-family: 'IM Fell English', serif;
      padding: 1rem 3rem;
      background: rgba(212, 165, 116, 0.2);
      border: 2px solid rgba(212, 165, 116, 0.6);
      color: #d4a574;
      font-size: 1.1rem;
      cursor: pointer;
      transition: all 0.2s;
      letter-spacing: 0.15rem;
      text-transform: uppercase;
      margin-top: 1rem;
    ">Begin Your Work</button>
  `;
  
  welcome.appendChild(content);
  document.body.appendChild(welcome);
  
  const beginBtn = document.getElementById('welcome-begin');
  beginBtn.addEventListener('mouseenter', () => {
    beginBtn.style.background = 'rgba(212, 165, 116, 0.3)';
    beginBtn.style.borderColor = 'rgba(212, 165, 116, 0.8)';
  });
  
  beginBtn.addEventListener('mouseleave', () => {
    beginBtn.style.background = 'rgba(212, 165, 116, 0.2)';
    beginBtn.style.borderColor = 'rgba(212, 165, 116, 0.6)';
  });
  
  beginBtn.addEventListener('click', () => {
    playTone(500, 0.1, 0.04);
    setTimeout(() => playTone(700, 0.15, 0.04), 80);
    welcome.style.opacity = '0';
    welcome.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      welcome.remove();
      createTreasuryOverlay();
      if (dataPreloaded) {
        renderTreasuryGrid(treasuryData);
      } else {
        fetchTreasuryData();
      }
    }, 300);
  });
  
  welcome.style.opacity = '0';
  setTimeout(() => {
    welcome.style.transition = 'opacity 0.5s ease';
    welcome.style.opacity = '1';
  }, 10);
}

function stopFallingProjects() {
  const fallingCards = document.querySelectorAll('.ms-falling-card');
  fallingCards.forEach(card => {
    card.style.display = 'none';
  });
  
  const event = new CustomEvent('ms-stop-falling');
  document.dispatchEvent(event);
}

function restartFallingProjects() {
  const fallingCards = document.querySelectorAll('.ms-falling-card');
  fallingCards.forEach(card => {
    card.style.display = '';
  });
  
  const event = new CustomEvent('ms-restart-falling');
  document.dispatchEvent(event);
}
