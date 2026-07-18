import { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { TimerState, TimerMode, PomodoroPhase, type TickEvent, type TimerStatus, type PersistedSettings } from "../types";

function formatCountdown(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function useTimer() {
  const [state, setState] = useState<TimerState>(TimerState.Setup);
  const [mode, setMode] = useState<TimerMode>(TimerMode.Simple);
  const [phase, setPhase] = useState<PomodoroPhase>(PomodoroPhase.Work);
  const [startingPhase, setStartingPhase] = useState<PomodoroPhase>(PomodoroPhase.Work);

  const [minutesInput, setMinutesInput] = useState("25");
  const [secondsInput, setSecondsInput] = useState("0");
  const [workMinutesInput, setWorkMinutesInput] = useState("25");
  const [workSecondsInput, setWorkSecondsInput] = useState("0");
  const [breakMinutesInput, setBreakMinutesInput] = useState("5");
  const [breakSecondsInput, setBreakSecondsInput] = useState("0");
  const [customMessage, setCustomMessage] = useState("Time to take a break!");
  const [workCompletionMessage, setWorkCompletionMessage] = useState("Great work! Time for a break.");
  const [breakCompletionMessage, setBreakCompletionMessage] = useState("Break's over. Let's get back to it!");
  const [startingCycleInput, setStartingCycleInput] = useState("0");
  const [completedCycles, setCompletedCycles] = useState(0);
  const [validationError, setValidationError] = useState("");
  const [countdownDisplay, setCountdownDisplay] = useState("25:00");
  const [progress, setProgress] = useState(0);
  const [completionTitle, setCompletionTitle] = useState("TIME'S UP!");
  const [completionSubtitle, setCompletionSubtitle] = useState("");

  const defaultValues = {
    mode: TimerMode.Simple as TimerMode,
    minutes: 25,
    seconds: 0,
    message: "",
    workMinutes: 25,
    workSeconds: 0,
    breakMinutes: 5,
    breakSeconds: 0,
    workMessage: "",
    breakMessage: "",
  };

  type LastValues = typeof defaultValues;
  const lastValues = useRef<LastValues>(defaultValues);

  const getLastValues = useCallback(() => lastValues.current, []);
  const setLastValues = useCallback((v: typeof lastValues.current) => {
    lastValues.current = v;
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const settings: PersistedSettings = await invoke("load_settings");
        setMinutesInput(String(settings.last_minutes));
        setSecondsInput(String(settings.last_seconds));
        setCustomMessage(settings.last_message);
        setWorkCompletionMessage(settings.work_completion_message);
        setBreakCompletionMessage(settings.break_completion_message);
        setWorkMinutesInput(String(settings.work_minutes));
        setWorkSecondsInput(String(settings.work_seconds));
        setBreakMinutesInput(String(settings.break_minutes));
        setBreakSecondsInput(String(settings.break_seconds));
        updatePreview();
      } catch {
        // Use defaults
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (state === TimerState.Setup) {
      updatePreview();
    }
  }, [minutesInput, secondsInput, workMinutesInput, workSecondsInput, breakMinutesInput, breakSecondsInput, startingPhase, mode, state]);

  useEffect(() => {
    const unlisteners: UnlistenFn[] = [];
    const setup = async () => {
      const un1 = await listen<TickEvent>("timer:tick", (event) => {
        setCountdownDisplay(formatCountdown(event.payload.remaining_seconds));
        setProgress(event.payload.progress);
      });
      unlisteners.push(un1);

      const un2 = await listen("timer:completed", () => {
        setProgress(1);
        invoke("play_notification");
        handleCompletion();
      });
      unlisteners.push(un2);
    };
    setup();
    return () => {
      unlisteners.forEach((u) => u());
    };
  }, [mode, phase, customMessage, workCompletionMessage, breakCompletionMessage]);

  function parsePositiveInt(s: string): number | null {
    const n = parseInt(s, 10);
    if (isNaN(n) || n < 0) return null;
    return n;
  }

  function validate(): string {
    if (mode === TimerMode.Simple) {
      const mins = parsePositiveInt(minutesInput);
      if (mins === null) return "Minutes must be a non-negative number";
      const secs = parsePositiveInt(secondsInput);
      if (secs === null || secs > 59) return "Seconds must be between 0 and 59";
      if (mins === 0 && secs === 0) return "Timer duration must be greater than zero";
    } else {
      const wm = parsePositiveInt(workMinutesInput);
      if (wm === null) return "Work minutes must be a non-negative number";
      const ws = parsePositiveInt(workSecondsInput);
      if (ws === null || ws > 59) return "Work seconds must be between 0 and 59";
      if (wm === 0 && ws === 0) return "Work duration must be greater than zero";
      const bm = parsePositiveInt(breakMinutesInput);
      if (bm === null) return "Break minutes must be a non-negative number";
      const bs = parsePositiveInt(breakSecondsInput);
      if (bs === null || bs > 59) return "Break seconds must be between 0 and 59";
      if (bm === 0 && bs === 0) return "Break duration must be greater than zero";
      const sc = parsePositiveInt(startingCycleInput);
      if (sc === null) return "Starting cycle must be a non-negative number";
    }
    return "";
  }

  function parseTotalSeconds(): number {
    if (mode === TimerMode.Simple) {
      return (parseInt(minutesInput, 10) || 0) * 60 + (parseInt(secondsInput, 10) || 0);
    }
    const currentPhase = state === TimerState.Setup ? startingPhase : phase;
    if (currentPhase === PomodoroPhase.Work) {
      return (parseInt(workMinutesInput, 10) || 0) * 60 + (parseInt(workSecondsInput, 10) || 0);
    }
    return (parseInt(breakMinutesInput, 10) || 0) * 60 + (parseInt(breakSecondsInput, 10) || 0);
  }

  function updatePreview() {
    const total = parseTotalSeconds();
    setCountdownDisplay(formatCountdown(total));
  }

  const handleCompletion = () => {
    if (mode === TimerMode.Pomodoro) {
      if (phase === PomodoroPhase.Work) {
        setCompletedCycles((c) => c + 1);
        setCompletionTitle("WORK COMPLETE!");
        setCompletionSubtitle(workCompletionMessage);
      } else {
        setCompletionTitle("BREAK OVER!");
        setCompletionSubtitle(breakCompletionMessage);
      }
    } else {
      setCompletionTitle("TIME'S UP!");
      setCompletionSubtitle(customMessage);
    }
    setState(TimerState.Completed);
  };

  const start = useCallback(async () => {
    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }
    if (parseTotalSeconds() <= 0) return;
    setValidationError("");

    const total = parseTotalSeconds();

    setLastValues({
      mode,
      minutes: parseInt(minutesInput, 10) || 0,
      seconds: parseInt(secondsInput, 10) || 0,
      message: customMessage,
      workMinutes: parseInt(workMinutesInput, 10) || 0,
      workSeconds: parseInt(workSecondsInput, 10) || 0,
      breakMinutes: parseInt(breakMinutesInput, 10) || 0,
      breakSeconds: parseInt(breakSecondsInput, 10) || 0,
      workMessage: workCompletionMessage,
      breakMessage: breakCompletionMessage,
    });

    try {
      await invoke("save_settings", {
        settings: {
          last_minutes: parseInt(minutesInput, 10) || 0,
          last_seconds: parseInt(secondsInput, 10) || 0,
          last_message: customMessage,
          work_completion_message: workCompletionMessage,
          break_completion_message: breakCompletionMessage,
          work_minutes: parseInt(workMinutesInput, 10) || 0,
          work_seconds: parseInt(workSecondsInput, 10) || 0,
          break_minutes: parseInt(breakMinutesInput, 10) || 0,
          break_seconds: parseInt(breakSecondsInput, 10) || 0,
          window_left: Number.NaN,
          window_top: Number.NaN,
        },
      });
    } catch {}

    if (mode === TimerMode.Pomodoro) {
      setPhase(startingPhase);
      const sc = parseInt(startingCycleInput, 10) || 0;
      setCompletedCycles(sc);
    }

    setProgress(0);
    setCountdownDisplay(formatCountdown(total));
    setState(TimerState.Running);
    invoke("start_timer", { totalSeconds: total });
  }, [mode, minutesInput, secondsInput, customMessage, workMinutesInput, workSecondsInput, breakMinutesInput, breakSecondsInput, workCompletionMessage, breakCompletionMessage, startingPhase, startingCycleInput, validate, parseTotalSeconds, setLastValues]);

  const stop = useCallback(() => {
    invoke("stop_timer");
    setProgress(0);
    setState(TimerState.Setup);
    setPhase(PomodoroPhase.Work);
    updatePreview();
  }, [updatePreview]);

  const startNextPhase = useCallback(() => {
    if (phase === PomodoroPhase.Work) {
      setPhase(PomodoroPhase.Break);
      const total = (parseInt(breakMinutesInput, 10) || 0) * 60 + (parseInt(breakSecondsInput, 10) || 0);
      setProgress(0);
      setState(TimerState.Running);
      invoke("start_timer", { totalSeconds: total });
    } else {
      setPhase(PomodoroPhase.Work);
      const total = (parseInt(workMinutesInput, 10) || 0) * 60 + (parseInt(workSecondsInput, 10) || 0);
      setProgress(0);
      setState(TimerState.Running);
      invoke("start_timer", { totalSeconds: total });
    }
  }, [phase, workMinutesInput, workSecondsInput, breakMinutesInput, breakSecondsInput]);

  const dismissCompletion = useCallback(() => {
    setState(TimerState.Setup);
    updatePreview();
  }, [updatePreview]);

  const startNew = useCallback(() => {
    invoke("stop_timer");
    setProgress(0);
    setPhase(PomodoroPhase.Work);
    setState(TimerState.Setup);
    updatePreview();
  }, [updatePreview]);

  const repeat = useCallback(async () => {
    const last = getLastValues();
    setMode(last.mode);
    setMinutesInput(String(last.minutes));
    setSecondsInput(String(last.seconds));
    setCustomMessage(last.message);
    setWorkMinutesInput(String(last.workMinutes));
    setWorkSecondsInput(String(last.workSeconds));
    setBreakMinutesInput(String(last.breakMinutes));
    setBreakSecondsInput(String(last.breakSeconds));
    setWorkCompletionMessage(last.workMessage);
    setBreakCompletionMessage(last.breakMessage);
    setPhase(PomodoroPhase.Work);
    setStartingPhase(PomodoroPhase.Work);
    setState(TimerState.Setup);
    setProgress(0);
    // Auto-start with last values
    const total = last.mode === TimerMode.Simple
      ? last.minutes * 60 + last.seconds
      : last.workMinutes * 60 + last.workSeconds;
    if (total > 0) {
      setProgress(0);
      setCountdownDisplay(formatCountdown(total));
      setState(TimerState.Running);
      invoke("start_timer", { totalSeconds: total });
    }
  }, [getLastValues]);

  const canClose = useCallback(async (): Promise<boolean> => {
    try {
      const status = await invoke<TimerStatus>("get_timer_status");
      if (status.is_running) {
        return window.confirm("A timer is currently running. Are you sure you want to exit?");
      }
    } catch {}
    return true;
  }, []);

  return {
    // State
    state,
    mode,
    phase,
    startingPhase,
    isSetup: state === TimerState.Setup,
    isRunning: state === TimerState.Running,
    isCompleted: state === TimerState.Completed,
    isSimpleMode: mode === TimerMode.Simple,
    isPomodoroMode: mode === TimerMode.Pomodoro,
    isWorkPhase: phase === PomodoroPhase.Work,
    isStartingWithWork: startingPhase === PomodoroPhase.Work,
    isStartingWithBreak: startingPhase === PomodoroPhase.Break,
    // Inputs
    minutesInput,
    secondsInput,
    workMinutesInput,
    workSecondsInput,
    breakMinutesInput,
    breakSecondsInput,
    customMessage,
    workCompletionMessage,
    breakCompletionMessage,
    startingCycleInput,
    completedCycles,
    validationError,
    hasValidationError: validationError !== "",
    countdownDisplay,
    progress,
    completionTitle,
    completionSubtitle,
    // Setters
    setMode: (m: TimerMode) => { setMode(m); setValidationError(""); },
    setMinutesInput,
    setSecondsInput,
    setWorkMinutesInput,
    setWorkSecondsInput,
    setBreakMinutesInput,
    setBreakSecondsInput,
    setCustomMessage,
    setWorkCompletionMessage,
    setBreakCompletionMessage,
    setStartingCycleInput,
    setStartingPhase,
    // Actions
    start,
    stop,
    startNextPhase,
    dismissCompletion,
    startNew,
    repeat,
    canClose,
    // Phase label
    phaseLabel: phase === PomodoroPhase.Work ? "WORK" : "BREAK",
  };
}
