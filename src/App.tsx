import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { TitleBar } from "./components/TitleBar";
import { ModeToggle } from "./components/ModeToggle";
import { SimpleInput } from "./components/SimpleInput";
import { PomodoroInput } from "./components/PomodoroInput";
import { CountdownDisplay } from "./components/CountdownDisplay";
import { CompletionOverlay } from "./components/CompletionOverlay";
import { MessageEditorDialog } from "./components/MessageEditorDialog";
import { SettingsPage } from "./components/SettingsPage";
import { useTimer } from "./hooks/useTimer";
import { TimerMode, PomodoroPhase, type PersistedSettings } from "./types";
import "./App.css";

const IS_MAC = navigator.userAgent.includes("Mac OS");

function App() {
  const timer = useTimer();
  const [showWorkMsgDialog, setShowWorkMsgDialog] = useState(false);
  const [showBreakMsgDialog, setShowBreakMsgDialog] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [openAtLogin, setOpenAtLogin] = useState(true);
  const [minimizeToTray, setMinimizeToTray] = useState(true);

  useEffect(() => {
    invoke<PersistedSettings>("load_settings").then((s) => {
      setOpenAtLogin(s.open_at_login);
      setMinimizeToTray(s.minimize_to_tray);
    });
  }, []);

  const handleMinimize = useCallback(() => {
    if (minimizeToTray) {
      if (IS_MAC) {
        invoke("hide_application");
      } else {
        getCurrentWindow().hide();
      }
    } else {
      getCurrentWindow().minimize();
    }
  }, [minimizeToTray]);

  const handleClose = useCallback(async () => {
    const canClose = await timer.canClose();
    if (canClose) {
      getCurrentWindow().close();
    }
  }, [timer]);

  const handleStart = useCallback(async () => {
    await timer.start();
  }, [timer]);

  // Restore window to its pre-overlay size/position
  const restoreWindow = useCallback(async () => {
    try {
      await invoke("exit_completion_view");
    } catch (e) {
      console.error("exit_completion_view failed:", e);
    }
  }, []);

  const handleContinue = useCallback(async () => {
    // Always hide overlay first — don't let restoreWindow errors block this
    setShowOverlay(false);
    await restoreWindow();
    if (timer.isPomodoroMode) {
      timer.startNextPhase();
    } else {
      timer.startNew();
    }
  }, [timer, restoreWindow]);

  const handleDismiss = useCallback(async () => {
    setShowOverlay(false);
    await restoreWindow();
    timer.dismissCompletion();
  }, [timer, restoreWindow]);

  const handleOpenSettings = useCallback(() => {
    invoke<PersistedSettings>("load_settings").then((s) => {
      setOpenAtLogin(s.open_at_login);
      setMinimizeToTray(s.minimize_to_tray);
    });
    setShowSettings(true);
  }, []);

  // Enter fullscreen when timer completes via native Rust command.
  // The command temporarily promotes activation policy to Regular (so macOS
  // allows fullscreen) then calls setFullscreen(true), then reverts on exit.
  const wasCompleted = useRef(timer.isCompleted);
  useEffect(() => {
    if (timer.isCompleted && !wasCompleted.current) {
      setShowOverlay(true);
      (async () => {
        const win = getCurrentWindow();
        await win.show();
        await win.setFocus();
        try {
          await invoke("enter_completion_view");
        } catch (e) {
          console.error("enter_completion_view failed:", e);
        }
      })();
    }
    wasCompleted.current = timer.isCompleted;
  }, [timer.isCompleted]);

  // Build phase badge text for overlay
  const phaseBadge = timer.isPomodoroMode
    ? timer.phase === PomodoroPhase.Work
      ? "WORK SESSION COMPLETE"
      : "BREAK COMPLETE"
    : null;

  const continueText = timer.isPomodoroMode
    ? timer.phase === PomodoroPhase.Work
      ? "Start Break"
      : "Start Work"
    : "Start New Timer";

  return (
    <div className="app-root">
      <div className="app-window">
        <TitleBar onMinimizeToTray={handleMinimize} onClose={handleClose} onOpenSettings={handleOpenSettings} onMinimize={handleMinimize} />

        <div className="app-content">
          {/* SETTINGS PAGE */}
          {showSettings && (
            <SettingsPage
              openAtLogin={openAtLogin}
              minimizeToTray={minimizeToTray}
              onBack={() => setShowSettings(false)}
              onSettingChange={(key, value) => {
                if (key === "open_at_login") setOpenAtLogin(value);
                if (key === "minimize_to_tray") setMinimizeToTray(value);
              }}
            />
          )}

          {/* SETUP STATE */}
          {!showSettings && timer.isSetup && (
            <div className="panel-setup">
              <div className="setup-header">
                <h1 className="setup-title">Set Your Timer</h1>
                <p className="setup-subtitle">Focus. Work. Rest.</p>
              </div>

              <ModeToggle
                isSimpleMode={timer.isSimpleMode}
                isPomodoroMode={timer.isPomodoroMode}
                onSwitchToSimple={() => timer.setMode(TimerMode.Simple)}
                onSwitchToPomodoro={() => timer.setMode(TimerMode.Pomodoro)}
              />

              {timer.isSimpleMode && (
                <>
                  <SimpleInput
                    minutesInput={timer.minutesInput}
                    secondsInput={timer.secondsInput}
                    onMinutesChange={timer.setMinutesInput}
                    onSecondsChange={timer.setSecondsInput}
                  />
                  <div className="field-group">
                    <label className="field-label">COMPLETION MESSAGE</label>
                    <input
                      type="text"
                      value={timer.customMessage}
                      onChange={(e) => timer.setCustomMessage(e.target.value)}
                      maxLength={200}
                      className="modern-input"
                    />
                  </div>
                </>
              )}

              {timer.isPomodoroMode && (
                <PomodoroInput
                  workMinutesInput={timer.workMinutesInput}
                  workSecondsInput={timer.workSecondsInput}
                  breakMinutesInput={timer.breakMinutesInput}
                  breakSecondsInput={timer.breakSecondsInput}
                  startingCycleInput={timer.startingCycleInput}
                  isStartingWithWork={timer.isStartingWithWork}
                  isStartingWithBreak={timer.isStartingWithBreak}
                  onWorkMinutesChange={timer.setWorkMinutesInput}
                  onWorkSecondsChange={timer.setWorkSecondsInput}
                  onBreakMinutesChange={timer.setBreakMinutesInput}
                  onBreakSecondsChange={timer.setBreakSecondsInput}
                  onStartingCycleChange={timer.setStartingCycleInput}
                  onStartWithWork={() => timer.setStartingPhase(PomodoroPhase.Work)}
                  onStartWithBreak={() => timer.setStartingPhase(PomodoroPhase.Break)}
                  onEditWorkMessage={() => setShowWorkMsgDialog(true)}
                  onEditBreakMessage={() => setShowBreakMsgDialog(true)}
                />
              )}

              {timer.hasValidationError && (
                <p className="validation-error">{timer.validationError}</p>
              )}

              <p className="countdown-preview">{timer.countdownDisplay}</p>

              <button className="btn btn-accent btn-full" onClick={handleStart}>
                Start Timer
              </button>
            </div>
          )}

          {/* RUNNING STATE */}
          {!showSettings && timer.isRunning && (
            <div className="panel-running">
              <CountdownDisplay
                countdownDisplay={timer.countdownDisplay}
                progress={timer.progress}
                isPomodoroMode={timer.isPomodoroMode}
                phase={timer.phase}
                phaseLabel={timer.phaseLabel}
                completedCycles={timer.completedCycles}
                customMessage={timer.customMessage}
              />

              <div className="running-buttons">
                <button className="btn btn-danger" onClick={timer.stop}>
                  Stop
                </button>
                <button className="btn btn-ghost" onClick={handleMinimize}>
                  Minimize
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN OVERLAY — rendered into document.body via portal so it
          escapes all parent stacking contexts (overflow:hidden, border-radius, etc.) */}
      {showOverlay && createPortal(
        <CompletionOverlay
          title={timer.completionTitle}
          subtitle={timer.completionSubtitle}
          phaseBadge={phaseBadge}
          completedCycles={timer.completedCycles}
          continueText={continueText}
          showContinue={true}
          onContinue={handleContinue}
          onDismiss={handleDismiss}
        />,
        document.body
      )}

      {/* MESSAGE EDITOR DIALOGS */}
      {showWorkMsgDialog && (
        <MessageEditorDialog
          title="Work Completion Message"
          subtitle="Shown when a work session ends"
          currentMessage={timer.workCompletionMessage}
          onSave={(msg) => {
            timer.setWorkCompletionMessage(msg);
            setShowWorkMsgDialog(false);
          }}
          onCancel={() => setShowWorkMsgDialog(false)}
        />
      )}

      {showBreakMsgDialog && (
        <MessageEditorDialog
          title="Break Completion Message"
          subtitle="Shown when a break session ends"
          currentMessage={timer.breakCompletionMessage}
          onSave={(msg) => {
            timer.setBreakCompletionMessage(msg);
            setShowBreakMsgDialog(false);
          }}
          onCancel={() => setShowBreakMsgDialog(false)}
        />
      )}
    </div>
  );
}

export default App;
