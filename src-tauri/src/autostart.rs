use std::path::PathBuf;
use tauri::AppHandle;

fn app_path() -> Option<PathBuf> {
    std::env::current_exe().ok()
}

fn bundle_id() -> &'static str {
    "com.pomopivot.desktop"
}

#[cfg(target_os = "macos")]
fn launch_agent_plist(app_exe: &std::path::Path) -> String {
    format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>{}</string>
    <key>ProgramArguments</key>
    <array>
        <string>{}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
</dict>
</plist>
"#,
        bundle_id(),
        app_exe.display()
    )
}

#[cfg(target_os = "macos")]
fn launch_agent_path() -> PathBuf {
    let mut path = dirs::home_dir().unwrap_or_default();
    path.push("Library/LaunchAgents");
    path.push(format!("{}.plist", bundle_id()));
    path
}

pub fn enable(app: &AppHandle) {
    let exe = match app_path() {
        Some(p) => p,
        None => return,
    };

    #[cfg(target_os = "macos")]
    {
        let plist = launch_agent_plist(&exe);
        let path = launch_agent_path();
        if let Some(parent) = path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        let _ = std::fs::write(&path, plist);
    }

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::ffi::OsStrExt;
        let key_path = r"Software\Microsoft\Windows\CurrentVersion\Run";
        let app_name = bundle_id();
        if let Ok(key) = winreg::RegKey::predef(winreg::enums::HKEY_CURRENT_USER)
            .open_subkey_with_flags(key_path, winreg::enums::KEY_SET_VALUE)
        {
            let _ = key.set_value(app_name, &exe.display().to_string());
        }
    }

    #[cfg(target_os = "linux")]
    {
        let desktop = format!(
            r#"[Desktop Entry]
Type=Application
Name=PomoPivot
Exec={}
X-GNOME-Autostart-enabled=true
"#,
            exe.display()
        );
        if let Some(home) = dirs::home_dir() {
            let path = home.join(".config/autostart/pomopivot.desktop");
            if let Some(parent) = path.parent() {
                let _ = std::fs::create_dir_all(parent);
            }
            let _ = std::fs::write(&path, desktop);
        }
    }

    let _ = app;
}

pub fn disable(app: &AppHandle) {
    #[cfg(target_os = "macos")]
    {
        let path = launch_agent_path();
        let _ = std::fs::remove_file(&path);
    }

    #[cfg(target_os = "windows")]
    {
        let key_path = r"Software\Microsoft\Windows\CurrentVersion\Run";
        let app_name = bundle_id();
        if let Ok(key) = winreg::RegKey::predef(winreg::enums::HKEY_CURRENT_USER)
            .open_subkey_with_flags(key_path, winreg::enums::KEY_SET_VALUE)
        {
            let _ = key.delete_value(app_name);
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Some(home) = dirs::home_dir() {
            let path = home.join(".config/autostart/pomopivot.desktop");
            let _ = std::fs::remove_file(&path);
        }
    }

    let _ = app;
}
