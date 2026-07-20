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
            load_settings,
            save_settings,
            set_autostart,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
