use std::env;
use std::fs::File;
use std::io::Write;
use std::process::Command;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn open_cash_drawer(printer_name: String) -> Result<String, String> {
    if printer_name.trim().is_empty() {
        return Err("Nombre de impresora vacío".into());
    }

    // Código ESC/POS para abrir la gaveta: ESC p m t1 t2
    let drawer_kick: [u8; 5] = [0x1B, 0x70, 0x00, 0x19, 0xFA];

    let temp_dir = env::temp_dir();
    let temp_file_path = temp_dir.join("drawer.bin");

    // Escribir los bytes en el archivo temporal
    if let Ok(mut file) = File::create(&temp_file_path) {
        if let Err(e) = file.write_all(&drawer_kick) {
            return Err(format!("Error al escribir comando: {}", e));
        }
    } else {
        return Err("No se pudo crear archivo temporal".into());
    }

    // Ejecutar el comando copy /B para imprimir en bruto (raw) en Windows
    let computer_name = env::var("COMPUTERNAME").unwrap_or_else(|_| "127.0.0.1".into());
    let printer_path = format!("\\\\{}\\{}", computer_name, printer_name);

    let output = Command::new("cmd")
        .args(&[
            "/C",
            "copy",
            "/B",
            temp_file_path.to_str().unwrap(),
            &printer_path,
        ])
        .output()
        .map_err(|e| format!("Error de ejecución: {}", e))?;

    if output.status.success() {
        Ok("Caja abierta correctamente".into())
    } else {
        let err_msg = String::from_utf8_lossy(&output.stderr);
        Err(format!("Error al enviar a impresora: {}", err_msg))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, open_cash_drawer])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
