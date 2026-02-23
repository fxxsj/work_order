#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

const KEYRING_SERVICE: &str = "com.workorder.app";
const KEYRING_ACCOUNT: &str = "authToken";

fn keyring_entry() -> Result<keyring::Entry, String> {
  keyring::Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT).map_err(|e| e.to_string())
}

#[tauri::command]
fn set_auth_token(token: String) -> Result<(), String> {
  keyring_entry()?.set_password(&token).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_auth_token() -> Result<Option<String>, String> {
  match keyring_entry()?.get_password() {
    Ok(v) => Ok(Some(v)),
    Err(keyring::Error::NoEntry) => Ok(None),
    Err(e) => Err(e.to_string()),
  }
}

#[tauri::command]
fn clear_auth_token() -> Result<(), String> {
  match keyring_entry()?.delete_password() {
    Ok(()) => Ok(()),
    Err(keyring::Error::NoEntry) => Ok(()),
    Err(e) => Err(e.to_string()),
  }
}

fn main() {
  let download = tauri::CustomMenuItem::new("download".to_string(), "客户端下载");
  let show = tauri::CustomMenuItem::new("show".to_string(), "显示窗口");
  let hide = tauri::CustomMenuItem::new("hide".to_string(), "隐藏窗口");
  let quit = tauri::CustomMenuItem::new("quit".to_string(), "退出");

  let tray_menu = tauri::SystemTrayMenu::new()
    .add_item(download)
    .add_native_item(tauri::SystemTrayMenuItem::Separator)
    .add_item(show)
    .add_item(hide)
    .add_native_item(tauri::SystemTrayMenuItem::Separator)
    .add_item(quit);

  let tray = tauri::SystemTray::new().with_menu(tray_menu);

  tauri::Builder::default()
    .system_tray(tray)
    .on_system_tray_event(|app, event| match event {
      tauri::SystemTrayEvent::LeftClick { .. } => {
        if let Some(window) = app.get_window("main") {
          let _ = window.show();
          let _ = window.set_focus();
        }
      }
      tauri::SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
        "download" => {
          if let Some(window) = app.get_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
            let _ = window.eval(
              r#"
              try {
                if (location.hash && location.hash.startsWith('#/')) {
                  location.hash = '#/download'
                } else {
                  location.pathname = '/download'
                }
              } catch {}
              "#,
            );
          }
        }
        "show" => {
          if let Some(window) = app.get_window("main") {
            let _ = window.show();
            let _ = window.set_focus();
          }
        }
        "hide" => {
          if let Some(window) = app.get_window("main") {
            let _ = window.hide();
          }
        }
        "quit" => {
          app.exit(0);
        }
        _ => {}
      },
      _ => {}
    })
    .invoke_handler(tauri::generate_handler![set_auth_token, get_auth_token, clear_auth_token])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
