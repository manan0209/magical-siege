import { SIEGE_COLORS, SIEGE_FONTS, SIEGE_BORDERS } from '../utils/siege-theme.js';

export class WrappedModal {
  constructor() {
    this.modal = null;
    this.isOpen = false;
    this.currentSection = 0;
    this.sections = [];
    this.data = null;
  }

  create() {
    this.modal = document.createElement('div');
    this.modal.className = 'siege-wrapped-modal';
    this.modal.innerHTML = `
      <div class="siege-wrapped-modal-backdrop"></div>
      <div class="siege-wrapped-modal-container">
        <div class="siege-wrapped-modal-header">
          <h2 class="siege-wrapped-modal-title">Siege Wrapped</h2>
          <button class="siege-wrapped-modal-close" aria-label="Close">×</button>
        </div>
        <div class="siege-wrapped-modal-content">
          <div class="siege-wrapped-modal-body"></div>
        </div>
        <div class="siege-wrapped-modal-footer">
          <button class="siege-wrapped-nav-btn siege-wrapped-nav-prev" disabled>
            Previous
          </button>
          <div class="siege-wrapped-progress">
            <span class="siege-wrapped-progress-text">1 / 1</span>
            <div class="siege-wrapped-progress-bar">
              <div class="siege-wrapped-progress-fill"></div>
            </div>
          </div>
          <button class="siege-wrapped-nav-btn siege-wrapped-nav-next">
            Next
          </button>
        </div>
      </div>
    `;

    this.attachStyles();
    this.attachEventListeners();
    
    return this.modal;
  }

  attachStyles() {
    if (document.getElementById('siege-wrapped-modal-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'siege-wrapped-modal-styles';
    styles.textContent = `
      .siege-wrapped-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: none;
      }

      .siege-wrapped-modal.active {
        display: block;
      }

      .siege-wrapped-modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(4px);
      }

      .siege-wrapped-modal-container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 900px;
        max-height: 90vh;
        background: ${SIEGE_COLORS.parchment};
        border: ${SIEGE_BORDERS.primary};
        border-radius: 8px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .siege-wrapped-modal-header {
        padding: 24px 32px;
        border-bottom: ${SIEGE_BORDERS.primary};
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(to bottom, ${SIEGE_COLORS.parchment}, ${SIEGE_COLORS.parchmentDark});
      }

      .siege-wrapped-modal-title {
        font-family: ${SIEGE_FONTS.heading};
        font-size: 32px;
        color: ${SIEGE_COLORS.textPrimary};
        margin: 0;
        letter-spacing: 1px;
      }

      .siege-wrapped-modal-close {
        background: none;
        border: none;
        font-size: 36px;
        color: ${SIEGE_COLORS.textSecondary};
        cursor: pointer;
        padding: 0;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.2s ease;
      }

      .siege-wrapped-modal-close:hover {
        color: ${SIEGE_COLORS.textPrimary};
      }

      .siege-wrapped-modal-content {
        flex: 1;
        overflow-y: auto;
        padding: 32px;
      }

      .siege-wrapped-modal-body {
        min-height: 400px;
      }

      .siege-wrapped-modal-footer {
        padding: 20px 32px;
        border-top: ${SIEGE_BORDERS.primary};
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(to top, ${SIEGE_COLORS.parchment}, ${SIEGE_COLORS.parchmentDark});
      }

      .siege-wrapped-nav-btn {
        font-family: ${SIEGE_FONTS.primary};
        font-size: 16px;
        padding: 12px 24px;
        background: ${SIEGE_COLORS.parchment};
        color: ${SIEGE_COLORS.textPrimary};
        border: ${SIEGE_BORDERS.primary};
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 600;
      }

      .siege-wrapped-nav-btn:not(:disabled):hover {
        background: ${SIEGE_COLORS.accentBlue};
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      .siege-wrapped-nav-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .siege-wrapped-progress {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        flex: 1;
        max-width: 300px;
      }

      .siege-wrapped-progress-text {
        font-family: ${SIEGE_FONTS.primary};
        font-size: 14px;
        color: ${SIEGE_COLORS.textSecondary};
        font-weight: 600;
      }

      .siege-wrapped-progress-bar {
        width: 100%;
        height: 6px;
        background: ${SIEGE_COLORS.borderLight};
        border-radius: 3px;
        overflow: hidden;
      }

      .siege-wrapped-progress-fill {
        height: 100%;
        background: ${SIEGE_COLORS.accentBlue};
        transition: width 0.3s ease;
        width: 0%;
      }

      .siege-wrapped-section {
        animation: fadeInUp 0.5s ease;
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 768px) {
        .siege-wrapped-modal-container {
          width: 95%;
          max-height: 95vh;
        }

        .siege-wrapped-modal-header {
          padding: 16px 20px;
        }

        .siege-wrapped-modal-title {
          font-size: 24px;
        }

        .siege-wrapped-modal-content {
          padding: 20px;
        }

        .siege-wrapped-modal-footer {
          padding: 16px 20px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .siege-wrapped-progress {
          order: -1;
          width: 100%;
          max-width: none;
        }

        .siege-wrapped-nav-btn {
          flex: 1;
          min-width: 120px;
        }
      }
    `;

    document.head.appendChild(styles);
  }

  attachEventListeners() {
    const closeBtn = this.modal.querySelector('.siege-wrapped-modal-close');
    const backdrop = this.modal.querySelector('.siege-wrapped-modal-backdrop');
    const prevBtn = this.modal.querySelector('.siege-wrapped-nav-prev');
    const nextBtn = this.modal.querySelector('.siege-wrapped-nav-next');

    closeBtn.addEventListener('click', () => this.close());
    backdrop.addEventListener('click', () => this.close());
    prevBtn.addEventListener('click', () => this.navigatePrev());
    nextBtn.addEventListener('click', () => this.navigateNext());

    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      
      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'ArrowLeft') {
        this.navigatePrev();
      } else if (e.key === 'ArrowRight') {
        this.navigateNext();
      }
    });
  }

  open(data, sections) {
    this.data = data;
    this.sections = sections;
    this.currentSection = 0;

    if (!this.modal) {
      this.create();
      document.body.appendChild(this.modal);
    }

    this.renderSection();
    this.updateNavigation();
    this.modal.classList.add('active');
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.modal.classList.remove('active');
    this.isOpen = false;
    document.body.style.overflow = '';
  }

  navigatePrev() {
    if (this.currentSection > 0) {
      this.currentSection--;
      this.renderSection();
      this.updateNavigation();
    }
  }

  navigateNext() {
    if (this.currentSection < this.sections.length - 1) {
      this.currentSection++;
      this.renderSection();
      this.updateNavigation();
    }
  }

  renderSection() {
    const body = this.modal.querySelector('.siege-wrapped-modal-body');
    const section = this.sections[this.currentSection];
    
    if (typeof section === 'function') {
      body.innerHTML = section(this.data);
    } else {
      body.innerHTML = section;
    }

    body.scrollTop = 0;
  }

  updateNavigation() {
    const prevBtn = this.modal.querySelector('.siege-wrapped-nav-prev');
    const nextBtn = this.modal.querySelector('.siege-wrapped-nav-next');
    const progressText = this.modal.querySelector('.siege-wrapped-progress-text');
    const progressFill = this.modal.querySelector('.siege-wrapped-progress-fill');

    prevBtn.disabled = this.currentSection === 0;
    nextBtn.disabled = this.currentSection === this.sections.length - 1;

    if (this.currentSection === this.sections.length - 1) {
      nextBtn.textContent = 'Close';
      nextBtn.onclick = () => this.close();
    } else {
      nextBtn.textContent = 'Next';
      nextBtn.onclick = () => this.navigateNext();
    }

    progressText.textContent = `${this.currentSection + 1} / ${this.sections.length}`;
    
    const progress = ((this.currentSection + 1) / this.sections.length) * 100;
    progressFill.style.width = `${progress}%`;
  }

  destroy() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
    this.isOpen = false;
    document.body.style.overflow = '';
  }
}
