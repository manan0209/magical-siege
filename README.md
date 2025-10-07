# Magical Siege

**Week 6 Project for Siege**  
**Updated**: October 7, 2025

Make your siege magical, powerful, and maybe maybe.. beautiful with this extension.

---

## What is Magical Siege?

A Chrome extension that transforms the Siege experience by injecting powerful features directly into siege.hackclub.com. No popups, no separate interfaces - just pure enhancement of the website you already love.

---

## Features

### Live Deadline Countdown
Never miss a Monday midnight deadline with a real-time countdown widget showing days, hours, minutes, and seconds remaining in EDT timezone.

### Enhanced Progress Tracking
See your coding hours in beautiful charts with daily breakdowns, weekly comparisons, and productivity insights.

### Smart Project Assistant
Get intelligent help while creating projects with live URL validation, description quality checks, and submission readiness indicators.

### Powerful Voting Tools
Vote faster and fairer with keyboard shortcuts, batch processing, and helpful rating guidance.

### Intelligent Shopping Advisor
Make smart coin purchases with recommendations, device comparisons, and optimal upgrade paths.

### Beautiful Themes
Choose from Dark Mode, High Contrast, Minimal, or keep the classic medieval aesthetic - all matching Siege's visual style perfectly.

### And Much More
Keyboard shortcuts, desktop notifications, analytics dashboards, achievement tracking, and countless quality-of-life improvements.

---

## Installation

### From Chrome Web Store
Coming soon!

### Manual Installation (Development)
1. Clone this repository
2. Run `npm install`
3. Run `npm run build`
4. Open Chrome and go to `chrome://extensions/`
5. Enable "Developer mode"
6. Click "Load unpacked"
7. Select the `dist` folder

---

## Usage

1. Install the extension
2. Navigate to siege.hackclub.com
3. Log in to your Siege account
4. Features are automatically injected into the website
5. Click the extension icon to access settings

---

## Development

### Setup
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

### Project Structure
```
magical-siege/
├── manifest.json
├── content/
│   ├── main.js
│   ├── injectors/
│   └── components/
├── background/
├── popup/
└── styles/
```

---

## Technology Stack

- Manifest V3 Chrome Extension
- Vanilla JavaScript
- Tailwind CSS
- Chart.js for visualizations
- IndexedDB for storage

---

## Contributing

This is a Week 6 Siege project. Feel free to fork and make it your own!

---

## License

MIT License - See LICENSE file for details

---

## Acknowledgments

Built for Siege by Hack Club participants.  
Making the castle more magical, one commit at a time.

---

**Status**: Under Development  
**Week**: 6 of 10  
**Goal**: Ship by Monday midnight
