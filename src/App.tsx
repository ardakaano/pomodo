import { useState, useEffect, useCallback } from 'react'

interface TimerSettings {
  pomodoro: number
  shortBreak: number
  longBreak: number
}

interface Stats {
  completedPomodoros: number
  completedShortBreaks: number
  completedLongBreaks: number
}

// Load settings from localStorage or use defaults
const getInitialSettings = (): TimerSettings => {
  const saved = localStorage.getItem('timerSettings')
  return saved ? JSON.parse(saved) : {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15
  }
}

// Load stats from localStorage or use defaults
const getInitialStats = (): Stats => {
  const saved = localStorage.getItem('timerStats')
  return saved ? JSON.parse(saved) : {
    completedPomodoros: 0,
    completedShortBreaks: 0,
    completedLongBreaks: 0
  }
}

// Load theme preference from localStorage or use system preference
const getInitialTheme = (): 'light' | 'dark' => {
  const saved = localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function App() {
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState<'pomodoro' | 'shortBreak' | 'longBreak'>('pomodoro')
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<TimerSettings>(getInitialSettings)
  const [stats, setStats] = useState<Stats>(getInitialStats)
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getCurrentDuration = useCallback(() => {
    switch (mode) {
      case 'pomodoro':
        return settings.pomodoro * 60
      case 'shortBreak':
        return settings.shortBreak * 60
      case 'longBreak':
        return settings.longBreak * 60
    }
  }, [mode, settings])

  const getProgress = useCallback(() => {
    const totalDuration = getCurrentDuration()
    return ((totalDuration - timeLeft) / totalDuration) * 100
  }, [getCurrentDuration, timeLeft])

  const resetTimer = useCallback(() => {
    switch (mode) {
      case 'pomodoro':
        setTimeLeft(settings.pomodoro * 60)
        break
      case 'shortBreak':
        setTimeLeft(settings.shortBreak * 60)
        break
      case 'longBreak':
        setTimeLeft(settings.longBreak * 60)
        break
    }
    setIsRunning(false)
  }, [mode, settings])

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    setIsRunning(false)
    setStats(prev => {
      const newStats = {
        ...prev,
        completedPomodoros: mode === 'pomodoro' ? prev.completedPomodoros + 1 : prev.completedPomodoros,
        completedShortBreaks: mode === 'shortBreak' ? prev.completedShortBreaks + 1 : prev.completedShortBreaks,
        completedLongBreaks: mode === 'longBreak' ? prev.completedLongBreaks + 1 : prev.completedLongBreaks
      }
      localStorage.setItem('timerStats', JSON.stringify(newStats))
      return newStats
    })
  }, [mode])

  // Timer effect
  useEffect(() => {
    let interval: number | undefined

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      handleTimerComplete()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeLeft, handleTimerComplete])

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('timerSettings', JSON.stringify(settings))
  }, [settings])

  // Update theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const handleSettingChange = (key: keyof TimerSettings, value: string) => {
    const numValue = parseInt(value) || 1
    setSettings(prev => ({
      ...prev,
      [key]: Math.min(Math.max(numValue, 1), 60)
    }))
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  // Re-add keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input fields
      if (e.target instanceof HTMLInputElement) return

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault()
          setIsRunning(prev => !prev)
          break
        case 'r':
          e.preventDefault()
          resetTimer()
          break
        case '1':
          setMode('pomodoro')
          break
        case '2':
          setMode('shortBreak')
          break
        case '3':
          setMode('longBreak')
          break
        case 'escape':
          setShowSettings(prev => !prev)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [resetTimer, setIsRunning])

  return (
    <div className="min-h-screen relative">
      <button
        className="btn btn-secondary w-12 h-12 p-0 flex items-center justify-center fixed top-4 right-4"
        onClick={toggleTheme}
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-xl">
          <div className="flex justify-center mb-20">
            <div className="flex space-x-6">
              <div className="flex flex-col items-center space-y-3">
                <div className={`mode-indicator ${mode === 'pomodoro' ? 'mode-indicator-active' : ''}`} />
                <button
                  className="btn btn-secondary"
                  onClick={() => setMode('pomodoro')}
                >
                  Focus
                </button>
              </div>
              <div className="flex flex-col items-center space-y-3">
                <div className={`mode-indicator ${mode === 'shortBreak' ? 'mode-indicator-active' : ''}`} />
                <button
                  className="btn btn-secondary"
                  onClick={() => setMode('shortBreak')}
                >
                  Short Break
                </button>
              </div>
              <div className="flex flex-col items-center space-y-3">
                <div className={`mode-indicator ${mode === 'longBreak' ? 'mode-indicator-active' : ''}`} />
                <button
                  className="btn btn-secondary"
                  onClick={() => setMode('longBreak')}
                >
                  Long Break
                </button>
              </div>
            </div>
          </div>

          {showSettings ? (
            <div className="mb-20 space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-sm uppercase tracking-wider">Focus Time (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.pomodoro}
                  onChange={(e) => handleSettingChange('pomodoro', e.target.value)}
                  className="settings-input"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm uppercase tracking-wider">Short Break (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.shortBreak}
                  onChange={(e) => handleSettingChange('shortBreak', e.target.value)}
                  className="settings-input"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm uppercase tracking-wider">Long Break (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.longBreak}
                  onChange={(e) => handleSettingChange('longBreak', e.target.value)}
                  className="settings-input"
                />
              </div>
              <div className="stats-display mt-12 space-y-2">
                <p>Completed Sessions:</p>
                <p>• Pomodoros: {stats.completedPomodoros}</p>
                <p>• Short Breaks: {stats.completedShortBreaks}</p>
                <p>• Long Breaks: {stats.completedLongBreaks}</p>
                {stats.completedPomodoros > 0 && stats.completedPomodoros % 4 === 0 && mode === 'pomodoro' && (
                  <p className="mt-4">💡 Time for a long break!</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8 mb-20">
              <div className="timer-display text-center select-none">
                {formatTime(timeLeft)}
              </div>
              <div className="flex justify-center">
                <div className="progress-bar" style={{ width: '440px' }}>
                  <div 
                    className="progress-bar-fill"
                    style={{ width: `${getProgress()}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col items-center space-y-6">
            <div className="flex justify-center space-x-10">
              <button
                className="btn btn-primary min-w-36"
                onClick={() => setIsRunning(!isRunning)}
              >
                {isRunning ? 'Pause' : 'Start'}
              </button>
              <button
                className="btn btn-secondary min-w-36"
                onClick={resetTimer}
              >
                Reset
              </button>
            </div>
            
            <button
              className="btn btn-secondary min-w-36"
              onClick={() => setShowSettings(!showSettings)}
            >
              {showSettings ? 'Close' : 'Settings'}
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <div className="stats-display text-center">
          <p className="text-xs">Keyboard Shortcuts</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-2 text-xs">
            <p>Space — Start/Pause</p>
            <p>R — Reset Timer</p>
            <p>1/2/3 — Switch Mode</p>
            <p>Esc — Toggle Settings</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
