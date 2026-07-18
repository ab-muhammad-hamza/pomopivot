use std::sync::atomic::{AtomicBool, AtomicI32, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use serde::Serialize;
use tauri::{AppHandle, Emitter};

#[derive(Clone, Serialize)]
pub struct TickPayload {
    pub remaining_seconds: i32,
    pub progress: f64,
}

pub struct TimerManager {
    remaining: Arc<AtomicI32>,
    total: Arc<AtomicI32>,
    running: Arc<AtomicBool>,
    handle: Mutex<Option<JoinHandle<()>>>,
}

impl TimerManager {
    pub fn new() -> Self {
        Self {
            remaining: Arc::new(AtomicI32::new(0)),
            total: Arc::new(AtomicI32::new(0)),
            running: Arc::new(AtomicBool::new(false)),
            handle: Mutex::new(None),
        }
    }

    pub fn is_running(&self) -> bool {
        self.running.load(Ordering::SeqCst)
    }

    pub fn get_remaining(&self) -> i32 {
        self.remaining.load(Ordering::SeqCst)
    }

    pub fn get_total(&self) -> i32 {
        self.total.load(Ordering::SeqCst)
    }

    pub fn get_progress(&self) -> f64 {
        let total = self.total.load(Ordering::SeqCst);
        if total == 0 {
            return 0.0;
        }
        1.0 - (self.remaining.load(Ordering::SeqCst) as f64 / total as f64)
    }

    pub fn start(&self, app_handle: AppHandle, total_seconds: i32) {
        if self.is_running() {
            return;
        }

        self.stop_inner();
        self.total.store(total_seconds, Ordering::SeqCst);
        self.remaining.store(total_seconds, Ordering::SeqCst);
        self.running.store(true, Ordering::SeqCst);

        let remaining = self.remaining.clone();
        let total = self.total.clone();
        let running = self.running.clone();

        let join_handle = thread::spawn(move || {
            while running.load(Ordering::SeqCst) {
                thread::sleep(std::time::Duration::from_secs(1));

                let prev = remaining.fetch_sub(1, Ordering::SeqCst);
                let new_val = prev - 1;

                if new_val <= 0 {
                    remaining.store(0, Ordering::SeqCst);
                    running.store(false, Ordering::SeqCst);
                    let _ = app_handle.emit(
                        "timer:tick",
                        TickPayload {
                            remaining_seconds: 0,
                            progress: 1.0,
                        },
                    );
                    let _ = app_handle.emit("timer:completed", ());
                    break;
                }

                let total_val = total.load(Ordering::SeqCst);
                let progress = if total_val > 0 {
                    1.0 - (new_val as f64 / total_val as f64)
                } else {
                    0.0
                };
                let _ = app_handle.emit(
                    "timer:tick",
                    TickPayload {
                        remaining_seconds: new_val,
                        progress,
                    },
                );
            }
        });

        *self.handle.lock().unwrap() = Some(join_handle);
    }

    pub fn stop(&self) {
        self.running.store(false, Ordering::SeqCst);
        self.stop_inner();
    }

    fn stop_inner(&self) {
        if let Some(handle) = self.handle.lock().unwrap().take() {
            let _ = handle.join();
        }
    }
}
