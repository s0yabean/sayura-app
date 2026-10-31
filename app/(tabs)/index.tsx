import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Platform, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import { updateStreak, getCurrentAffirmation, moveToNextAffirmation, trackAffirmationSuccess } from '../utils/storage-firestore';
import { useFocusEffect } from '@react-navigation/native';
import { apiUrl } from '../../lib/api';

export default function RitualTab() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>();
  const [showRipple, setShowRipple] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [isProcessingComplete, setIsProcessingComplete] = useState(true);
  const [currentAffirmation, setCurrentAffirmation] = useState<string>('');
  const [currentAffirmationId, setCurrentAffirmationId] = useState<string>('');
  const [sessionAffirmationCount, setSessionAffirmationCount] = useState<number>(0);
  const [currentAffirmationRepeatCount, setCurrentAffirmationRepeatCount] = useState<number>(1);
  const [isRepeating, setIsRepeating] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [isNavigatingToNext, setIsNavigatingToNext] = useState<boolean>(false);
  const [voiceEnergy, setVoiceEnergy] = useState<'high' | 'medium' | 'low'>('medium');
  const [volumeReadings, setVolumeReadings] = useState<number[]>([]);
  const [baselineVolume, setBaselineVolume] = useState<number | null>(null);
  const [isButtonCooldown, setIsButtonCooldown] = useState<boolean>(false);
  const [lastButtonPress, setLastButtonPress] = useState<number>(0);
  const [recordingFailureCount, setRecordingFailureCount] = useState<number>(0);
  
  // Global recording reference for emergency cleanup
  const globalRecordingRef = useRef<Audio.Recording | null>(null);
  // Animation reference for cleanup
  const rotateAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  
  // Button cooldown settings - much shorter for better UX
  const BUTTON_COOLDOWN_MS = 300; // 300ms cooldown - just enough to prevent double taps
  const DOUBLE_TAP_THRESHOLD_MS = 250; // Detect double taps within 250ms
  
  // Timing tracking variables
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [recordingEndTime, setRecordingEndTime] = useState<number | null>(null);
  const [processStartTime, setProcessStartTime] = useState<number | null>(null);
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null);
  const [transcriptionStartTime, setTranscriptionStartTime] = useState<number | null>(null);
  const [postProcessingStartTime, setPostProcessingStartTime] = useState<number | null>(null);
  
  const [rippleColors] = useState<string[]>([
    '#fbbf24', // 0: First one is always golden yellow (special)
    '#fde68a', // 1: Pastel yellow - soft sunshine
    '#fed7d7', // 2: Pastel pink - gentle rose  
    '#fbb6ce', // 3: Pastel magenta - soft bloom
    '#ddd6fe', // 4: Pastel purple - lavender dream
    '#bfdbfe', // 5: Pastel blue - sky whisper
    '#a7f3d0', // 6: Pastel green - mint breeze
    '#fde047', // 7: Bright yellow - sunny glow
    '#f9a8d4', // 8: Bright pink - cherry blossom
    '#c084fc'  // 9: Bright purple - violet spark
  ]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardFadeAnim = useRef(new Animated.Value(1)).current; // New animation for card transitions
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const rippleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const loadingMessages = [
    "Checking your affirmation ✨",
    "Analyzing your intention 🔍",
    "Calculating belief score 📊",
    "Spreading your message 🌟",
    "Checking your vibes 🎵",
    "Processing your truth 💫",
    "Measuring your energy ⚡",
    "Validating your power 💪",
    "Capturing your essence 🌸",
    "Reading your spirit 🕊️"
  ];

  const voiceEnergyMessages = {
    high: [
      "🔥 Your voice overflowed with confidence.",
      "✨ I felt the strength in your words.",
      "🌟 Your truth echoed boldly today."
    ],
    medium: [
      "🌊 A steady, grounded delivery — beautiful.",
      "🌸 Calm and consistent, like a gentle stream.",
      "🌙 Your words carried quiet power."
    ],
    low: [
      "🍃 A soft whisper of truth — try letting it bloom next time.",
      "💫 Your words were gentle today; see if you can speak them a little stronger tomorrow.",
      "🌱 Even the quietest seeds can grow — your next ripple can be louder."
    ]
  };

  const getRandomVoiceEnergyMessage = (energy: 'high' | 'medium' | 'low') => {
    const messages = voiceEnergyMessages[energy];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Play success sound when ripple animation starts
  const playSuccessSound = () => {
    console.log('🔔 Playing success sound with ripple animation...');
    playTibetanBowlSound();
  };

  // Completely async sound playback - runs independently for exactly 6 seconds
  const playTibetanBowlSound = () => {
    // Fire and forget - this sound will play for 6 seconds no matter what
    (async () => {
      let sound: Audio.Sound | null = null;
      try {
        console.log('🔔 Loading Tibetan singing bowl sound (6s async)...');
        
        // Check and set audio mode for better compatibility
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: false, // Respect silent mode switch
            shouldDuckAndroid: false,
            playThroughEarpieceAndroid: false,
            staysActiveInBackground: false,
          });
          console.log('🔔 Audio mode set for sound playback');
        } catch (audioModeError) {
          console.log('🔔 Audio mode setting failed:', audioModeError);
        }
        
        // Load the sound with more debug info
        console.log('🔔 Creating sound object...');
        const result = await Audio.Sound.createAsync(
          require('../../assets/e-flat-tibetan-singing-bowl-struck-38746.mp3'),
          { 
            shouldPlay: false, // Don't auto-play, we'll control it
            volume: 1.0, // Max volume for testing
            isLooping: false,
          }
        );
        sound = result.sound;
        console.log('🔔 Sound object created successfully');
        
        // Check sound status before playing
        const statusBefore = await sound.getStatusAsync();
        console.log('🔔 Sound status before play:', statusBefore);
        
        // Start playing
        console.log('🔔 Calling playAsync...');
        await sound.playAsync();
        console.log('🔔 playAsync completed');
        
        // Check status after playing starts
        const statusAfter = await sound.getStatusAsync();
        console.log('🔔 Sound status after play:', statusAfter);
        console.log('🔔 Tibetan singing bowl sound started (will play for 6s)...');
        
        // Stop after exactly 6 seconds
        setTimeout(async () => {
          try {
            if (sound) {
              const statusAtEnd = await sound.getStatusAsync();
              console.log('🔔 Sound status at end:', statusAtEnd);
              await sound.stopAsync();
              await sound.unloadAsync();
              console.log('🔔 Sound stopped and unloaded after 6 seconds');
            }
          } catch (cleanupError) {
            console.log('🔔 Sound cleanup error:', cleanupError);
          }
        }, 10000); // Exactly 10 seconds
        
      } catch (soundError) {
        console.log('🔔 Could not play sound file:', soundError);
        console.log('🔔 Sound error details:', soundError.message);
        console.log('🔔 Sound error stack:', soundError.stack);
        
        // Clean up on error
        if (sound) {
          try {
            await sound.unloadAsync();
          } catch (cleanupError) {
            console.log('🔔 Error cleanup failed:', cleanupError);
          }
        }
      }
    })(); // Immediately invoked async function
  };


  const calculateVoiceEnergy = (): 'high' | 'medium' | 'low' => {
    if (volumeReadings.length === 0 || baselineVolume === null) {
      return 'medium'; // Default to medium if no data
    }

    // Find the maximum volume reading during the entire recording
    const maxVolume = Math.max(...volumeReadings);
    const maxVolumeIncrease = maxVolume - baselineVolume;
    
    console.log('Voice Energy Analysis:');
    console.log('Baseline:', baselineVolume);
    console.log('Max Volume:', maxVolume);
    console.log('Max Volume Increase:', maxVolumeIncrease);
    
    // Very lenient for high energy, very strict for low energy
    if (maxVolumeIncrease > 6) return 'high';    // Most normal speaking gets high energy
    if (maxVolumeIncrease > 2) return 'medium';  // Quiet speaking gets medium
    return 'low';                                // Only very quiet whispers get low
  };

  // Load current affirmation from vault
  const loadCurrentAffirmation = async () => {
    try {
      const affirmation = await getCurrentAffirmation();
      if (affirmation) {
        setCurrentAffirmation(affirmation.text);
        setCurrentAffirmationId(affirmation.id);
        setCurrentAffirmationRepeatCount(1); // Reset repeat count for new affirmation
        setIsRepeating(false); // Reset repeating state
        setIsTransitioning(false); // Reset transition state
        setIsNavigatingToNext(false); // Reset navigation state
        setIsButtonCooldown(false); // Reset button cooldown
        setLastButtonPress(0); // Reset button press tracking
        setRecordingFailureCount(0); // Reset failure count on new affirmation
      } else {
        // No affirmations in vault
        setCurrentAffirmation("Visit the Vault tab to add your first affirmation!");
        setCurrentAffirmationId('');
      }
    } catch (error) {
      console.error('🔥 [MAIN ERROR] Failed to load current affirmation:', error);
      
      // Show detailed error message
      if (error.message?.includes('offline') || error.code === 'unavailable') {
        setCurrentAffirmation('⚠️ Cannot connect to Firestore. Check your internet connection and Firebase configuration.');
      } else if (error.message?.includes('permission-denied')) {
        setCurrentAffirmation('⚠️ Permission denied. Check your Firestore security rules.');
      } else {
        setCurrentAffirmation(`⚠️ Firestore Error: ${error.message || 'Unknown error occurred'}`);
      }
      setCurrentAffirmationId('');
    }
  };

  // Simplified audio cleanup - focus on what works
  const forceAudioCleanup = async () => {
    try {
      console.log('Cleaning audio state...');
      
      // Stop any existing recordings
      const recordingsToClean = [recording, globalRecordingRef.current].filter(Boolean);
      
      for (const rec of recordingsToClean) {
        if (rec) {
          try {
            const status = await rec.getStatusAsync();
            if ((status as any).isLoaded) {
              await rec.stopAndUnloadAsync();
            }
          } catch (e) {
            console.log('Error stopping recording:', e);
          }
        }
      }
      
      // Clear all references
      setRecording(null);
      globalRecordingRef.current = null;
      
      // Simple audio mode reset - just one cycle
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });
        
        console.log('Audio cleanup completed');
      } catch (resetError) {
        console.log('Audio mode reset failed:', resetError);
      }
    } catch (error) {
      console.log('Cleanup error:', error);
    }
  };

  // Nuclear microphone reset - for when user clicks "Reset Microphone"
  const resetMicrophone = async () => {
    console.log('🔄 Starting nuclear microphone reset...');
    
    try {
      // Show user feedback immediately
      setIsButtonCooldown(true);
      
      // Step 1: Force stop ALL possible recordings
      const allRecordings = [recording, globalRecordingRef.current].filter(Boolean);
      for (const rec of allRecordings) {
        if (rec) {
          try {
            await rec.stopAndUnloadAsync();
          } catch (e) {
            console.log('Force stop recording error (expected):', e);
          }
        }
      }
      
      // Step 2: Clear all references
      setRecording(null);
      globalRecordingRef.current = null;
      setIsRecording(false);
      
      // Step 3: Multiple audio mode resets with increasing delays
      for (let i = 0; i < 4; i++) {
        console.log(`🔄 Microphone reset cycle ${i + 1}/4...`);
        
        // Completely disable audio
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: false,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });
        
        // Wait progressively longer each cycle
        await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)));
        
        // Re-enable with fresh settings
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('✅ Nuclear microphone reset completed!');
      
      // Clear cooldown and reset failure count on successful reset
      setIsButtonCooldown(false);
      setRecordingFailureCount(0); // Reset since we did a nuclear reset
      
      Alert.alert(
        'Microphone Reset Complete',
        'The microphone has been reset. You can now try recording again.',
        [{ text: 'OK', style: 'default' }]
      );
      
    } catch (error) {
      console.error('Nuclear reset failed:', error);
      setIsButtonCooldown(false);
      
      // If nuclear reset fails, definitely recommend app restart
      Alert.alert(
        'Reset Failed', 
        'Unable to reset microphone at system level. Please kill and restart the app to fix this issue.',
        [
          {
            text: 'How to Restart',
            style: 'default',
            onPress: () => {
              Alert.alert(
                'How to Restart the App',
                'iOS: Double-tap home button (or swipe up), then swipe up on this app to close it. Then reopen the app.\n\nAndroid: Use recent apps button, swipe away this app, then reopen it.',
                [{ text: 'Got it', style: 'default' }]
              );
            }
          },
          { text: 'OK', style: 'default' }
        ]
      );
    }
  };

  // Cleanup function for resetting to blank slate
  const resetToBlankState = async () => {
    console.log('Resetting to blank state...');
    
    // Stop and cleanup any active recording
    if (recording) {
      try {
        const status = await recording.getStatusAsync();
        if ((status as any).isLoaded) {
          await recording.stopAndUnloadAsync();
          console.log('Recording cleaned up during reset');
        }
      } catch (error) {
        // Only log if it's not the "already unloaded" error
        if (!error.message?.includes('already been unloaded')) {
          console.error('Error cleaning up recording during reset:', error);
        }
      }
      // Always clear the recording reference
      setRecording(null);
    }
    
    // Clear any timers
    if (recordingTimer) {
      clearTimeout(recordingTimer);
      setRecordingTimer(null);
    }
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      setSilenceTimer(null);
    }
    
    // Reset all states in batch to avoid scheduling issues
    requestAnimationFrame(() => {
      setRecording(null);
      setIsRecording(false);
      setIsTranscribing(false);
      setTranscription('');
      setShowRipple(false);
      setLoadingMessage('');
      setLoadingMessageIndex(0);
      setMatchScore(null);
      setIsProcessingComplete(true);
      setIsRepeating(false);
      setIsTransitioning(false);
      setIsNavigatingToNext(false);
      setIsButtonCooldown(false);
      setLastButtonPress(0);
      setRecordingFailureCount(0); // Reset failure count on state reset
    });
    
    // Reset animations
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
    rippleAnim.setValue(1);
    pulseAnim.setValue(1);
    rotateAnim.setValue(0);
    cardFadeAnim.setValue(1); // Reset card fade animation
  };

  // Start animations on mount and focus
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Cleanup when component unmounts or tab changes
  useEffect(() => {
    return () => {
      console.log('Component unmounting, cleaning up all recording references...');
      
      // Clean up both state recording and global ref
      const recordingsToClean = [recording, globalRecordingRef.current].filter(Boolean);
      
      recordingsToClean.forEach(rec => {
        if (rec) {
          rec.getStatusAsync()
            .then(status => {
              if ((status as any).isLoaded) {
                return rec.stopAndUnloadAsync();
              }
            })
            .catch(error => {
              // Only log if it's not the "already unloaded" error
              if (!error.message?.includes('already been unloaded')) {
                console.error('Error during unmount cleanup:', error);
              }
            });
        }
      });
      
      // Clear all references
      globalRecordingRef.current = null;
    };
  }, [recording]);

  // Handle tab focus/blur events for clean slate reset
  useFocusEffect(
    React.useCallback(() => {
      console.log('Ritual tab focused, starting fresh...');
      // Load current affirmation
      loadCurrentAffirmation();
      
      // Tab is focused - start animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      return () => {
        console.log('Ritual tab losing focus, resetting session counter...');
        // Reset session counter when navigating away
        setSessionAffirmationCount(0);
        
        // Reset button states
        setIsButtonCooldown(false);
        setLastButtonPress(0);
        setRecordingFailureCount(0); // Reset failure count when leaving tab
        setRecordingFailureCount(0); // Reset failure count on successful recording
        
        // Force cleanup any recording on tab change
        if (recording) {
          recording.stopAndUnloadAsync().catch(() => {});
          setRecording(null);
        }
        if (recordingTimer) {
          clearTimeout(recordingTimer);
          setRecordingTimer(null);
        }
        setIsRecording(false);
        setIsTranscribing(false);
        
        // Force reset audio mode
        Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        }).catch(() => {});
        
        // Reset to blank state
        resetToBlankState();
      };
    }, [])
  );

  // Pulse animation for recording button
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isRecording]);

  // Rotate animation for recording and transcribing
  useEffect(() => {
    if (isRecording || isTranscribing) {
      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      rotateAnimationRef.current = rotate;
      rotate.start();
      return () => {
        rotate.stop();
        rotateAnimationRef.current = null;
      };
    } else {
      // Force stop any running rotation animation
      if (rotateAnimationRef.current) {
        rotateAnimationRef.current.stop();
        rotateAnimationRef.current = null;
      }
      rotateAnim.setValue(0);
    }
  }, [isRecording, isTranscribing]);

  // Button press handler with debounce protection
  const handleRecordButtonPress = async () => {
    const now = Date.now();
    const timeSinceLastPress = now - lastButtonPress;
    
    // Check for double tap prevention
    if (timeSinceLastPress < DOUBLE_TAP_THRESHOLD_MS) {
      console.log('Double tap detected, ignoring second press');
      return;
    }
    
    // Check for cooldown period
    if (isButtonCooldown) {
      console.log('Button in cooldown period, ignoring press');
      return;
    }
    
    // Update last press time
    setLastButtonPress(now);
    
    // Start cooldown period
    setIsButtonCooldown(true);
    
    // Clear cooldown after specified time
    setTimeout(() => {
      setIsButtonCooldown(false);
      console.log('Button cooldown cleared');
    }, BUTTON_COOLDOWN_MS);
    
    // Call the actual recording function
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      
      // Immediately show visual feedback by starting button animation
      pulseAnim.setValue(1.05); // Immediate scale feedback
      
      // Quick animation to show button was pressed
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();
      
      // Clean up before starting new recording
      await forceAudioCleanup();
      
      // Defensive check: Clean up any existing recording first
      if (recording) {
        console.log('Existing recording found, cleaning up...');
        try {
          const status = await recording.getStatusAsync();
          if ((status as any).isLoaded) {
            await recording.stopAndUnloadAsync();
            console.log('Existing recording cleaned up');
          }
        } catch (cleanupError) {
          // Only log if it's not the "already unloaded" error
          if (!cleanupError.message?.includes('already been unloaded')) {
            console.error('Error cleaning up existing recording:', cleanupError);
          }
        }
        // Always reset state after cleanup attempt
        setRecording(null);
        setIsRecording(false);
        
        // Wait a moment for cleanup to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const { status } = await Audio.requestPermissionsAsync();
      console.log('Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need microphone access to hear your beautiful affirmations');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      console.log('Audio mode set');

      // Ensure audio mode is set before creating recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      
      // Create recording with single retry
      let newRecording;
      try {
        console.log('Attempting to create recording...');
        const result = await Audio.Recording.createAsync({
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          isMeteringEnabled: true,
        });
        newRecording = result.recording;
        console.log('Recording created successfully');
      
      // Reset failure count on successful recording creation
      setRecordingFailureCount(0);
      } catch (createError) {
        console.log('Recording creation failed, trying once more after cleanup:', createError);
        
        // One retry with cleanup
        await forceAudioCleanup();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const result = await Audio.Recording.createAsync({
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          isMeteringEnabled: true,
        });
        newRecording = result.recording;
        console.log('Recording created on retry');
      }
      
      setRecording(newRecording);
      globalRecordingRef.current = newRecording; // Store in global ref
      setIsRecording(true);
      
      // Clear old result modal data when starting new recording
      setTranscription('');
      // Only reset matchScore if not repeating current affirmation
      setMatchScore(null);
      setShowRipple(false);
      // Keep button enabled while recording
      setIsProcessingComplete(true);
      
      // Reset volume tracking for voice energy analysis
      setVolumeReadings([]);
      setBaselineVolume(null);
      
      // Reset all timing variables for this session
      setRecordingStartTime(null);
      setRecordingEndTime(null);
      setProcessStartTime(null);
      setUploadStartTime(null);
      setTranscriptionStartTime(null);
      setPostProcessingStartTime(null);
      
      // Start timing
      const startTime = Date.now();
      setRecordingStartTime(startTime);
      console.log('🎤 [TIMING] Recording started at:', new Date(startTime).toISOString());
      console.log('Recording started successfully');
      
      // Start 15-second auto-stop timer
      const autoStopTimer = setTimeout(() => {
        console.log('Auto-stopping recording after 15 seconds');
        // Immediately stop UI animations before calling stopRecording
        setIsRecording(false);
        
        // Force stop rotation animation
        if (rotateAnimationRef.current) {
          rotateAnimationRef.current.stop();
          rotateAnimationRef.current = null;
        }
        rotateAnim.setValue(0);
        
        stopRecording();
        
        // Show helpful message to user after auto-stop
        setTimeout(() => {
          Alert.alert(
            'Recording Stopped',
            'Your recording was automatically stopped after 15 seconds. For better results, try speaking your affirmation more concisely or record it again.',
            [
              {
                text: 'Record Again',
                style: 'default',
                onPress: () => {
                  // Clear any cooldown and allow immediate retry
                  setIsButtonCooldown(false);
                  setIsProcessingComplete(true);
                }
              },
              {
                text: 'OK',
                style: 'default'
              }
            ]
          );
        }, 500); // Small delay to ensure recording stops completely
      }, 15000);
      setRecordingTimer(autoStopTimer);
      
      // Start volume monitoring for silence detection
      startSilenceDetection(newRecording);
    } catch (err) {
      console.error('Recording start error:', err);
      
      // If we get the "Only one Recording object" error, show a helpful message
      if (err.message?.includes('Only one Recording object')) {
        console.log('Detected stuck recording object, providing user guidance...');
        
        // Increment failure count
        const newFailureCount = recordingFailureCount + 1;
        setRecordingFailureCount(newFailureCount);
        
        // After 2 consecutive failures, recommend app restart
        if (newFailureCount >= 2) {
          Alert.alert(
            'Recording System Stuck',
            'The microphone has failed multiple times. This appears to be a system-level issue.\n\nPlease kill and restart the app to fix this problem.',
            [
              {
                text: 'How to Restart',
                style: 'default',
                onPress: () => {
                  Alert.alert(
                    'How to Restart the App',
                    'iOS: Double-tap home button (or swipe up), then swipe up on this app to close it. Then reopen the app.\n\nAndroid: Use recent apps button, swipe away this app, then reopen it.',
                    [{ text: 'Got it', style: 'default' }]
                  );
                }
              },
              { text: 'OK', style: 'default' }
            ]
          );
        } else {
          Alert.alert(
            'Microphone Busy',
            `The microphone appears to be stuck (attempt ${newFailureCount}/2). Try resetting it or close other apps using audio.`,
            [
              { 
                text: 'Reset Microphone', 
                style: 'default',
                onPress: resetMicrophone
              },
              { 
                text: 'Try Again', 
                style: 'default',
                onPress: () => {
                  setIsButtonCooldown(false);
                }
              },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        }
      } else {
        Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
      }
      
      // Reset states on error
      setRecording(null);
      globalRecordingRef.current = null;
      setIsRecording(false);
      setIsButtonCooldown(false); // Clear cooldown on error
    }
  };

  const stopRecording = async () => {
    console.log('Stopping recording...');
    if (!recording || !isRecording) {
      console.log('No active recording to stop or already stopping');
      return;
    }
    
    // Immediately set recording state to false to stop UI animations
    setIsRecording(false);
    
    // Clear timers
    if (recordingTimer) {
      clearTimeout(recordingTimer);
      setRecordingTimer(null);
    }
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      setSilenceTimer(null);
    }

    try {
      // isRecording already set to false above for immediate UI feedback
      
      await recording.stopAndUnloadAsync();
      
      // Log recording duration
      if (recordingStartTime) {
        const recordingEnd = Date.now();
        setRecordingEndTime(recordingEnd);
        const recordingDuration = recordingEnd - recordingStartTime;
        console.log('🎤 [TIMING] Recording stopped at:', new Date(recordingEnd).toISOString());
        console.log('🎤 [TIMING] Recording duration:', recordingDuration, 'ms (', (recordingDuration / 1000).toFixed(1), 'seconds)');
      }
      console.log('Recording stopped');
      
      const uri = recording.getURI();
      console.log('Recording URI:', uri);
      
      setRecording(null);
      globalRecordingRef.current = null; // Clear global ref

      if (uri) {
        // Start processing - disable button and turn grey
        setIsProcessingComplete(false);
        
        // Start overall process timing
        const processStart = Date.now();
        setProcessStartTime(processStart);
        console.log('🔄 [TIMING] Overall processing started at:', new Date(processStart).toISOString());
        
        await transcribeAudio(uri);
      } else {
        console.error('No recording URI available');
        Alert.alert('Recording Error', 'No audio was recorded. Please try again.');
      }
    } catch (err) {
      console.error('Recording stop error:', err);
      Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
    }
  };

  const startSilenceDetection = (recording: Audio.Recording) => {
    let silenceCount = 0;
    const silenceThreshold = -50; // dB threshold for silence
    
    const checkSilence = async () => {
      try {
        const status = await recording.getStatusAsync();
        if (status.isRecording && status.metering !== undefined) {
          const currentVolume = status.metering;
          
          // Collect volume readings for voice energy analysis
          setVolumeReadings(prev => {
            const newReadings = [...prev, currentVolume];
            
            // Set baseline after first 2 readings (0.2 seconds) - captures ambient noise when user presses button
            if (newReadings.length === 2 && baselineVolume === null) {
              const baseline = newReadings.reduce((sum, vol) => sum + vol, 0) / newReadings.length;
              setBaselineVolume(baseline);
              console.log('Baseline volume set from first 0.2s:', baseline);
            }
            
            return newReadings;
          });
          
          // Silence detection logic
          if (currentVolume < silenceThreshold) {
            silenceCount++;
            console.log(`Silence detected: ${silenceCount}/100`);
            
            // If silent for 10 seconds (100 checks * 100ms = 10s)
            if (silenceCount >= 100) {
              console.log('Auto-stopping due to 10 seconds of silence');
              stopRecording();
              return;
            }
          } else {
            silenceCount = 0; // Reset counter when sound is detected
          }
          
          // Continue checking every 100ms
          const timer = setTimeout(checkSilence, 100);
          setSilenceTimer(timer);
        }
      } catch (error) {
        console.log('Silence detection stopped:', error.message);
      }
    };
    
    // Start checking after 2 seconds to allow initial setup
    setTimeout(checkSilence, 2000);
  };

  const startLoadingMessages = () => {
    // Shuffle the loading messages for random order
    const shuffledMessages = [...loadingMessages].sort(() => Math.random() - 0.5);
    
    setLoadingMessageIndex(0);
    setLoadingMessage(shuffledMessages[0]);
    
    const messageInterval = setInterval(() => {
      setLoadingMessageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % shuffledMessages.length;
        setLoadingMessage(shuffledMessages[nextIndex]);
        return nextIndex;
      });
    }, 2100); // Reduced by 30% from 3000ms to 2100ms
    
    return messageInterval;
  };

  const transcribeAudio = async (audioUri: string) => {
    console.log('Starting transcription for:', audioUri);
    setIsTranscribing(true);
    
    // Start dynamic loading messages
    const messageInterval = startLoadingMessages();
    
    try {
      // Start upload timing
      const uploadStart = Date.now();
      setUploadStartTime(uploadStart);
      console.log('📤 [TIMING] AssemblyAI upload started at:', new Date(uploadStart).toISOString());
      
      // Upload directly to AssemblyAI
      const uploadResponse = await FileSystem.uploadAsync(
        apiUrl('/assemblyai/v2/upload'),
        audioUri,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          httpMethod: 'POST',
        }
      );

      // Log upload completion time
      if (uploadStartTime) {
        const uploadEnd = Date.now();
        const uploadDuration = uploadEnd - uploadStartTime;
        console.log('📤 [TIMING] AssemblyAI upload completed at:', new Date(uploadEnd).toISOString());
        console.log('📤 [TIMING] Upload duration:', uploadDuration, 'ms (', (uploadDuration / 1000).toFixed(1), 'seconds)');
      }
      
      console.log('Upload response status:', uploadResponse.status);

      if (uploadResponse.status === 200) {
        const uploadResult = JSON.parse(uploadResponse.body);
        
        // Start transcription timing
        const transcriptionStart = Date.now();
        setTranscriptionStartTime(transcriptionStart);
        console.log('🎙️ [TIMING] AssemblyAI transcription request started at:', new Date(transcriptionStart).toISOString());
        
        // Now create transcription request
        await createTranscription(uploadResult.upload_url, messageInterval);
      } else {
        clearInterval(messageInterval);
        setLoadingMessage('');
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      if (messageInterval) {
        clearInterval(messageInterval);
      }
      setLoadingMessage('');
      Alert.alert('Connection Error', `Unable to process your affirmation: ${error.message}`);
      setIsTranscribing(false);
    }
  };

  const createTranscription = async (uploadUrl: string, messageInterval: NodeJS.Timeout) => {
    try {
      console.log('Creating transcription request...');
      
      const transcriptResponse = await fetch(apiUrl('/assemblyai/v2/transcript'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_url: uploadUrl,
          speech_model: 'slam-1',
        }),
      });

      const transcriptData = await transcriptResponse.json();
      console.log('Transcription request response:', transcriptData);

      if (transcriptData.id) {
        await pollTranscription(transcriptData.id, messageInterval);
      } else {
        clearInterval(messageInterval);
        throw new Error('Failed to start transcription');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      clearInterval(messageInterval);
      Alert.alert(
        'Transcription Error', 
        error.message,
        [{ 
          text: 'OK', 
          style: 'default',
          onPress: () => setIsProcessingComplete(true)
        }]
      );
      setIsTranscribing(false);
      setLoadingMessage('');
    }
  };

  const pollTranscription = async (transcriptId: string, messageInterval: NodeJS.Timeout) => {
    const maxAttempts = 60; // 3 minutes max
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(apiUrl(`/assemblyai/v2/transcript/${transcriptId}`));

        const data = await response.json();
        console.log('Polling response:', data.status);

        if (data.status === 'completed') {
          // Log transcription completion time
          if (transcriptionStartTime) {
            const transcriptionEnd = Date.now();
            const transcriptionDuration = transcriptionEnd - transcriptionStartTime;
            console.log('🎙️ [TIMING] AssemblyAI transcription completed at:', new Date(transcriptionEnd).toISOString());
            console.log('🎙️ [TIMING] Transcription duration:', transcriptionDuration, 'ms (', (transcriptionDuration / 1000).toFixed(1), 'seconds)');
          }
          
          clearInterval(messageInterval);
          setLoadingMessage('');
          
          // Check if text was actually detected
          if (!data.text || data.text.trim().length === 0) {
            Alert.alert(
              'Words not detected',
              'Did you say your affirmation clearly? Please try again.',
              [{ 
                text: 'OK', 
                style: 'default',
                onPress: () => setIsProcessingComplete(true)
              }]
            );
            setIsTranscribing(false);
            return;
          }
          
          // Check for inappropriate content
          if (data.content_safety_labels?.results) {
            const hasInappropriateContent = data.content_safety_labels.results.some((result: any) => 
              result.labels?.some((label: any) => 
                (label.label === 'profanity' || label.label === 'hate_speech' || label.label === 'violence') 
                && label.confidence > 0.7
              )
            );
            
            if (hasInappropriateContent) {
              Alert.alert(
                'Content Warning',
                'We detected inappropriate language. Please try again with positive affirmations.',
                [{ 
                  text: 'OK', 
                  style: 'default',
                  onPress: () => setIsProcessingComplete(true)
                }]
              );
              setIsTranscribing(false);
              return;
            }
          }
          
          setTranscription(data.text);
          
          // Start post-processing timing
          const postProcessingStart = Date.now();
          setPostProcessingStartTime(postProcessingStart);
          console.log('🧠 [TIMING] Post-processing (LLM match check) started at:', new Date(postProcessingStart).toISOString());
          
          // Check affirmation match with LLM first, THEN stop transcribing state
          await runMatchCheck(data.text);
          setIsTranscribing(false);
          return;
        } else if (data.status === 'error') {
          clearInterval(messageInterval);
          setLoadingMessage('');
          Alert.alert(
            'Transcription Failed', 
            data.error || 'Unable to process your affirmation',
            [{ 
              text: 'OK', 
              style: 'default',
              onPress: () => setIsProcessingComplete(true)
            }]
          );
          setIsTranscribing(false);
          return;
        }

        // Wait 3 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(messageInterval);
        setLoadingMessage('');
        Alert.alert(
          'Polling Error', 
          error.message,
          [{ 
            text: 'OK', 
            style: 'default',
            onPress: () => setIsProcessingComplete(true)
          }]
        );
        setIsTranscribing(false);
        return;
      }
    }

    clearInterval(messageInterval);
    setLoadingMessage('');
    Alert.alert(
      'Timeout', 
      'Transcription took too long. Please try again.',
      [{ 
        text: 'OK', 
        style: 'default',
        onPress: () => setIsProcessingComplete(true)
      }]
    );
    setIsTranscribing(false);
  };

  const runMatchCheck = async (spokenText: string) => {
    try {
      console.log('🧠 [TIMING] Calling LLM API for match check...');
      console.log('🎯 [DEBUG] Expected affirmation:', currentAffirmation);
      console.log('🎯 [DEBUG] Spoken text:', spokenText);
      const llmCallStart = Date.now();
      
      // Call Azure OpenAI to check match
      let result;
      try {
        // Server route runs the LLM orchestrator (keys stay server-side)
        const matchResponse = await fetch(apiUrl('/check-affirmation-match'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expectedAffirmation: currentAffirmation, spokenText }),
        });
        result = await matchResponse.json();
        console.log('Function returned:', result);
      } catch (error) {
        console.error('Error calling checkAffirmationMatch:', error);
        console.error('Error stack:', error.stack);
        result = {
          success: false,
          error: 'Failed to check affirmation match',
          details: error.message
        };
      }
      console.log('🎯 [DEBUG] Match check result:', result);
      
      // Log LLM call completion
      const llmCallEnd = Date.now();
      const llmCallDuration = llmCallEnd - llmCallStart;
      console.log('🧠 [TIMING] LLM API call completed at:', new Date(llmCallEnd).toISOString());
      console.log('🧠 [TIMING] LLM call duration:', llmCallDuration, 'ms (', (llmCallDuration / 1000).toFixed(1), 'seconds)');
      
      // Log post-processing completion
      if (postProcessingStartTime) {
        const postProcessingEnd = Date.now();
        const postProcessingDuration = postProcessingEnd - postProcessingStartTime;
        console.log('🧠 [TIMING] Post-processing completed at:', new Date(postProcessingEnd).toISOString());
        console.log('🧠 [TIMING] Post-processing duration:', postProcessingDuration, 'ms (', (postProcessingDuration / 1000).toFixed(1), 'seconds)');
      }
      
      console.log('Match result:', result);
      if (!result) {
        console.error('Result is undefined, setting default error result');
        result = { success: false, error: 'No result returned from match check' };
      }
      console.log('🎯 [DEBUG] Result success:', result.success);
      console.log('🎯 [DEBUG] Result data:', result.data);

      if (result.success && result.data) {
        const score = result.data.matchScore;
        console.log('🎯 [DEBUG] Match score:', score);
        setMatchScore(score);
        console.log('🎯 [DEBUG] matchScore state set to:', score);
        
        if (score >= 70) {
          // Calculate voice energy based on real audio analysis
          const energy = calculateVoiceEnergy();
          setVoiceEnergy(energy);
          
          // Success - trigger enhanced golden ripple animation
          await triggerSuccessAnimation();
          
          // Update streak for successful matches
          try {
            await updateStreak(spokenText);
            console.log('🔥 [SUCCESS] Streak updated successfully');
          } catch (error) {
            console.log('🔥 [SUCCESS] Streak update skipped (auth not ready):', error.message);
          }
          
          // Track success for this specific affirmation
          if (currentAffirmationId) {
            try {
              await trackAffirmationSuccess(currentAffirmationId);
              console.log('🔥 [SUCCESS] Affirmation success tracked');
            } catch (error) {
              console.log('🔥 [SUCCESS] Success tracking skipped (auth not ready):', error.message);
            }
          }
        } else if (score >= 50) {
          // Close but not quite - encourage retry
          Alert.alert(
            'Almost there!',
            `Let's try again. Take a deep breath and say: "${currentAffirmation}"`,
            [{ 
              text: 'Try Again', 
              style: 'default',
              onPress: () => setIsProcessingComplete(true)
            }]
          );
        } else {
          // Poor match - subtle warning
          Alert.alert(
            'Let\'s stay focused',
            `Please speak the affirmation: "${currentAffirmation}"`,
            [{ 
              text: 'OK', 
              style: 'default',
              onPress: () => setIsProcessingComplete(true)
            }]
          );
        }
      }
    } catch (error) {
      console.error('Match checking error:', error);
      
      // Log post-processing completion even on error
      if (postProcessingStartTime) {
        const postProcessingEnd = Date.now();
        const postProcessingDuration = postProcessingEnd - postProcessingStartTime;
        console.log('🧠 [TIMING] Post-processing completed (with error) at:', new Date(postProcessingEnd).toISOString());
        console.log('🧠 [TIMING] Post-processing duration (with error):', postProcessingDuration, 'ms (', (postProcessingDuration / 1000).toFixed(1), 'seconds)');
      }
      
      // Fallback to regular success animation
      await triggerSuccessAnimation();
    }
  };

  // Smooth transition helper for button actions
  const smoothTransition = async (action: () => Promise<void> | void) => {
    setIsTransitioning(true);
    
    // Fade out the card
    await new Promise<void>((resolve) => {
      Animated.timing(cardFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => resolve());
    });
    
    // Execute the action while card is invisible
    await action();
    
    // Small delay to ensure state changes are processed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Fade back in if we still have a success state
    if (matchScore !== null && matchScore >= 70) {
      Animated.timing(cardFadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    
    setIsTransitioning(false);
  };

  const triggerSuccessAnimation = async () => {
    // Prevent ripple during navigation transitions
    if (isNavigatingToNext || isTransitioning) {
      console.log('🎯 [DEBUG] Ripple blocked - navigation in progress');
      return;
    }
    
    // Log overall process completion timing
    if (processStartTime) {
      const processEnd = Date.now();
      const totalDuration = processEnd - processStartTime;
      console.log('🎉 [TIMING] ===== OVERALL PROCESS COMPLETED =====');
      console.log('🎉 [TIMING] Total process duration:', totalDuration, 'ms (', (totalDuration / 1000).toFixed(1), 'seconds)');
      console.log('🎉 [TIMING] Process completed at:', new Date(processEnd).toISOString());
      
      // Show breakdown if we have the individual timings
      if (recordingStartTime && recordingEndTime && uploadStartTime && transcriptionStartTime && postProcessingStartTime) {
        const recordingDuration = recordingEndTime - recordingStartTime; // Actual recording time
        const uploadDuration = transcriptionStartTime - uploadStartTime; // Time for upload
        const transcriptionDuration = postProcessingStartTime - transcriptionStartTime; // Time for transcription
        const postProcessingDuration = processEnd - postProcessingStartTime; // Time for LLM processing
        
        console.log('📊 [TIMING] ===== DETAILED BREAKDOWN =====');
        console.log('📊 [TIMING] Recording duration:', recordingDuration, 'ms (', (recordingDuration / 1000).toFixed(1), 's)');
        console.log('📊 [TIMING] AssemblyAI upload:', uploadDuration, 'ms (', (uploadDuration / 1000).toFixed(1), 's)');
        console.log('📊 [TIMING] AssemblyAI transcription:', transcriptionDuration, 'ms (', (transcriptionDuration / 1000).toFixed(1), 's)');
        console.log('📊 [TIMING] Post-processing (LLM):', postProcessingDuration, 'ms (', (postProcessingDuration / 1000).toFixed(1), 's)');
        console.log('📊 [TIMING] Total processing time:', totalDuration, 'ms (', (totalDuration / 1000).toFixed(1), 's)');
        console.log('📊 [TIMING] ================================');
      }
      console.log('🎉 [TIMING] =========================================');
    }
    
    // Enable button immediately when success animation starts
    setIsProcessingComplete(true);
    
    // Clear any button cooldown after successful completion
    setIsButtonCooldown(false);
    
    // Increment session count for progressive intensity
    const newCount = sessionAffirmationCount + 1;
    setSessionAffirmationCount(newCount);
    
    // Calculate progressive intensity (1st->15th gets stronger)
    const intensity = Math.min(1 + (newCount - 1) * 0.2, 4); // Max 4x intensity at 15th
    const duration = Math.max(3000 - (newCount - 1) * 100, 2000); // Faster as you progress
    
    // Get ripple color - first is yellow, rest random
    const colorIndex = newCount === 1 ? 0 : Math.floor(Math.random() * (rippleColors.length - 1)) + 1;
    const selectedColor = rippleColors[colorIndex];
    
    // Trigger microphone ripple effect AND play sound at exact same moment
    setShowRipple(true);
    playSuccessSound(); // Perfect timing with ripple visibility
    
    // Reset animation values before starting
    rippleAnim.setValue(1);
    cardFadeAnim.setValue(1); // Ensure card is fully visible for success
    
    // Enhanced ripple animation with progressive intensity
    Animated.sequence([
      Animated.timing(rippleAnim, {
        toValue: 8 * intensity, // Progressive size increase
        duration: duration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Don't immediately hide - keep ripple state for next affirmation
      // setShowRipple(false);
      // setShowFullScreenRipple(false);
    });
  };

  return (
    <LinearGradient
      colors={['#fef7ed', '#fdf2f8', '#f3e8ff']}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEnabled={true} // Force scroll to always be enabled
        keyboardShouldPersistTaps="handled" // Ensure touches work during animations
        scrollEventThrottle={16} // Smooth scrolling
      >
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0]
              })}]
            }
          ]}
        >
          <Text style={styles.title}>Daily Rituals</Text>
          <Text style={styles.subtitle}>Ripple your truth to the universe ✨</Text>
        </Animated.View>

      <Animated.View 
        style={[
          styles.affirmationCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Text style={styles.affirmationLabel}>Today's Affirmation</Text>
        <Text style={styles.affirmationText}>{currentAffirmation}</Text>
      </Animated.View>

              <View style={styles.recordingArea}>
          <View style={styles.rippleContainer}>
            {/* Multiple ripple layers for depth */}
            {showRipple && (
              <>
                {/* Outer ripple - largest, softest */}
                <Animated.View
                  style={[
                    styles.ripple,
                    {
                      backgroundColor: rippleColors[sessionAffirmationCount === 0 ? 0 : (sessionAffirmationCount - 1) % (rippleColors.length - 1) + 1],
                      transform: [{ scale: rippleAnim }],
                      opacity: rippleAnim.interpolate({
                        inputRange: [1, 5],
                        outputRange: [0.9, 0]
                      })
                    }
                  ]}
                />
                {/* Middle ripple - medium size, medium opacity */}
                <Animated.View
                  style={[
                    styles.ripple, 
                    { 
                      backgroundColor: rippleColors[sessionAffirmationCount === 0 ? 0 : (sessionAffirmationCount) % (rippleColors.length - 1) + 1],
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                    },
                    {
                      transform: [{ scale: Animated.multiply(rippleAnim, 0.8) }],
                      opacity: rippleAnim.interpolate({
                        inputRange: [1, 4],
                        outputRange: [0.7, 0]
                      })
                    }
                  ]}
                />
                {/* Inner ripple - smallest, brightest */}
                <Animated.View
                  style={[
                    styles.ripple, 
                    { 
                      backgroundColor: rippleColors[sessionAffirmationCount === 0 ? 0 : (sessionAffirmationCount + 1) % (rippleColors.length - 1) + 1],
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                    },
                    {
                      transform: [{ scale: Animated.multiply(rippleAnim, 0.6) }],
                      opacity: rippleAnim.interpolate({
                        inputRange: [1, 3],
                        outputRange: [0.5, 0]
                      })
                    }
                  ]}
                />
              </>
            )}
            
            <Animated.View
              style={{
                transform: [
                  { scale: pulseAnim },
                  { rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  })}
                ]
              }}
            >
              <TouchableOpacity
                style={[
                  styles.recordButton, 
                  isRecording && styles.recordingButton,
                  (!isProcessingComplete || isButtonCooldown) && styles.processingButton
                ]}
                onPress={handleRecordButtonPress}
                disabled={!isProcessingComplete || isButtonCooldown}
                activeOpacity={0.7} // Always allow touch feedback
              >
                {isTranscribing ? (
                  <Animated.View
                    style={{
                      transform: [{ rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg']
                      })}]
                    }}
                  >
                    <Ionicons name="hourglass" size={40} color="rgba(255, 255, 255, 0.7)" />
                  </Animated.View>
                ) : isRecording ? (
                  <Animated.View
                    style={{
                      opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.1],
                        outputRange: [0.5, 1]
                      })
                    }}
                  >
                    <Ionicons name="mic" size={40} color="white" />
                  </Animated.View>
                ) : isButtonCooldown ? (
                  <Ionicons name="timer" size={40} color="rgba(255, 255, 255, 0.7)" />
                ) : (
                  <Ionicons name="mic" size={40} color="white" />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Animated.View
            style={{
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.1],
                outputRange: [0.7, 1]
              })
            }}
          >
            <Text style={styles.recordingStatus}>
              {isTranscribing
                ? (loadingMessage || 'Processing your affirmation...')
                : isRecording
                ? 'Listening to your beautiful truth...'
                : isButtonCooldown
                ? 'Resetting microphone...'
                : 'Tap to speak your affirmation'
              }
            </Text>
          </Animated.View>

        </View>

      {(matchScore !== null && matchScore >= 70) || isRepeating || isTransitioning ? (
        <Animated.View 
          style={[
            styles.transcriptionCard,
            {
              opacity: Animated.multiply(fadeAnim, cardFadeAnim),
              transform: [
                { translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0]
                })},
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <Text style={styles.successText}>
            You have succeeded in spreading your affirmation ✨
          </Text>
          <View style={{ height: 12 }} />
          <Text style={styles.transcriptionText}>"{currentAffirmation}"</Text>
          
          {/* Voice Energy Section */}
          <View style={styles.voiceEnergyContainer}>
            <Text style={styles.voiceEnergyTitle}>Voice Energy</Text>
            
            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <LinearGradient
                colors={['#ff6b6b', '#feca57', '#48ca7b', '#00d2d3', '#5f27cd']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressBar,
                  { 
                    width: voiceEnergy === 'high' ? '90%' : voiceEnergy === 'medium' ? '65%' : '40%'
                  }
                ]}
              >
                {voiceEnergy === 'high' && (
                  <Animated.View style={[
                    styles.sparkles,
                    {
                      opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.1],
                        outputRange: [0.6, 1]
                      })
                    }
                  ]}>
                    <Text style={styles.sparkleText}>✨</Text>
                  </Animated.View>
                )}
              </LinearGradient>
            </View>
            
            {/* Feedback Message */}
            <Text style={[
              styles.voiceEnergyFeedback,
              voiceEnergy === 'high' && styles.highEnergyFeedback,
              voiceEnergy === 'medium' && styles.mediumEnergyFeedback,
              voiceEnergy === 'low' && styles.lowEnergyFeedback
            ]}>
              {getRandomVoiceEnergyMessage(voiceEnergy)}
            </Text>
          </View>
          
          <Animated.View
            style={{
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.1],
                outputRange: [0.8, 1]
              })
            }}
          >
            <Text style={styles.universeMessage}>The universe echoes your truth ✨</Text>
          </Animated.View>
          
          {/* Next Affirmation Button */}
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={async () => {
              // Immediately set navigation flag and clear ripple states
              setIsNavigatingToNext(true);
              setShowRipple(false);
              rippleAnim.setValue(1);
              console.log('🎯 [DEBUG] Starting next affirmation navigation - ripple disabled');
              
              await smoothTransition(async () => {
                try {
                  await moveToNextAffirmation();
                  await loadCurrentAffirmation();
                  // Reset success display
                  setMatchScore(null);
                  
                  // Reset ripple animation value for next use
                  rippleAnim.setValue(1);
                  setShowRipple(false);
                  
                  // Clear navigation flag - ripple can work again for new affirmation
                  setIsNavigatingToNext(false);
                  console.log('🎯 [DEBUG] Next affirmation navigation complete - ripple re-enabled');
                } catch (error) {
                  console.error('Error moving to next affirmation:', error);
                  // Clear navigation flag even on error
                  setIsNavigatingToNext(false);
                }
              });
            }}
          >
            <Ionicons name="arrow-forward-circle" size={20} color="white" />
            <Text style={styles.nextButtonText}>Next Affirmation</Text>
          </TouchableOpacity>

          {/* Repeat Affirmation Button */}
          {currentAffirmationRepeatCount < 3 && (
            <TouchableOpacity 
              style={styles.repeatButton}
              onPress={async () => {
                await smoothTransition(async () => {
                  // Update repeat count
                  setCurrentAffirmationRepeatCount(prev => prev + 1);
                  
                  // Reset ripple states for next success
                  rippleAnim.setValue(1);
                  setShowRipple(false);
                  
                  // Reset the match score to clear success display
                  setMatchScore(null);
                });
              }}
            >
              <Ionicons name="repeat" size={20} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.repeatButtonText}>
                Repeat Affirmation {currentAffirmationRepeatCount < 2 ? 'Twice' : 'Thrice'}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      ) : null}
      </ScrollView>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40, // Extra padding at bottom for better scrolling
    minHeight: '100%', // Ensure content takes full height when not scrolling
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ec4899',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9333ea',
    textAlign: 'center',
  },
  affirmationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: '#fde68a',
    boxShadow: '0 4px 12px rgba(236, 72, 153, 0.1)',
  },
  affirmationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9333ea',
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  affirmationText: {
    fontSize: 20,
    lineHeight: 28,
    color: '#1f2937',
    textAlign: 'center',
    fontWeight: '500',
  },
  recordingArea: {
    alignItems: 'center',
    marginBottom: 40,
    flex: 0, // Don't let this area stretch
  },
  rippleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ripple: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ec4899',
    pointerEvents: 'none', // Allow touches to pass through
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 16px rgba(236, 72, 153, 0.3)',
    elevation: 8,
  },
  recordingButton: {
    backgroundColor: '#f97316',
  },
  processingButton: {
    backgroundColor: '#9ca3af',
    opacity: 0.6,
  },
  recordingStatus: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  transcriptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: '#ec4899',
    boxShadow: '0 8px 16px rgba(236, 72, 153, 0.2)',
    marginBottom: 20, // Add margin for better scrolling
  },
  successHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ec4899',
    marginHorizontal: 8,
  },
  transcriptionText: {
    fontSize: 18,
    color: '#1f2937',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 16,
    lineHeight: 26,
  },
  universeMessage: {
    fontSize: 14,
    color: '#9333ea',
    textAlign: 'center',
    fontWeight: '500',
  },
  voiceEnergyContainer: {
    backgroundColor: 'rgba(147, 51, 234, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.1)',
  },
  voiceEnergyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9333ea',
    textAlign: 'center',
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
    position: 'relative',
    overflow: 'visible',
  },
  sparkles: {
    position: 'absolute',
    right: -10,
    top: -8,
  },
  sparkleText: {
    fontSize: 16,
  },
  voiceEnergyFeedback: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  highEnergyFeedback: {
    color: '#f59e0b',
  },
  mediumEnergyFeedback: {
    color: '#059669',
  },
  lowEnergyFeedback: {
    color: '#6b7280',
  },
  nextButton: {
    backgroundColor: '#ec4899',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  repeatButton: {
    backgroundColor: 'rgba(236, 72, 153, 0.4)', // Faded version of main color
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
  repeatButtonText: {
    color: 'rgba(255, 255, 255, 0.8)', // Slightly faded white text
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  matchScore: {
    fontSize: 16,
    color: '#f97316',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
  },
});