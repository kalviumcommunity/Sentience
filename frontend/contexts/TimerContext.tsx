import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { useUser } from './UserContext';
import { focusAPI } from '@/services/api';

interface FocusSession {
  _id: string;
  date: string;
  duration: number;
  type: 'work' | 'break';
}

interface TimerContextType {
  timeLeft: number;
  isActive: boolean;
  isWorking: boolean;
  workDuration: number;
  breakDuration: number;
  sessionsCompleted: number;
  totalFocusTime: number;
  soundEnabled: boolean;
  ambientSoundEnabled: boolean;
  distractionBlockerEnabled: boolean;
  startTimer: () => void;
  pauseTimer: () => void;
  toggleTimer: () => void;
  resetTimer: () => void;
  setWorkDuration: (duration: number) => void;
  setBreakDuration: (duration: number) => void;
  toggleSound: () => void;
  toggleAmbientSound: () => void;
  toggleDistractionBlocker: () => void;
  formatTime: (seconds: number) => string;
  formatTotalTime: (seconds: number) => string;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

interface TimerProviderProps {
  children: React.ReactNode;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  const { currentUser } = useUser();
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem('focus_time_left');
    return saved ? parseInt(saved) : 25 * 60; // 25 minutes default
  });
  const [isActive, setIsActive] = useState(() => {
    const saved = localStorage.getItem('focus_is_active');
    return saved ? JSON.parse(saved) : false;
  });
  const [isWorking, setIsWorking] = useState(() => {
    const saved = localStorage.getItem('focus_is_working');
    return saved ? JSON.parse(saved) : true;
  });
  const [workDuration, setWorkDuration] = useState(() => {
    const saved = localStorage.getItem('focus_work_duration');
    return saved ? parseInt(saved) : 25;
  });
  const [breakDuration, setBreakDuration] = useState(() => {
    const saved = localStorage.getItem('focus_break_duration');
    return saved ? parseInt(saved) : 5;
  });
  const [sessionsCompleted, setSessionsCompleted] = useState(() => {
    const saved = localStorage.getItem('focus_sessions_completed');
    return saved ? parseInt(saved) : 0;
  });
  const [totalFocusTime, setTotalFocusTime] = useState(() => {
    const saved = localStorage.getItem('focus_total_time');
    return saved ? parseInt(saved) : 0;
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('focus_sound_enabled');
    return saved ? JSON.parse(saved) : true;
  });
  const [ambientSoundEnabled, setAmbientSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('focus_ambient_sound_enabled');
    return saved ? JSON.parse(saved) : false;
  });
  const [distractionBlockerEnabled, setDistractionBlockerEnabled] = useState(() => {
    const saved = localStorage.getItem('focus_distraction_blocker');
    return saved ? JSON.parse(saved) : false;
  });

  const [apiAvailable, setApiAvailable] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Check API availability
  useEffect(() => {
    const checkAPI = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://sentience.onrender.com/api';
        const response = await fetch(`${apiUrl}/health`);
        setApiAvailable(response.ok);
      } catch {
        setApiAvailable(false);
      }
    };
    checkAPI();
  }, []);

  const saveFocusSession = useCallback(async (type: 'work' | 'break', duration: number) => {
    const sessionData = {
      date: new Date().toISOString(),
      duration,
      type
    };

    try {
      if (apiAvailable && currentUser) {
        await focusAPI.create(sessionData);
      } else {
        const session: FocusSession = {
          _id: Date.now().toString(),
          ...sessionData
        };
        const existingSessions: FocusSession[] = JSON.parse(localStorage.getItem('focusSessions') || '[]');
        localStorage.setItem('focusSessions', JSON.stringify([...existingSessions, session]));
      }

      // Accumulate total focus time for work sessions only (in seconds)
      if (type === 'work') {
        setTotalFocusTime(prev => prev + duration * 60);
      }

      window.dispatchEvent(new CustomEvent('dataUpdated'));
    } catch (error) {
      console.error('Error saving focus session:', error);
    }
  }, [apiAvailable, currentUser]);

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem('focus_work_duration', JSON.stringify(workDuration));
    localStorage.setItem('focus_break_duration', JSON.stringify(breakDuration));
    localStorage.setItem('focus_sound_enabled', JSON.stringify(soundEnabled));
    localStorage.setItem('focus_ambient_sound_enabled', JSON.stringify(ambientSoundEnabled));
    localStorage.setItem('focus_distraction_blocker', JSON.stringify(distractionBlockerEnabled));
    localStorage.setItem('focus_is_working', JSON.stringify(isWorking));
    localStorage.setItem('focus_time_left', JSON.stringify(timeLeft));
    localStorage.setItem('focus_is_active', JSON.stringify(isActive));
    localStorage.setItem('focus_sessions_completed', JSON.stringify(sessionsCompleted));
    localStorage.setItem('focus_total_time', JSON.stringify(totalFocusTime));
  }, [workDuration, breakDuration, soundEnabled, ambientSoundEnabled, distractionBlockerEnabled, isWorking, timeLeft, isActive, sessionsCompleted, totalFocusTime]);

  // Timer logic
  useEffect(() => {
    if (!isActive) return;

    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Ambient sound logic
    if (ambientSoundEnabled && isActive) {
             if (!audioContextRef.current) {
         audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
       }

      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      if (!noiseSourceRef.current) {
        // Generate 2 seconds of white noise
        const bufferSize = audioContextRef.current.sampleRate * 2;
        const buffer = audioContextRef.current.createBuffer(1, bufferSize, audioContextRef.current.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1; // white noise sample [-1, 1]
        }
        
        noiseSourceRef.current = audioContextRef.current.createBufferSource();
        noiseSourceRef.current.buffer = buffer;
        noiseSourceRef.current.loop = true; // loop seamlessly
        
        // Add a lowpass filter to make it sound like pleasant "brown noise" or rainfall
        const filter = audioContextRef.current.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.gain.setValueAtTime(0.05, audioContextRef.current.currentTime);
        
        noiseSourceRef.current.connect(filter);
        filter.connect(gainNodeRef.current);
        gainNodeRef.current.connect(audioContextRef.current.destination);
        noiseSourceRef.current.start();
      }
    } else {
      stopAmbientSound();
    }

    return () => {
      clearInterval(intervalId);
      stopAmbientSound();
    };
  }, [isActive, isWorking, ambientSoundEnabled, saveFocusSession]);

  const stopAmbientSound = () => {
    if (noiseSourceRef.current) {
      noiseSourceRef.current.stop();
      noiseSourceRef.current.disconnect();
      noiseSourceRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
  };

  // Handle timer completion
  useEffect(() => {
    if (isActive && timeLeft === 0) {
      if (isWorking) {
        setSessionsCompleted((prev) => prev + 1);
        setIsWorking(false);
        setTimeLeft(breakDuration * 60);
        
        // Save work session
        saveFocusSession('work', workDuration);
        
        stopAmbientSound();
        
        // Show notification
        if (Notification.permission === 'granted') {
          new Notification('Focus Session Complete!', {
            body: 'Time for a break. Great work!',
            icon: '/favicon.ico'
          });
        }
        
        if (soundEnabled) {
          // Play completion sound
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
          audio.play().catch(() => {});
        }
        
        toast({
          title: "Work session complete!",
          description: "Time for a break. Great work!",
        });
      } else {
        setIsWorking(true);
        setTimeLeft(workDuration * 60);
        
        // Save break session
        saveFocusSession('break', breakDuration);
        
        stopAmbientSound();
        
        // Show notification
        if (Notification.permission === 'granted') {
          new Notification('Break Complete!', {
            body: 'Time to get back to work!',
            icon: '/favicon.ico'
          });
        }
        
        if (soundEnabled) {
          // Play completion sound
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
          audio.play().catch(() => {});
        }
        
        toast({
          title: "Break complete!",
          description: "Time to get back to work!",
        });
      }
    }
  }, [timeLeft, isActive, isWorking, workDuration, breakDuration, soundEnabled, ambientSoundEnabled, saveFocusSession]);

  const startTimer = () => {
    setIsActive(true);
  };

  const pauseTimer = () => {
    setIsActive(false);
    stopAmbientSound();
  };

  const toggleTimer = () => {
    if (isActive) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(isWorking ? workDuration * 60 : breakDuration * 60);
    stopAmbientSound();
  };

  const handleSetWorkDuration = (duration: number) => {
    setWorkDuration(duration);
    if (!isActive && isWorking) {
      setTimeLeft(duration * 60);
    }
  };

  const handleSetBreakDuration = (duration: number) => {
    setBreakDuration(duration);
    if (!isActive && !isWorking) {
      setTimeLeft(duration * 60);
    }
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  const toggleAmbientSound = () => {
    setAmbientSoundEnabled((prev) => !prev);
  };

  const toggleDistractionBlocker = () => {
    setDistractionBlockerEnabled((prev) => !prev);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const value: TimerContextType = {
    timeLeft,
    isActive,
    isWorking,
    workDuration,
    breakDuration,
    sessionsCompleted,
    totalFocusTime,
    soundEnabled,
    ambientSoundEnabled,
    distractionBlockerEnabled,
    startTimer,
    pauseTimer,
    toggleTimer,
    resetTimer,
    setWorkDuration: handleSetWorkDuration,
    setBreakDuration: handleSetBreakDuration,
    toggleSound,
    toggleAmbientSound,
    toggleDistractionBlocker,
    formatTime,
    formatTotalTime,
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}; 