use std::{sync::atomic::{AtomicBool, Ordering}, time::Duration};
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

/// Detect macOS dark mode by reading the system preference.
/// Returns true if the system is currently in dark mode.
fn is_dark_mode() -> bool {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("defaults")
            .args(["read", "-g", "AppleInterfaceStyle"])
            .output()
            .map(|o| String::from_utf8_lossy(&o.stdout).trim() == "Dark")
            .unwrap_or(false)
    }
    #[cfg(not(target_os = "macos"))]
    { false }
}

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show = MenuItemBuilder::with_id("show", "Show").build(app)?;
    let stop = MenuItemBuilder::with_id("stop", "Stop Timer").build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Exit").build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&show)
        .separator()
        .item(&stop)
        .separator()
        .item(&quit)
        .build()?;

    // Pick the right icon for the current appearance at startup
    let dark = is_dark_mode();
    let initial_icon = if dark {
        tauri::include_image!("icons/tray-icon-dark.png")   // white logo
    } else {
        tauri::include_image!("icons/tray-icon-light.png")  // black logo
    };

    let _tray = TrayIconBuilder::with_id("pomopivot-tray")
        .icon(initial_icon)
        .tooltip("PomoPivot")
        .menu(&menu)
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "stop" => {
                    if let Some(state) = app.try_state::<super::AppState>() {
                        let timer = state.timer.lock().unwrap();
                        timer.stop();
                    }
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                    // Accessory-policy apps need explicit activation to come to front
                    #[cfg(target_os = "macos")]
                    {
                        use objc2::msg_send;
                        use objc2::runtime::{AnyClass, NSObject};
                        unsafe {
                            if let Some(cls) = AnyClass::get(c"NSApplication") {
                                let ns_app: *mut NSObject = msg_send![cls, sharedApplication];
                                if !ns_app.is_null() {
                                    let _: () = msg_send![ns_app, activateIgnoringOtherApps: true];
                                }
                            }
                        }
                    }
                }
            }
        })
        .build(app)?;

    // Spawn a background thread that polls the system appearance every 2 seconds.
    // When dark/light mode changes, it swaps the tray icon to match.
    static IS_DARK: AtomicBool = AtomicBool::new(false);
    IS_DARK.store(dark, Ordering::Relaxed);

    let handle = app.clone();
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(Duration::from_secs(2));
            let now_dark = is_dark_mode();
            let was_dark = IS_DARK.load(Ordering::Relaxed);

            if now_dark != was_dark {
                IS_DARK.store(now_dark, Ordering::Relaxed);
                if let Some(tray) = handle.tray_by_id("pomopivot-tray") {
                    let icon = if now_dark {
                        tauri::include_image!("icons/tray-icon-dark.png")
                    } else {
                        tauri::include_image!("icons/tray-icon-light.png")
                    };
                    let _ = tray.set_icon(Some(icon));
                }
            }
        }
    });

    Ok(())
}
