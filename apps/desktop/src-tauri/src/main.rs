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
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![set_auth_token, get_auth_token, clear_auth_token])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
