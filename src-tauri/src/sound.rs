use std::thread;

static NOTIFICATION_WAV: &[u8] = include_bytes!("../resources/notification.wav");

pub fn play_notification() {
    thread::spawn(|| {
        let Ok(sink) = rodio::DeviceSinkBuilder::open_default_sink() else {
            return;
        };
        let cursor = std::io::Cursor::new(NOTIFICATION_WAV);
        let Ok(source) = rodio::Decoder::new(cursor) else {
            return;
        };
        let mixer = sink.mixer();
        let _ = mixer.add(source);
        // Keep the sink alive until sound finishes
        thread::sleep(std::time::Duration::from_secs(4));
        drop(sink);
    });
}
