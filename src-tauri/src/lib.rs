mod autostart;
mod settings;
mod sound;
mod timer;
mod tray;

use std::sync::Mutex;
use serde::Serialize;
use tauri::{Manager, State};

pub struct AppState {
    pub timer: Mutex<timer::TimerManager>,
}

/// Stores the window's pre-fullscreen frame so exit_completion_view can restore it.
/// macOS does not reliably restore the correct frame after set_fullscreen(false)
/// when the window was hidden (tray) before fullscreen was entered.
static PREV_FRAME: Mutex<Option<(i32, i32, u32, u32)>> = Mutex::new(None);

#[derive(Serialize)]
struct TimerStatus {
    remaining_seconds: i32,
    total_seconds: i32,
    progress: f64,
    is_running: bool,
}

#[tauri::command]
fn start_timer(state: State<AppState>, app_handle: tauri::AppHandle, total_seconds: i32) {
    let timer = state.timer.lock().unwrap();
    timer.start(app_handle, total_seconds);
}

#[tauri::command]
fn stop_timer(state: State<AppState>) {
    let timer = state.timer.lock().unwrap();
    timer.stop();
}

#[tauri::command]
fn get_timer_status(state: State<AppState>) -> TimerStatus {
    let timer = state.timer.lock().unwrap();
    TimerStatus {
        remaining_seconds: timer.get_remaining(),
        total_seconds: timer.get_total(),
        progress: timer.get_progress(),
        is_running: timer.is_running(),
    }
}

#[tauri::command]
fn hide_application(_app: tauri::AppHandle) {
    #[cfg(target_os = "macos")]
    {
        use objc2::msg_send;
        use objc2::runtime::{AnyClass, NSObject};

        // Hide the entire app from the dock (NSApp hide:)
        unsafe {
            if let Some(cls) = AnyClass::get(c"NSApplication") {
                let shared_app: *mut NSObject = msg_send![cls, sharedApplication];
                if !shared_app.is_null() {
                    let _: () = msg_send![shared_app, hide: std::ptr::null_mut::<NSObject>()];
                }
            }
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        if let Some(window) = _app.get_webview_window("main") {
            let _ = window.minimize();
        }
    }
}

#[tauri::command]
fn play_notification() {
    sound::play_notification();
}

/// Resize the window to cover the full primary monitor and float above all other
/// windows. Works reliably regardless of macOS activation policy or fullscreen
/// state — no animation, no policy changes, no timing races.
#[tauri::command]
fn enter_completion_view(app: tauri::AppHandle) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };

    // Save current position + size so exit_completion_view can restore them.
    if let (Ok(pos), Ok(size)) = (window.outer_position(), window.outer_size()) {
        *PREV_FRAME.lock().unwrap() = Some((pos.x, pos.y, size.width, size.height));
    }

    // Bring the app to the front on macOS.
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

    // Prefer the monitor the window is currently on; fall back to primary.
    let monitor = window
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| window.primary_monitor().ok().flatten());

    if let Some(m) = monitor {
        let _ = window.set_always_on_top(true);
        let _ = window.set_position(tauri::PhysicalPosition::new(
            m.position().x,
            m.position().y,
        ));
        let _ = window.set_size(tauri::PhysicalSize::new(
            m.size().width,
            m.size().height,
        ));
    }
}

/// Restore the window to its pre-completion frame and stop floating.
#[tauri::command]
fn exit_completion_view(app: tauri::AppHandle) {
    let Some(window) = app.get_webview_window("main") else {
        return;
    };
    let _ = window.set_always_on_top(false);
    let prev = PREV_FRAME.lock().unwrap().take();
    if let Some((x, y, w, h)) = prev {
        let _ = window.set_position(tauri::PhysicalPosition::new(x, y));
        let _ = window.set_size(tauri::PhysicalSize::new(w, h));
    }
}

#[tauri::command]
fn load_settings(app_handle: tauri::AppHandle) -> settings::PersistedSettings {
    settings::load_settings(&app_handle)
}

#[tauri::command]
fn save_settings(
    app_handle: tauri::AppHandle,
    settings: settings::PersistedSettings,
) {
    settings::save_settings(&app_handle, &settings);
}

#[tauri::command]
fn set_autostart(app_handle: tauri::AppHandle, enabled: bool) {
    if enabled {
        autostart::enable(&app_handle);
    } else {
        autostart::disable(&app_handle);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            tray::setup_tray(app.handle())?;

            // Apply autostart based on saved setting
            let settings = settings::load_settings(app.handle());
            if settings.open_at_login {
                autostart::enable(app.handle());
            } else {
                autostart::disable(app.handle());
            }

            app.manage(AppState {
                timer: Mutex::new(timer::TimerManager::new()),
            });

            // Remove the dock icon — run as a tray-only (agent) app.
            // NSApplicationActivationPolicyAccessory (1) = no dock icon,
            // but windows still work and can be shown/focused via the tray.
            // This works in both dev mode and the production bundle.
            #[cfg(target_os = "macos")]
            {
                use objc2::msg_send;
                use objc2::runtime::{AnyClass, NSObject};
                unsafe {
                    if let Some(cls) = AnyClass::get(c"NSApplication") {
                        let shared_app: *mut NSObject = msg_send![cls, sharedApplication];
                        if !shared_app.is_null() {
                            let _: () = msg_send![shared_app, setActivationPolicy: 1i64];
                        }
                    }
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Save window position before hiding
                let app = window.app_handle();
                if let Ok(pos) = window.outer_position() {
                    let settings = settings::load_settings(&app);
                    let updated = settings::PersistedSettings {
                        window_left: pos.x as f64,
                        window_top: pos.y as f64,
                        ..settings
                    };
                    settings::save_settings(&app, &updated);
                }
                // Hide to tray instead of quitting
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            start_timer,
            stop_timer,
            get_timer_status,
            hide_application,
            play_notification,
            enter_completion_view,
            exit_completion_view,
            load_settings,
            save_settings,
            set_autostart,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
