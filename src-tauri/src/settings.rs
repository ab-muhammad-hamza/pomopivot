use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersistedSettings {
    pub last_minutes: i32,
    pub last_seconds: i32,
    pub last_message: String,
    pub work_completion_message: String,
    pub break_completion_message: String,
    pub work_minutes: i32,
    pub work_seconds: i32,
    pub break_minutes: i32,
    pub break_seconds: i32,
    pub window_left: f64,
    pub window_top: f64,
    pub open_at_login: bool,
    pub minimize_to_tray: bool,
}

impl Default for PersistedSettings {
    fn default() -> Self {
        Self {
            last_minutes: 25,
            last_seconds: 0,
            last_message: "Time to take a break!".to_string(),
            work_completion_message: "Great work! Time for a break.".to_string(),
            break_completion_message: "Break's over. Let's get back to it!".to_string(),
            work_minutes: 25,
            work_seconds: 0,
            break_minutes: 5,
            break_seconds: 0,
            window_left: f64::NAN,
            window_top: f64::NAN,
            open_at_login: true,
            minimize_to_tray: true,
        }
    }
}

fn settings_path(app: &AppHandle) -> PathBuf {
    let mut path = app.path().app_data_dir().unwrap_or_else(|_| {
        std::path::PathBuf::from(".")
    });
    path.push("settings.json");
    path
}

pub fn load_settings(app: &AppHandle) -> PersistedSettings {
    let path = settings_path(app);
    if path.exists() {
        match std::fs::read_to_string(&path) {
            Ok(content) => {
                if let Ok(settings) = serde_json::from_str(&content) {
                    return settings;
                }
            }
            Err(_) => {}
        }
    }
    PersistedSettings::default()
}

pub fn save_settings(app: &AppHandle, settings: &PersistedSettings) {
    let path = settings_path(app);
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    if let Ok(content) = serde_json::to_string_pretty(settings) {
        let _ = std::fs::write(&path, content);
    }
}
