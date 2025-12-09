import { getLeaderboard, getUserRank } from '../utils/leaderboard.js';

let isActive = false;
let wrappedStats = null;
let listenerAdded = false;
let currentSlideIndex = 0;
let autoPlayInterval = null;
let audioContext = null;
let bgmAudio = null;
let isMuted = false;

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

function startBGM() {
  try {
    if (!bgmAudio) {
      const audioUrl = chrome.runtime.getURL('assets/wrapped.mp3');
      console.log('Loading BGM from:', audioUrl);
      bgmAudio = new Audio(audioUrl);
      bgmAudio.loop = true;
      bgmAudio.volume = 0.3;
    }
    
    if (!isMuted) {
      bgmAudio.play().catch(e => console.warn('Could not play BGM:', e));
    }
  } catch (e) {
    console.error('Error starting BGM:', e);
  }
}

function stopBGM() {
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio.currentTime = 0;
  }
}

function toggleMute() {
  isMuted = !isMuted;
  
  if (bgmAudio) {
    if (isMuted) {
      bgmAudio.pause();
    } else {
      bgmAudio.play().catch(e => console.warn('Could not play BGM:', e));
    }
  }
  
  updateMuteButton();
}

function updateMuteButton() {
  const muteBtn = document.getElementById('wrapped-mute-btn');
  if (muteBtn) {
    muteBtn.innerHTML = isMuted ? `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 5L6 9H2v6h4l5 4V5z"/>
        <line x1="23" y1="9" x2="17" y2="15"/>
        <line x1="17" y1="9" x2="23" y2="15"/>
      </svg>
    ` : `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 5L6 9H2v6h4l5 4V5z"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
      </svg>
    `;
  }
}

let styleInjected = false;

function injectStyles() {
  if (styleInjected) return;
  if (!document.head) return;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes wrapped-fade-in {
      0% { opacity: 0; transform: scale(0.95); }
      100% { opacity: 1; transform: scale(1); }
    }
    
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
  styleInjected = true;
}

export function injectWrappedTrigger() {
  if (listenerAdded) return;
  
  injectStyles();
  setupWrappedTrigger();
  listenerAdded = true;
}

function setupWrappedTrigger() {
  waitForNavbar(() => {
    addWrappedButton();
  });
  
  document.addEventListener('turbo:load', () => {
    waitForNavbar(() => {
      addWrappedButton();
    });
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'w' && e.shiftKey && !isActive) {
      e.preventDefault();
      activateWrapped();
    }
    
    if (e.key === 'Escape' && isActive) {
      deactivateWrapped();
    }
    
    if (isActive) {
      handleKeyboardNavigation(e);
    }
  });
}

function waitForNavbar(callback, maxAttempts = 50) {
  let attempts = 0;
  
  const check = () => {
    attempts++;
    const navbarNav = document.querySelector('.navbar-nav');
    
    if (navbarNav) {
      callback();
    } else if (attempts < maxAttempts) {
      requestAnimationFrame(check);
    }
  };
  
  check();
}

function addWrappedButton() {
  const navbarNav = document.querySelector('.navbar-nav');
  if (!navbarNav) return;
  
  const existingButton = document.querySelector('.navbar-link--wrapped');
  if (existingButton) return;
  
  const wrappedLink = document.createElement('a');
  wrappedLink.href = '#';
  wrappedLink.className = 'navbar-link navbar-link--wrapped';
  wrappedLink.textContent = 'Wrapped';
  wrappedLink.style.cssText = `
    background: linear-gradient(135deg, rgba(212, 165, 116, 0.1) 0%, rgba(120, 84, 55, 0.1) 100%);
    border: 1px solid rgba(212, 165, 116, 0.3);
  `;
  
  wrappedLink.addEventListener('click', (e) => {
    e.preventDefault();
    activateWrapped();
  });
  
  const chambersLink = Array.from(navbarNav.querySelectorAll('.navbar-link')).find(
    link => link.textContent.includes('Chambers')
  );
  
  if (chambersLink) {
    chambersLink.after(wrappedLink);
  } else {
    navbarNav.appendChild(wrappedLink);
  }
}

async function activateWrapped() {
  isActive = true;
  currentSlideIndex = 0;
  playTone(400, 0.1, 0.05);
  setTimeout(() => playTone(600, 0.15, 0.05), 50);
  
  createWrappedOverlay();
  startBGM();
  await fetchWrappedData();
}

function deactivateWrapped() {
  isActive = false;
  playTone(600, 0.1, 0.05);
  setTimeout(() => playTone(400, 0.15, 0.05), 50);
  
  stopAutoPlay();
  stopBGM();
  
  const overlay = document.getElementById('ms-wrapped-overlay');
  if (overlay) {
    overlay.remove();
  }
}

function createWrappedOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'ms-wrapped-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #1a1410 0%, #2d1f1a 100%);
    z-index: 99999;
    overflow: hidden;
    font-family: "IM Fell English", serif;
  `;
  
  overlay.innerHTML = `
    <div id="wrapped-progress-bar" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: rgba(255, 255, 255, 0.2);
      z-index: 100001;
      display: flex;
      gap: 4px;
      padding: 0 4px;
    "></div>
    
    <button id="wrapped-mute-btn" style="
      position: fixed;
      top: 20px;
      right: 20px;
      width: 48px;
      height: 48px;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      z-index: 100002;
      transition: all 0.2s ease;
      padding: 0;
    " onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 5L6 9H2v6h4l5 4V5z"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
      </svg>
    </button>
    
    <div id="wrapped-slides-container" style="
      width: 100%;
      height: 100vh;
      position: relative;
      overflow: hidden;
    ">
      <div style="
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%), url('${chrome.runtime.getURL('assets/scroll.webp')}');
        background-size: cover;
        background-position: center;
        background-blend-mode: multiply;
        color: white;
        font-family: 'Phantom Sans', system-ui, -apple-system, sans-serif;
      ">
        <div style="text-align: center; position: relative; z-index: 1;">
          <img src="${chrome.runtime.getURL('assets/scroll.webp')}" 
               style="width: 200px; height: auto; margin-bottom: 30px; opacity: 0.9; filter: brightness(1.1) drop-shadow(0 4px 12px rgba(0,0,0,0.5));" />
          <div style="font-size: 28px; font-weight: bold; margin-bottom: 12px; text-shadow: 0 2px 8px rgba(0,0,0,0.8);">
            Loading Your Siege Wrapped...
          </div>
          <div style="font-size: 16px; opacity: 0.9; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">
            Gathering your legendary stats
          </div>
        </div>
      </div>
    </div>
    
    <div id="wrapped-nav-hint" style="
      position: fixed;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      font-family: 'Phantom Sans', system-ui, -apple-system, sans-serif;
      z-index: 100001;
      text-align: center;
    ">
      <div>Tap or use arrow keys to navigate</div>
      <div style="margin-top: 8px; font-size: 12px; opacity: 0.6;">
        ESC to exit • Auto-advancing in 4s
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  const muteBtn = document.getElementById('wrapped-mute-btn');
  if (muteBtn) {
    muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMute();
    });
  }
  
  overlay.addEventListener('click', (e) => {
    
    if (e.target.closest('#wrapped-mute-btn')) return;
    
    const rect = overlay.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    if (x < rect.width / 2) {
      previousSlide();
    } else {
      nextSlide();
    }
  });
}

async function fetchWrappedData() {
  const container = document.getElementById('wrapped-slides-container');
  if (!container) return;
  
  try {
    const username = getCurrentUsername();
    if (!username) {
      throw new Error('Could not determine username');
    }
    
    wrappedStats = await calculateWrappedStats(username);
    renderSlides();
    startAutoPlay();
    
  } catch (error) {
    console.error('Failed to load wrapped stats:', error);
    container.innerHTML = `
      <div style="
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
        color: white;
        font-family: 'Phantom Sans', system-ui, -apple-system, sans-serif;
      ">
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
          <div style="font-size: 28px; font-weight: bold; margin-bottom: 12px;">
            Failed to Load Wrapped
          </div>
          <div style="font-size: 18px; opacity: 0.9;">
            ${error.message}
          </div>
          <button onclick="document.getElementById('ms-wrapped-overlay').remove()" style="
            margin-top: 30px;
            padding: 12px 24px;
            font-size: 16px;
            background: white;
            color: #dc2626;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          ">
            Close
          </button>
        </div>
      </div>
    `;
  }
}

function getCurrentUsername() {
  const userNameElement = document.querySelector('.user-name');
  if (userNameElement) {
    return userNameElement.textContent.trim();
  }
  
  const storedUsername = localStorage.getItem('siege_username');
  if (storedUsername) return storedUsername;
  
  return null;
}

async function calculateWrappedLeaderboard(leaderboard, BASE_URL) {
  console.log('Calculating wrapped leaderboard with total earned coins...');
  
  const userCoinsPromises = leaderboard.map(async (userEntry) => {
    try {
      const userResponse = await fetch(`${BASE_URL}/api/public-beta/user/${userEntry.userId}`);
      if (!userResponse.ok) return null;
      
      const userData = await userResponse.json();
      
      const projectDetails = await Promise.all(
        userData.projects.map(async p => {
          try {
            const response = await fetch(`${BASE_URL}/api/public-beta/project/${p.id}`);
            if (!response.ok) return null;
            return await response.json();
          } catch (e) {
            return null;
          }
        })
      );
      
      const validProjects = projectDetails.filter(p => p && p.hours > 0);
      const totalEarnedCoins = validProjects.reduce((sum, p) => sum + parseFloat(p.coin_value || 0), 0);
      
      return {
        userId: userEntry.userId,
        username: userEntry.username,
        display_name: userEntry.display_name,
        totalEarnedCoins
      };
    } catch (e) {
      console.warn('Failed to calculate coins for user:', userEntry.userId, e);
      return null;
    }
  });
  
  const usersWithCoins = (await Promise.all(userCoinsPromises)).filter(u => u !== null);
  usersWithCoins.sort((a, b) => b.totalEarnedCoins - a.totalEarnedCoins);
  
  console.log('Wrapped leaderboard calculated:', usersWithCoins.length, 'users');
  return usersWithCoins;
}

async function calculateWrappedStats(username) {
  const BASE_URL = 'https://siege.hackclub.com';
  
  const leaderboard = await getLeaderboard();
  
  const userEntry = leaderboard.find(u => 
    u.username?.toLowerCase() === username.toLowerCase() ||
    u.display_name?.toLowerCase() === username.toLowerCase() ||
    u.name?.toLowerCase() === username.toLowerCase()
  );
  
  if (!userEntry || !userEntry.userId) {
    throw new Error('User not found in leaderboard');
  }
  
  const userId = userEntry.userId;
  
  const userResponse = await fetch(`${BASE_URL}/api/public-beta/user/${userId}`);
  const user = await userResponse.json();
  
  const projectDetails = await Promise.all(
    user.projects.map(async p => {
      const response = await fetch(`${BASE_URL}/api/public-beta/project/${p.id}`);
      return await response.json();
    })
  );
  
  const validProjects = projectDetails.filter(p => p.hours > 0);
  
  const weeklyData = {};
  validProjects.forEach(project => {
    const week = project.week_badge_text || 'Unknown';
    if (!weeklyData[week]) {
      weeklyData[week] = { projects: 0, hours: 0, coins: 0 };
    }
    weeklyData[week].projects++;
    weeklyData[week].hours += project.hours;
    weeklyData[week].coins += parseFloat(project.coin_value || 0);
  });
  
  const sortedWeeks = Object.keys(weeklyData).sort((a, b) => {
    const weekA = parseInt(a.match(/\d+/)?.[0] || 0);
    const weekB = parseInt(b.match(/\d+/)?.[0] || 0);
    return weekA - weekB;
  });
  
  const totalHours = validProjects.reduce((sum, p) => sum + p.hours, 0);
  const totalProjects = validProjects.length;
  
  const totalCoins = validProjects.reduce((sum, p) => sum + parseFloat(p.coin_value || 0), 0);
  
  console.log('Total coins earned:', totalCoins, 'from', validProjects.length, 'projects');
  
  const mostAmbitiousProject = validProjects.reduce((max, p) => 
    p.hours > (max?.hours || 0) ? p : max, null
  );
  
  const bestEarningProject = validProjects.reduce((max, p) => {
    const ratio = parseFloat(p.coin_value || 0) / p.hours;
    const maxRatio = max ? parseFloat(max.coin_value || 0) / max.hours : 0;
    return ratio > maxRatio ? p : max;
  }, null);
  
  const pillagingWeeks = Object.values(weeklyData).filter(w => w.hours >= 10).length;
  const frameworkEligible = pillagingWeeks >= 10;
  
  
  console.log('User status from API:', user.status, 'Type:', typeof user.status);
  
  const siegeSuccessful = user.status !== 'out';
  const wrappedLeaderboard = await calculateWrappedLeaderboard(leaderboard, BASE_URL);
  const userRank = wrappedLeaderboard.findIndex(u => u.userId === userId) + 1;
  const totalUsers = wrappedLeaderboard.length;
  const percentile = userRank ? Math.round((1 - userRank / totalUsers) * 100) : 0;
  
  let hackatimeStats = null;
  if (user.slack_id) {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'FETCH_HACKATIME_STATS',
        slackId: user.slack_id
      });
      
      if (response.success) {
        hackatimeStats = response.data;
      }
    } catch (e) {
      console.warn('Could not fetch Hackatime stats:', e);
    }
  }
  
  return {
    user: {
      name: user.name,
      displayName: user.display_name,
      coins: totalCoins,
      status: user.status,
      siegeSuccessful
    },
    overview: {
      totalProjects,
      totalHours: totalHours.toFixed(1),
      weeksParticipated: sortedWeeks.length,
      averageHoursPerProject: totalProjects > 0 ? (totalHours / totalProjects).toFixed(1) : 0
    },
    ranking: {
      position: userRank,
      totalUsers,
      percentile
    },
    projects: {
      mostAmbitious: mostAmbitiousProject ? {
        name: mostAmbitiousProject.name,
        hours: mostAmbitiousProject.hours.toFixed(1)
      } : null,
      bestEarning: bestEarningProject ? {
        name: bestEarningProject.name,
        coinsPerHour: (parseFloat(bestEarningProject.coin_value || 0) / bestEarningProject.hours).toFixed(1)
      } : null
    },
    weekly: {
      pillagingWeeks,
      frameworkEligible,
      weeklyData
    },
    hackatime: hackatimeStats
  };
}

function renderSlides() {
  const container = document.getElementById('wrapped-slides-container');
  const progressBar = document.getElementById('wrapped-progress-bar');
  if (!container || !wrappedStats) return;
  
  const slides = [
    renderIntroSlide(),
    renderOverviewSlide(),
    renderForgeSlide(),
    renderTreasurySlide(),
    renderArmorySlide(),
    renderFinalSlide(),
    renderSummarySlide()
  ];
  
  progressBar.innerHTML = slides.map((_, i) => `
    <div class="progress-segment" data-index="${i}" style="
      flex: 1;
      height: 100%;
      background: ${i === 0 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)'};
      transition: background 0.3s ease;
      border-radius: 2px;
    "></div>
  `).join('');
  
  const slideBackgrounds = [
    'linear-gradient(135deg, #dc2626 0%, #ea580c 100%)',
    'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
    'linear-gradient(135deg, #dc2626 0%, #ea580c 100%)',
    'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
    'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
  ];
  
  container.innerHTML = slides.map((slide, i) => `
    <div class="wrapped-slide" data-index="${i}" style="
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: ${i === 0 ? '1' : '0'};
      transform: scale(${i === 0 ? '1' : '0.95'});
      transition: opacity 0.6s ease, transform 0.6s ease;
      pointer-events: ${i === 0 ? 'auto' : 'none'};
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${slideBackgrounds[i]};
      color: white;
      font-family: 'Phantom Sans', system-ui, -apple-system, sans-serif;
    ">
      ${slide}
    </div>
  `).join('');
}

function renderIntroSlide() {
  return `
    <div style="text-align: center; padding: 40px; max-width: 800px;">
      <img src="${chrome.runtime.getURL('assets/mystereeple.webp')}" 
           onerror="this.style.display='none'"
           style="width: 150px; height: auto; margin-bottom: 30px; opacity: 0.95; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.4));" />
      <h1 style="
        font-size: 56px;
        font-weight: 800;
        margin: 0 0 20px 0;
        line-height: 1.2;
      ">
        Noble ${wrappedStats.user.displayName}
      </h1>
      <p style="
        font-size: 28px;
        opacity: 0.95;
        margin: 0;
        font-weight: 500;
      ">
        Your Legendary Siege Journey
      </p>
    </div>
  `;
}

function renderOverviewSlide() {
  const { totalProjects, weeksParticipated } = wrappedStats.overview;
  
  return `
    <div style="text-align: center; padding: 40px; max-width: 900px;">
      <img src="${chrome.runtime.getURL('assets/mini-castle.webp')}" 
           onerror="this.style.display='none'"
           style="width: 100px; height: auto; margin-bottom: 30px; opacity: 0.95; filter: brightness(1.2);" />
      <h2 style="
        font-size: 48px;
        font-weight: 800;
        margin: 0 0 40px 0;
      ">
        The Siege
      </h2>
      <div style="
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40px;
        margin-top: 60px;
      ">
        <div>
          <div style="
            font-size: 72px;
            font-weight: 900;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          ">
            ${totalProjects}
          </div>
          <div style="font-size: 24px; opacity: 0.9;">
            ${totalProjects === 1 ? 'Project' : 'Projects'} Shipped
          </div>
        </div>
        <div>
          <div style="
            font-size: 72px;
            font-weight: 900;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          ">
            ${weeksParticipated}
          </div>
          <div style="font-size: 24px; opacity: 0.9;">
            ${weeksParticipated === 1 ? 'Week' : 'Weeks'} of Siege
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderForgeSlide() {
  const { totalHours, averageHoursPerProject } = wrappedStats.overview;
  
  return `
    <div style="text-align: center; padding: 40px; max-width: 800px;">
      <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="margin-bottom: 30px; opacity: 0.95;">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
      </svg>
      <h2 style="
        font-size: 48px;
        font-weight: 800;
        margin: 0 0 40px 0;
      ">
        The Forge
      </h2>
      <div style="
        font-size: 96px;
        font-weight: 900;
        margin: 60px 0 20px 0;
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      ">
        ${totalHours}
      </div>
      <div style="font-size: 32px; opacity: 0.95; margin-bottom: 50px;">
        Total Hours Coded
      </div>
      <div style="
        font-size: 20px;
        opacity: 0.8;
        padding: 20px 30px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        display: inline-block;
      ">
        Average: ${averageHoursPerProject} hours per project
      </div>
    </div>
  `;
}

function renderTreasurySlide() {
  const { position, totalUsers, percentile } = wrappedStats.ranking;
  
  return `
    <div style="text-align: center; padding: 40px; max-width: 800px;">
      <img src="${chrome.runtime.getURL('assets/coin.png')}" 
           onerror="this.style.display='none'"
           style="width: 100px; height: auto; margin-bottom: 30px; opacity: 0.95; filter: brightness(1.2) drop-shadow(0 4px 12px rgba(251, 191, 36, 0.4));" />
      <h2 style="
        font-size: 48px;
        font-weight: 800;
        margin: 0 0 40px 0;
      ">
        The Treasury
      </h2>
      <div style="
        font-size: 96px;
        font-weight: 900;
        margin: 60px 0 20px 0;
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      ">
        ${wrappedStats.user.coins}
      </div>
      <div style="font-size: 32px; opacity: 0.95; margin-bottom: 30px;">
        Coins Earned
      </div>
      ${position ? `
        <div style="
          font-size: 20px;
          opacity: 0.8;
          padding: 20px 30px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          display: inline-block;
          margin-top: 20px;
        ">
          Rank #${position} of ${totalUsers} (Top ${percentile}%)
        </div>
      ` : ''}
    </div>
  `;
}

function renderArmorySlide() {
  const { mostAmbitious } = wrappedStats.projects;
  
  if (!mostAmbitious) {
    return `
      <div style="text-align: center; padding: 40px; max-width: 800px;">
        <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="margin-bottom: 30px; opacity: 0.95;">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        <h2 style="
          font-size: 48px;
          font-weight: 800;
          margin: 0;
        ">
          The Armory
        </h2>
        <p style="font-size: 24px; opacity: 0.8; margin-top: 40px;">
          Your journey awaits...
        </p>
      </div>
    `;
  }
  
  return `
    <div style="text-align: center; padding: 40px; max-width: 900px;">
      <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" style="margin-bottom: 30px; opacity: 0.95;">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <path d="M16 10a4 4 0 0 1-8 0"></path>
      </svg>
      <h2 style="
        font-size: 48px;
        font-weight: 800;
        margin: 0 0 40px 0;
      ">
        The Armory
      </h2>
      <div style="
        font-size: 20px;
        opacity: 0.7;
        margin-bottom: 30px;
        letter-spacing: 2px;
        text-transform: uppercase;
      ">
        Most Ambitious Project
      </div>
      <div style="
        font-size: 36px;
        font-weight: 700;
        margin-bottom: 30px;
        line-height: 1.4;
      ">
        ${mostAmbitious.name}
      </div>
      <div style="
        font-size: 72px;
        font-weight: 900;
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        margin-top: 30px;
      ">
        ${mostAmbitious.hours} hours
      </div>
    </div>
  `;
}

function renderFinalSlide() {
  const { pillagingWeeks, frameworkEligible } = wrappedStats.weekly;
  const { topLanguage } = wrappedStats.hackatime || {};
  const { siegeSuccessful, status } = wrappedStats.user;
  
  return `
    <div style="text-align: center; padding: 40px; max-width: 800px;">
      <img src="${chrome.runtime.getURL('assets/castle.webp')}" 
           onerror="this.style.display='none'"
           style="width: 120px; height: auto; margin-bottom: 30px; opacity: 0.95; filter: brightness(1.2);" />
      <h2 style="
        font-size: 48px;
        font-weight: 800;
        margin: 0 0 40px 0;
      ">
        The Legend
      </h2>
      
      <div style="
        margin-bottom: 40px;
        padding: 25px 35px;
        background: ${siegeSuccessful 
          ? 'rgba(34, 197, 94, 0.2)' 
          : 'rgba(239, 68, 68, 0.2)'};
        border: 3px solid ${siegeSuccessful 
          ? 'rgba(34, 197, 94, 0.6)' 
          : 'rgba(239, 68, 68, 0.6)'};
        border-radius: 12px;
        font-size: 28px;
        font-weight: 700;
        letter-spacing: 1px;
      ">
        ${siegeSuccessful 
          ? 'Siege Successful!' 
          : 'Siege Incomplete'}
      </div>
      <div style="margin: 40px 0;">
        <div style="
          font-size: 96px;
          font-weight: 900;
          margin-bottom: 20px;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        ">
          ${pillagingWeeks}
        </div>
        <div style="font-size: 28px; opacity: 0.9;">
          Pillaging Weeks
        </div>
        <div style="font-size: 16px; opacity: 0.7; margin-top: 8px;">
          (10+ hours each)
        </div>
      </div>
      ${topLanguage ? `
        <div style="
          font-size: 20px;
          opacity: 0.8;
          padding: 15px 25px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          display: inline-block;
          margin-top: 20px;
        ">
          Top Language: ${topLanguage.name} (${topLanguage.percent.toFixed(1)}%)
        </div>
      ` : ''}
      <div style="
        margin-top: 40px;
        padding: 25px 35px;
        background: ${frameworkEligible && siegeSuccessful
          ? 'rgba(34, 197, 94, 0.2)' 
          : frameworkEligible
          ? 'rgba(251, 191, 36, 0.2)'
          : 'rgba(251, 191, 36, 0.2)'};
        border: 3px solid ${frameworkEligible && siegeSuccessful
          ? 'rgba(34, 197, 94, 0.6)' 
          : frameworkEligible
          ? 'rgba(251, 191, 36, 0.6)'
          : 'rgba(251, 191, 36, 0.6)'};
        border-radius: 12px;
        font-size: 24px;
        font-weight: 700;
        letter-spacing: 1px;
      ">
        ${frameworkEligible && siegeSuccessful
          ? 'Congrats! You Get a Laptop!' 
          : frameworkEligible
          ? 'Framework Laptop Eligible!'
          : 'Keep Going for Framework!'}
      </div>
    </div>
  `;
}

function renderSummarySlide() {
  const { siegeSuccessful } = wrappedStats.user;
  const { totalProjects, totalHours, weeksParticipated } = wrappedStats.overview;
  const { position, totalUsers } = wrappedStats.ranking;
  const { pillagingWeeks, frameworkEligible } = wrappedStats.weekly;
  const { mostAmbitious, bestEarning } = wrappedStats.projects;
  const { topLanguage } = wrappedStats.hackatime || {};
  
  return `
    <div id="wrapped-summary-card" style="
      text-align: center; 
      padding: 60px 50px; 
      max-width: 900px; 
      position: relative;
      background: url('${chrome.runtime.getURL('assets/scroll.webp')}');
      background-size: cover;
      background-position: center;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
      font-family: 'IM Fell English', serif;
      color: #2d1f1a;
    ">
      <h2 style="
        font-size: 56px;
        font-weight: 700;
        margin: 0 0 15px 0;
        color: #1a0f0a;
        text-shadow: 2px 2px 4px rgba(139, 99, 63, 0.3);
        font-family: 'IM Fell English', serif;
      ">
        Siege Wrapped 2024
      </h2>
      <p style="font-size: 22px; margin-bottom: 40px; color: #4a3428; font-family: 'IM Fell English', serif; font-weight: 600;">
        ${wrappedStats.user.displayName}'s Journey
      </p>
      
      <div style="
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin-bottom: 30px;
      ">
        <div style="
          background: ${siegeSuccessful 
            ? 'rgba(139, 99, 63, 0.25)' 
            : 'rgba(139, 69, 63, 0.25)'};
          border: 3px solid ${siegeSuccessful ? '#8b633f' : '#8b453f'};
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        ">
          <div style="font-size: 16px; letter-spacing: 2px; margin-bottom: 10px; font-family: 'IM Fell English', serif; color: #3a2618;">Status</div>
          <div style="font-size: 28px; font-weight: 700; font-family: 'IM Fell English', serif; color: #1a0f0a;">${siegeSuccessful ? 'Active' : 'Out'}</div>
        </div>
        
        <div style="
          background: rgba(184, 134, 11, 0.25);
          border: 3px solid #b8860b;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        ">
          <div style="font-size: 16px; letter-spacing: 2px; margin-bottom: 10px; font-family: 'IM Fell English', serif; color: #3a2618;">Coins</div>
          <div style="font-size: 36px; font-weight: 700; font-family: 'IM Fell English', serif; color: #1a0f0a;">${wrappedStats.user.coins}</div>
        </div>
        
        <div style="
          background: rgba(101, 67, 33, 0.25);
          border: 3px solid #654321;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        ">
          <div style="font-size: 16px; letter-spacing: 2px; margin-bottom: 10px; font-family: 'IM Fell English', serif; color: #3a2618;">Rank</div>
          <div style="font-size: 28px; font-weight: 700; font-family: 'IM Fell English', serif; color: #1a0f0a;">#${position} / ${totalUsers}</div>
        </div>
        
        <div style="
          background: rgba(139, 99, 63, 0.25);
          border: 3px solid #8b633f;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        ">
          <div style="font-size: 16px; letter-spacing: 2px; margin-bottom: 10px; font-family: 'IM Fell English', serif; color: #3a2618;">Hours</div>
          <div style="font-size: 36px; font-weight: 700; font-family: 'IM Fell English', serif; color: #1a0f0a;">${totalHours}</div>
        </div>
        
        <div style="
          background: rgba(85, 107, 47, 0.25);
          border: 3px solid #556b2f;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        ">
          <div style="font-size: 16px; letter-spacing: 2px; margin-bottom: 10px; font-family: 'IM Fell English', serif; color: #3a2618;">Projects</div>
          <div style="font-size: 36px; font-weight: 700; font-family: 'IM Fell English', serif; color: #1a0f0a;">${totalProjects}</div>
        </div>
        
        <div style="
          background: rgba(139, 69, 19, 0.25);
          border: 3px solid #8b4513;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
        ">
          <div style="font-size: 16px; letter-spacing: 2px; margin-bottom: 10px; font-family: 'IM Fell English', serif; color: #3a2618;">Pillaging</div>
          <div style="font-size: 36px; font-weight: 700; font-family: 'IM Fell English', serif; color: #1a0f0a;">${pillagingWeeks}/14</div>
        </div>
      </div>
      
      ${mostAmbitious ? `
        <div style="
          background: rgba(139, 99, 63, 0.2);
          border: 2px solid #8b633f;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 15px;
          text-align: left;
        ">
          <div style="font-size: 14px; margin-bottom: 8px; font-family: 'IM Fell English', serif; color: #4a3428; letter-spacing: 1px;">Most Ambitious Project</div>
          <div style="font-size: 22px; font-weight: 700; font-family: 'IM Fell English', serif; color: #1a0f0a;">${mostAmbitious.name}</div>
          <div style="font-size: 18px; margin-top: 5px; font-family: 'IM Fell English', serif; color: #3a2618;">${mostAmbitious.hours} hours</div>
        </div>
      ` : ''}
      
      ${topLanguage ? `
        <div style="
          background: rgba(139, 99, 63, 0.2);
          border: 2px solid #8b633f;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
          text-align: left;
        ">
          <div style="font-size: 14px; margin-bottom: 8px; font-family: 'IM Fell English', serif; color: #4a3428; letter-spacing: 1px;">Top Language</div>
          <div style="font-size: 22px; font-weight: 700; font-family: 'IM Fell English', serif; color: #1a0f0a;">${topLanguage.name} (${topLanguage.percent.toFixed(1)}%)</div>
        </div>
      ` : ''}
    </div>
  `;
}

function startAutoPlay() {
  stopAutoPlay();
  autoPlayInterval = setInterval(() => {
    if (currentSlideIndex < 6) {
      nextSlide();
    } else {
      stopAutoPlay();
    }
  }, 4000);
}

function stopAutoPlay() {
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval);
    autoPlayInterval = null;
  }
}

function goToSlide(index) {
  if (index < 0 || index > 6) return;
  
  stopAutoPlay();
  
  const oldSlide = document.querySelector(`.wrapped-slide[data-index="${currentSlideIndex}"]`);
  const newSlide = document.querySelector(`.wrapped-slide[data-index="${index}"]`);
  
  if (oldSlide) {
    oldSlide.style.opacity = '0';
    oldSlide.style.transform = 'scale(0.95)';
    oldSlide.style.pointerEvents = 'none';
  }
  
  if (newSlide) {
    newSlide.style.opacity = '1';
    newSlide.style.transform = 'scale(1)';
    newSlide.style.pointerEvents = 'auto';
  }
  
  document.querySelectorAll('.progress-segment').forEach((segment, i) => {
    segment.style.background = i <= index 
      ? 'rgba(255, 255, 255, 0.9)' 
      : 'rgba(255, 255, 255, 0.3)';
  });
  
  currentSlideIndex = index;
  
  playTone(450 + (index * 20), 0.03, 0.02);
  
  if (index < 6) {
    startAutoPlay();
  }
}

function nextSlide() {
  if (currentSlideIndex < 6) {
    goToSlide(currentSlideIndex + 1);
  }
}

function previousSlide() {
  if (currentSlideIndex > 0) {
    goToSlide(currentSlideIndex - 1);
  }
}

function handleKeyboardNavigation(e) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    nextSlide();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    previousSlide();
  }
}


