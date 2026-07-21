<img alt="Banner" src="public/cover.png"/>

<div align="center">

## PomoPivot

**The desktop timer that stays out of your way; simple focus sessions or full Pomodoro, always ready in your tray**

[![Release](https://img.shields.io/github/v/release/ab-muhammad-hamza/pomopivot.svg)](https://github.com/ab-muhammad-hamza/pomopivot/releases/)
[![License](https://img.shields.io/github/license/ab-muhammad-hamza/pomopivot.svg)](https://github.com/ab-muhammad-hamza/pomopivot/blob/main/LICENSE)
[![Stars](https://img.shields.io/github/stars/ab-muhammad-hamza/pomopivot.svg)](https://github.com/ab-muhammad-hamza/pomopivot/stargazers)
[![Issues](https://img.shields.io/github/issues/ab-muhammad-hamza/pomopivot.svg)](https://github.com/ab-muhammad-hamza/pomopivot/issues)

[Download for Mac](https://github.com/ab-muhammad-hamza/pomopivot/releases/download/v0.1.0-beta/PomoPivot.Beta.0.1.0.Aarch64.dmg) | [Download for Windows](https://github.com/ab-muhammad-hamza/pomopivot/releases/download/v0.1.0-beta/PomoPivot.Beta.0.1.0.x64-setup.exe) | [Report Bug](https://github.com/ab-muhammad-hamza/pomopivot/issues) | [Request Feature](https://github.com/ab-muhammad-hamza/pomopivot/issues)


</div>

## Features
- **Simple & Pomodoro modes:** quick countdown or structured work/break cycles
- **System tray integration:** minimizes to tray, runs in background with menu controls
- **Customizable durations:** set any minutes/seconds for work, breaks, and cycles
- **Personalized messages:** custom completion messages for each session type
- **Automatic fullscreen overlay:** grabs attention when time's up
- **Open at login:** auto-start with your machine
- **Minimize to tray option:** hide from dock or minimize normally
- **Dark theme:** clean, modern dark UI with macOS traffic-light controls

## 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/ab-muhammad-hamza/PomoPivot.git

# Navigate to the project directory
cd Pomopivot

# Install frontend dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for Production
npm run tauri build
```
Prerequisites: Rust (https://rustup.rs/) and Node.js (https://nodejs.org/) must be installed. On macOS, Xcode Command Line Tools are required. The built app will be in src-tauri/target/release/bundle/.

## 🔠 Languages and Technologies

![Rust](https://img.shields.io/badge/Rust-%23f74c00.svg?style=for-the-badge&logo=rust&logoColor=white)
![Tauri](https://img.shields.io/badge/tauri-%2325c8db.svg?style=for-the-badge&logo=tauri&logoColor=white)
![Typescript](https://img.shields.io/badge/typescript-%230078D6.svg?style=for-the-badge&logo=typescript&logoColor=white)

PomoPivot is primarily built using:

- **Rust**: The backend language used for system-level features — timer control, tray icon, file I/O, autostart, and audio notifications.  
- **Tauri**: The framework that wraps the web frontend into a native macOS/Windows desktop app with full system API access. 
- **TypeScript**: The core language used for frontend logic, state management, and UI behavior.  
- **React**: The library used for building the component-based user interface. 


## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## ChangeLog

```
v0.1-beta (21 July 2026)

- Beta Public Release

```