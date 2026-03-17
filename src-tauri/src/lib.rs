#[tauri::command]
fn get_cli_args() -> Vec<String> {
    std::env::args().collect()
}

#[tauri::command]
fn read_file_binary(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![get_cli_args, read_file_binary])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
