import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Animated, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { apiUrl } from '../../lib/api';
import { quizQuestions, calculateQuizResult, QuizQuestion } from '../utils/quiz';
import { addMyAffirmation, addQuizAffirmations } from '../utils/storage-firestore';
import { getRandomAffirmation, getCategoryDisplayName, CosmicAffirmation } from '../utils/cosmicAffirmations';
import { useFocusEffect } from '@react-navigation/native';

export default function PathsTab() {
  const [activeView, setActiveView] = useState<'main' | 'quiz' | 'custom' | 'quiz-results' | 'cosmic'>('main');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizResults, setQuizResults] = useState<any>(null);
  const [customAffirmation, setCustomAffirmation] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionMessage, setTranscriptionMessage] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [affirmationAnalysis, setAffirmationAnalysis] = useState<any>(null);
  const [cosmicAffirmation, setCosmicAffirmation] = useState<CosmicAffirmation | null>(null);
  const [isAddingCosmic, setIsAddingCosmic] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  
  // Animation values for fade-in effect
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  const transcriptionMessages = [
    "Processing your speech...",
    "Analyzing your beautiful words...",
    "Converting thoughts to text...",
    "Listening carefully... 🎧",
    "Decoding your affirmation...",
    "Almost ready... ✨"
  ];

  // Reset to main view when tab is focused
  useFocusEffect(
    React.useCallback(() => {
      setActiveView('main');
      // Reset all states
      setCurrentQuestionIndex(0);
      setQuizAnswers({});
      setQuizResults(null);
      setCustomAffirmation('');
      setCosmicAffirmation(null);
      setShowScoreModal(false);
      setAffirmationAnalysis(null);
      setIsAddingCosmic(false);
      
      // Clean up any active recording and timer
      if (recordingTimer) {
        clearTimeout(recordingTimer);
        setRecordingTimer(null);
      }
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
        setRecording(null);
      }
      setIsRecording(false);
      setIsTranscribing(false);
      
      // Force reset audio mode on tab change
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      }).catch(() => {});
      
      // Reset and start animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      
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
    }, [])
  );
  
  const paths = [
    {
      id: 'quiz',
      title: 'Quiz Journey',
      description: 'Answer five questions and uncover new affirmations, chosen just for you.',
      icon: 'sparkles',
      color: '#ec4899',
      gradient: ['#fdf2f8', '#f3e8ff'],
    },
    {
      id: 'custom',
      title: 'Custom Deck',
      description: 'Design your own affirmations straight from the heart, refined with our love.',
      icon: 'create-outline',
      color: '#06b6d4',
      gradient: ['#e0f2fe', '#f0fdf4'],
    },
    {
      id: 'cosmic',
      title: 'Cosmic Surprise',
      description: 'Receive a secret affirmation from our hidden vault, sent by the universe.',
      icon: 'dice-outline',
      color: '#f59e0b',
      gradient: ['#fef3c7', '#fdf4ff'],
    },
    {
      id: 'astrology',
      title: 'Astrology Magic',
      description: 'Get affirmations aligned with your birthday\'s celestial energies — a DIY touch of the stars to guide your day.',
      icon: 'moon',
      color: '#9333ea',
      gradient: ['#f3e8ff', '#e0f2fe'],
      comingSoon: true,
    },
  ];

  const handlePathSelect = (pathId: string) => {
    if (pathId === 'quiz') {
      setActiveView('quiz');
      setCurrentQuestionIndex(0);
      setQuizAnswers({});
    } else if (pathId === 'custom') {
      setActiveView('custom');
    } else if (pathId === 'cosmic') {
      const randomAffirmation = getRandomAffirmation();
      setCosmicAffirmation(randomAffirmation);
      setActiveView('cosmic');
    } else if (pathId === 'astrology') {
      // Show coming soon message
      Alert.alert(
        'Coming Soon! 🌟',
        'Astrology Magic is being crafted with celestial precision. Stay tuned for this magical feature!',
        [{ text: 'Can\'t wait!' }]
      );
    }
  };

  const handleQuizAnswer = (answerId: string) => {
    const newAnswers = { ...quizAnswers, [quizQuestions[currentQuestionIndex].id]: answerId };
    setQuizAnswers(newAnswers);

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz completed
      const results = calculateQuizResult(newAnswers);
      setQuizResults(results);
      setActiveView('quiz-results');
    }
  };

  const handleAddQuizAffirmations = async () => {
    if (quizResults) {
      try {
        console.log('Adding quiz affirmations:', quizResults.recommendations);
        await addQuizAffirmations(quizResults.recommendations);
        Alert.alert(
          'Affirmations Added! ✨',
          'Your personalized affirmations have been added to your profile.',
          [{ text: 'Beautiful!', onPress: () => setActiveView('main') }]
        );
      } catch (error) {
        console.error('Error adding quiz affirmations:', error);
        Alert.alert(
          'Oops!',
          'Something went wrong while adding your affirmations. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleAddCustomAffirmation = async () => {
    if (!customAffirmation.trim()) {
      Alert.alert('Missing Affirmation', 'Please enter an affirmation first.');
      return;
    }

    if (customAffirmation.trim().length < 10) {
      Alert.alert('Affirmation Too Short', 'Please enter at least 10 characters for a meaningful affirmation.');
      return;
    }

    setIsValidating(true);
    
    // Start spinning animation for validation
    const validationSpinAnimation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    validationSpinAnimation.start();
    
    try {
      // First validate the affirmation with AI
      const response = await fetch(apiUrl('/validate-affirmation'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ affirmation: customAffirmation.trim() }),
      });

      const result = await response.json();
      
      if (result.success && result.validation) {
        if (result.validation.valid) {
          // Validation passed - add the affirmation
          try {
            await addMyAffirmation({
              text: customAffirmation.trim(),
              category: 'custom',
              source: 'custom'
            });
            Alert.alert(
              'Affirmation Added! ✨',
              'Your beautiful affirmation has been added to your collection.',
              [{ text: 'Amazing!', onPress: () => setCustomAffirmation('') }]
            );
          } catch (error) {
            console.error('Error adding custom affirmation:', error);
            Alert.alert('Error', 'Failed to add affirmation. Please try again.');
          }
        } else {
          // Validation failed - show reason
          Alert.alert(
            'Affirmation Not Added',
            `${result.validation.reason || 'Please ensure your affirmation is positive and appropriate.'}\n\nTip: Try rephrasing with positive, empowering language! 💫`,
            [{ text: 'I\'ll try again', style: 'default' }]
          );
        }
      } else {
        // Validation service error - allow through but warn
        console.warn('Validation service error:', result.error);
        try {
          await addMyAffirmation({
            text: customAffirmation.trim(),
            category: 'custom',
            source: 'custom'
          });
          Alert.alert(
            'Affirmation Added! ✨',
            'Your affirmation has been added to your collection.',
            [{ text: 'Great!', onPress: () => setCustomAffirmation('') }]
          );
        } catch (error) {
          console.error('Error adding custom affirmation:', error);
          Alert.alert('Error', 'Failed to add affirmation. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error validating/adding affirmation:', error);
      // Block users on validation errors and suggest contacting support
      Alert.alert(
        'Unable to Add Affirmation',
        'We\'re having trouble validating your affirmation right now. Please try again later or contact support if this continues.',
        [
          { text: 'Try Again', style: 'default' },
          { text: 'Contact Support', style: 'default', onPress: () => {
            // You can add support contact logic here later
            Alert.alert('Contact Support', 'Please reach out to us at support@example.com for assistance.');
          }}
        ]
      );
    } finally {
      setIsValidating(false);
      validationSpinAnimation.stop();
      spinAnim.setValue(0);
    }
  };

  const handleRefineWithAI = async () => {
    if (!customAffirmation.trim()) {
      Alert.alert('No Affirmation', 'Please enter or record an affirmation first.');
      return;
    }

    setIsRefining(true);
    
    // Start spinning animation
    const spinAnimation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    spinAnimation.start();
    
    try {
      const response = await fetch(apiUrl('/refine-affirmation'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ affirmation: customAffirmation.trim() }),
      });

      const result = await response.json();
      
      if (result.success && result.analysis) {
        setAffirmationAnalysis(result.analysis);
        setShowScoreModal(true);
        
        // Animate modal in
        Animated.spring(modalAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }).start();
      } else {
        Alert.alert('Analysis Error', 'Unable to analyze your affirmation at this time.');
      }
    } catch (error) {
      console.error('Refinement error:', error);
      Alert.alert('Connection Error', 'Please check your connection and try again.');
    } finally {
      setIsRefining(false);
      spinAnimation.stop();
      spinAnim.setValue(0);
    }
  };

  const closeScoreModal = () => {
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowScoreModal(false);
      setAffirmationAnalysis(null);
    });
  };

  const selectSuggestion = (suggestion: string) => {
    setCustomAffirmation(suggestion);
    closeScoreModal();
  };

  // Force audio cleanup - resets audio mode to clear any stuck recordings
  const forceAudioCleanup = async () => {
    try {
      console.log('Force cleaning audio state in paths...');
      
      // First stop any existing recording if it exists
      if (recording) {
        try {
          const status = await recording.getStatusAsync();
          if ((status as any).isLoaded) {
            await recording.stopAndUnloadAsync();
          }
        } catch (e) {
          console.log('Error stopping existing recording:', e);
        }
        setRecording(null);
      }
      
      // Clear timer
      if (recordingTimer) {
        clearTimeout(recordingTimer);
        setRecordingTimer(null);
      }
      
      // Reset audio mode completely
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      
      // Wait longer for complete reset
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Audio force cleanup completed in paths');
    } catch (error) {
      console.log('Force cleanup error in paths:', error);
    }
  };

  const handleAddCosmicAffirmation = async () => {
    if (cosmicAffirmation && !isAddingCosmic) {
      setIsAddingCosmic(true);
      try {
        console.log('Adding cosmic affirmation:', cosmicAffirmation);
        await addMyAffirmation({
          text: cosmicAffirmation.text,
          category: cosmicAffirmation.category,
          source: 'cosmic'
        });
        Alert.alert(
          'Cosmic Affirmation Added! ✨',
          'The universe\'s gift has been added to your collection.',
          [{ text: 'Beautiful!', onPress: () => setActiveView('main') }]
        );
      } catch (error) {
        console.error('Error adding cosmic affirmation:', error);
        Alert.alert(
          'Oops!',
          'Something went wrong while adding your affirmation. Please try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsAddingCosmic(false);
      }
    }
  };

  const startRecording = async () => {
    try {
      // Always force audio cleanup before starting new recording
      await forceAudioCleanup();
      
      // Clean up any existing recording and timer
      if (recordingTimer) {
        clearTimeout(recordingTimer);
        setRecordingTimer(null);
      }
      
      if (recording) {
        try {
          const status = await recording.getStatusAsync();
          if ((status as any).isLoaded) {
            await recording.stopAndUnloadAsync();
          }
        } catch (error) {
          console.log('Cleanup error:', error);
        }
        setRecording(null);
        setIsRecording(false);
        
        // Wait a moment for cleanup to complete
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need microphone access to record your affirmation');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      // Ensure audio mode is set properly
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);

      // Start 15-second auto-stop timer
      const autoStopTimer = setTimeout(() => {
        console.log('Auto-stopping recording after 15 seconds');
        stopRecording();
      }, 15000);
      setRecordingTimer(autoStopTimer);

      // Start pulse animation
      Animated.loop(
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
      ).start();
    } catch (err) {
      console.error('Recording start error:', err);
      Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    // Clear auto-stop timer
    if (recordingTimer) {
      clearTimeout(recordingTimer);
      setRecordingTimer(null);
    }

    try {
      setIsRecording(false);
      pulseAnim.setValue(1);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        await transcribeAudio(uri);
      } else {
        Alert.alert('Recording Error', 'No audio was recorded. Please try again.');
      }
    } catch (err) {
      console.error('Recording stop error:', err);
      Alert.alert('Recording Error', 'Failed to stop recording. Please try again.');
    }
  };

  const startTranscriptionMessages = () => {
    let messageIndex = 0;
    setTranscriptionMessage(transcriptionMessages[0]);
    
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % transcriptionMessages.length;
      setTranscriptionMessage(transcriptionMessages[messageIndex]);
    }, 2000); // Change every 2 seconds
    
    return messageInterval;
  };

  const transcribeAudio = async (audioUri: string) => {
    setIsTranscribing(true);
    
    // Start rotating transcription messages
    const messageInterval = startTranscriptionMessages();
    
    try {
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

      if (uploadResponse.status === 200) {
        const uploadResult = JSON.parse(uploadResponse.body);
        
        // Create transcription request
        const transcriptResponse = await fetch(apiUrl('/assemblyai/v2/transcript'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audio_url: uploadResult.upload_url,
            speech_model: 'slam-1',
          }),
        });

        const transcriptData = await transcriptResponse.json();
        
        if (transcriptData.id) {
          await pollTranscription(transcriptData.id, messageInterval);
        } else {
          clearInterval(messageInterval);
          throw new Error('Failed to start transcription');
        }
      } else {
        throw new Error(`Upload failed with status: ${uploadResponse.status}`);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      Alert.alert('Transcription Error', 'Unable to process your recording.');
      clearInterval(messageInterval);
      setTranscriptionMessage('');
      setIsTranscribing(false);
    }
  };

  const pollTranscription = async (transcriptId: string, messageInterval: NodeJS.Timeout) => {
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(apiUrl(`/assemblyai/v2/transcript/${transcriptId}`));

        const data = await response.json();

        if (data.status === 'completed') {
          clearInterval(messageInterval);
          setTranscriptionMessage('');
          
          if (!data.text || data.text.trim().length === 0) {
            Alert.alert('No Speech Detected', 'Please speak clearly and try again.');
          } else {
            setCustomAffirmation(data.text);
          }
          setIsTranscribing(false);
          return;
        } else if (data.status === 'error') {
          clearInterval(messageInterval);
          setTranscriptionMessage('');
          Alert.alert('Transcription Failed', 'Unable to process your affirmation');
          setIsTranscribing(false);
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(messageInterval);
        setTranscriptionMessage('');
        Alert.alert('Processing Error', 'Unable to complete transcription');
        setIsTranscribing(false);
        return;
      }
    }

    clearInterval(messageInterval);
    setTranscriptionMessage('');
    Alert.alert('Timeout', 'Transcription took too long. Please try again.');
    setIsTranscribing(false);
  };

  const renderQuiz = () => {
    const currentQuestion = quizQuestions[currentQuestionIndex];
    
    return (
      <ScrollView style={styles.quizContainer}>
        <View style={styles.quizHeader}>
          <TouchableOpacity onPress={() => setActiveView('main')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ec4899" />
          </TouchableOpacity>
          <Text style={styles.quizProgress}>
            {currentQuestionIndex + 1} of {quizQuestions.length}
          </Text>
        </View>
        
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
        
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.optionCard}
              onPress={() => handleQuizAnswer(option.id)}
            >
              <Text style={styles.optionText}>{option.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  const handleAddSingleQuizAffirmation = async (affirmation: {text: string, category: string}) => {
    try {
      await addMyAffirmation({
        text: affirmation.text,
        category: affirmation.category,
        source: 'quiz'
      });
      Alert.alert(
        'Affirmation Added! ✨',
        'This affirmation has been added to your vault.',
        [{ text: 'Beautiful!' }]
      );
    } catch (error) {
      console.error('Error adding single quiz affirmation:', error);
      Alert.alert('Error', 'Failed to add affirmation. Please try again.');
    }
  };

  const renderQuizResults = () => (
    <ScrollView style={styles.resultsContainer}>
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>Your Quiz Results ✨</Text>
        <Text style={styles.resultsSubtitle}>Here's what we recommend:</Text>
      </View>
      
      {quizResults?.recommendations.map((rec: any, index: number) => (
        <View key={index} style={styles.recommendationCard}>
          <Text style={styles.categoryBadge}>{rec.category.toUpperCase()}</Text>
          <Text style={styles.affirmationText}>"{rec.text}"</Text>
          <TouchableOpacity 
            style={styles.addSingleButton} 
            onPress={() => handleAddSingleQuizAffirmation(rec)}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text style={styles.addSingleButtonText}>Add This One</Text>
          </TouchableOpacity>
        </View>
      ))}
      
      <TouchableOpacity style={styles.addAllButton} onPress={handleAddQuizAffirmations}>
        <Text style={styles.addAllButtonText}>Add All to My Vault</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.backToMainButton} onPress={() => setActiveView('main')}>
        <Text style={styles.backToMainText}>Explore More Paths</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderCosmicSurprise = () => (
    <ScrollView style={styles.cosmicContainer}>
      <View style={styles.cosmicHeader}>
        <TouchableOpacity onPress={() => setActiveView('main')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f59e0b" />
        </TouchableOpacity>
        <Text style={styles.cosmicTitle}>Cosmic Surprise ✨</Text>
      </View>
      
      {cosmicAffirmation && (
        <>
          <View style={styles.cosmicCard}>
            <View style={styles.categoryTag}>
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text style={styles.categoryTagText}>
                {getCategoryDisplayName(cosmicAffirmation.category)}
              </Text>
            </View>
            
            <Text style={styles.cosmicAffirmationText}>
              "{cosmicAffirmation.text}"
            </Text>
            
            <Text style={styles.cosmicSubtitle}>
              The universe has chosen this just for you 🌟
            </Text>
          </View>
          
          <View style={styles.cosmicActions}>
            <TouchableOpacity 
              style={[styles.cosmicAddButton, isAddingCosmic && styles.buttonDisabled]} 
              onPress={handleAddCosmicAffirmation}
              disabled={isAddingCosmic}
            >
              <Ionicons name={isAddingCosmic ? "hourglass" : "heart"} size={24} color="white" />
              <Text style={styles.cosmicAddButtonText}>
                {isAddingCosmic ? 'Adding...' : 'Add to My Collection'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cosmicRetryButton} 
              onPress={() => {
                const newAffirmation = getRandomAffirmation();
                setCosmicAffirmation(newAffirmation);
              }}
            >
              <Ionicons name="refresh" size={24} color="#f59e0b" />
              <Text style={styles.cosmicRetryButtonText}>Try Another</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderCustomDeck = () => (
    <ScrollView style={styles.customContainer}>
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={() => setActiveView('main')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#06b6d4" />
        </TouchableOpacity>
        <Text style={styles.customTitle}>Create Your Affirmation</Text>
      </View>
      
      <Text style={styles.customSubtitle}>What truth do you want to express into existence?</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.affirmationInput}
          multiline
          numberOfLines={4}
          placeholder="I am exactly where I need to be..."
          placeholderTextColor="#9ca3af"
          value={customAffirmation}
          onChangeText={setCustomAffirmation}
          editable={!isTranscribing}
          returnKeyType="done"
          onSubmitEditing={() => {
            // Hide keyboard when return is pressed
            const { Keyboard } = require('react-native');
            Keyboard.dismiss();
          }}
          blurOnSubmit={true}
        />
        
        <Animated.View
          style={[
            styles.recordButtonContainer,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordingActive]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isTranscribing}
          >
            <Ionicons 
              name={isRecording ? "stop" : "mic"} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      {isTranscribing && (
        <View style={styles.transcribingIndicator}>
          <Text style={styles.transcribingText}>
            {transcriptionMessage || 'Transcribing your affirmation...'}
          </Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={[styles.refineButton, isRefining && styles.refineButtonLoading]} 
        onPress={isRefining || !customAffirmation.trim() ? undefined : handleRefineWithAI}
        activeOpacity={isRefining ? 1 : 0.7}
      >
        <LinearGradient
          colors={['rgba(147, 51, 234, 0.2)', 'rgba(236, 72, 153, 0.1)']}
          style={styles.refineButtonGradient}
        >
          {isRefining ? (
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: spinAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }}
            >
              <Ionicons name="refresh" size={24} color="#ec4899" />
            </Animated.View>
          ) : (
            <Ionicons name="sparkles" size={24} color="#9333ea" />
          )}
          <Text style={[styles.refineButtonText, isRefining && styles.refineButtonTextLoading]}>
            {isRefining ? 'Refining My Affirmation...' : 'Refine My Affirmation'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.addAffirmationButton, 
          (customAffirmation.trim().length < 10 || isValidating) && styles.buttonDisabled
        ]} 
        onPress={handleAddCustomAffirmation}
        disabled={customAffirmation.trim().length < 10 || isValidating}
      >
        {isValidating ? (
          <>
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: spinAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }}
            >
              <Ionicons name="refresh" size={24} color="white" />
            </Animated.View>
            <Text style={styles.buttonText}>Validating...</Text>
          </>
        ) : (
          <>
            <Ionicons name="add-circle" size={24} color="white" />
            <Text style={styles.buttonText}>Add Affirmation</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Affirmation Scoring Modal */}
      <Modal
        visible={showScoreModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeScoreModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                opacity: modalAnim,
                transform: [
                  {
                    scale: modalAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1]
                    })
                  }
                ]
              }
            ]}
          >
            <LinearGradient
              colors={['#fef7ed', '#fdf2f8']}
              style={styles.modalContent}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Affirmation Analysis ✨</Text>
                <TouchableOpacity onPress={closeScoreModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {/* Score Display */}
              {affirmationAnalysis && (
                <>
                  <View style={styles.scoreContainer}>
                    <View style={[
                      styles.scoreCircle,
                      { 
                        borderColor: affirmationAnalysis.score >= 80 ? '#10b981' : 
                                    affirmationAnalysis.score >= 60 ? '#f59e0b' : '#ef4444'
                      }
                    ]}>
                      <Text style={[
                        styles.scoreText,
                        { 
                          color: affirmationAnalysis.score >= 80 ? '#10b981' : 
                                 affirmationAnalysis.score >= 60 ? '#f59e0b' : '#ef4444'
                        }
                      ]}>
                        {affirmationAnalysis.score}
                      </Text>
                      <Text style={styles.scoreLabel}>/ 100</Text>
                    </View>
                    
                    <Text style={styles.scoreTitle}>
                      {affirmationAnalysis.score >= 80 ? '🔥 Amazing Affirmation!' : 
                       affirmationAnalysis.score >= 60 ? '✨ Good Foundation' : '💪 Room to Grow'}
                    </Text>
                  </View>

                  {/* Feedback */}
                  <View style={styles.feedbackContainer}>
                    <Text style={styles.feedbackText}>{affirmationAnalysis.feedback}</Text>
                  </View>

                  {/* Suggestions (only if score < 80) */}
                  {affirmationAnalysis.score < 80 && affirmationAnalysis.suggestions && (
                    <View style={styles.suggestionsContainer}>
                      <Text style={styles.suggestionsTitle}>💡 Try these instead:</Text>
                      {affirmationAnalysis.suggestions.map((suggestion: string, index: number) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.suggestionCard}
                          onPress={() => selectSuggestion(suggestion)}
                        >
                          <Text style={styles.suggestionText}>"{suggestion}"</Text>
                          <Ionicons name="arrow-forward-circle" size={20} color="#ec4899" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[
                        styles.keepButton,
                        affirmationAnalysis.score === 100 && styles.proceedButton
                      ]}
                      onPress={closeScoreModal}
                    >
                      <Text style={[
                        styles.keepButtonText,
                        affirmationAnalysis.score === 100 && styles.proceedButtonText
                      ]}>
                        {affirmationAnalysis.score === 100 ? 'Proceed ✨' : 'Keep Original'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );

  return (
    <LinearGradient
      colors={['#fef7ed', '#fdf2f8', '#f3e8ff']}
      style={styles.container}
    >
      {activeView === 'main' && (
        <ScrollView style={styles.pathsContainer} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.title}>Affirmation Paths</Text>
            <Text style={styles.subtitle}>Choose how the universe sends your words of power</Text>
          </Animated.View>
          {paths.map((path) => (
            <TouchableOpacity 
              key={path.id} 
              style={[styles.pathCard, path.comingSoon && styles.pathCardDisabled]}
              onPress={() => handlePathSelect(path.id)}
              disabled={path.comingSoon}
            >
              <LinearGradient
                colors={path.gradient as [string, string, ...string[]]}
                style={[styles.pathGradient, path.comingSoon && styles.pathGradientDisabled]}
              >
                <View style={styles.pathContent}>
                  <View style={[styles.iconContainer, { backgroundColor: path.color + '20' }]}>
                    <Ionicons name={path.icon as keyof typeof Ionicons.glyphMap} size={32} color={path.comingSoon ? '#9ca3af' : path.color} />
                  </View>
                  <View style={styles.pathText}>
                    <Text style={[
                      styles.pathTitle, 
                      { color: path.comingSoon ? '#9ca3af' : path.color }
                    ]}>
                      {path.title}
                    </Text>
                    <Text style={[
                      styles.pathDescription,
                      path.comingSoon && styles.pathDescriptionDisabled
                    ]}>
                      {path.description}
                    </Text>
                  </View>
                </View>
                {path.comingSoon && (
                  <View style={styles.comingSoonOverlay}>
                    <Text style={styles.comingSoonOverlayText}>Coming Soon</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}

          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonText}>More magical paths coming soon ✨</Text>
          </View>
        </ScrollView>
      )}

      {activeView === 'quiz' && renderQuiz()}
      {activeView === 'quiz-results' && renderQuizResults()}
      {activeView === 'custom' && renderCustomDeck()}
      {activeView === 'cosmic' && renderCosmicSurprise()}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 22,
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
  pathsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  pathCard: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  pathGradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  pathContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  pathText: {
    flex: 1,
  },
  pathTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  pathDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 22,
  },
  comingSoon: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#9333ea',
    fontStyle: 'italic',
  },
  // Quiz Styles
  quizContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quizProgress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9333ea',
  },
  questionText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 32,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  optionText: {
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Quiz Results Styles
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ec4899',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: '#9333ea',
    textAlign: 'center',
  },
  recommendationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9333ea',
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  affirmationText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#1f2937',
    lineHeight: 26,
    textAlign: 'center',
  },
  addAllButton: {
    backgroundColor: '#ec4899',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addAllButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  addSingleButton: {
    backgroundColor: '#06b6d4',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  addSingleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  backToMainButton: {
    padding: 16,
    marginBottom: 32,
  },
  backToMainText: {
    color: '#9333ea',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Custom Deck Styles
  customContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  customTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#06b6d4',
    marginLeft: 16,
  },
  customSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    fontStyle: 'italic',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  affirmationInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 20,
    paddingRight: 70, // Make space for record button
    fontSize: 16,
    color: '#1f2937',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 120,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  recordButtonContainer: {
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
  recordButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  recordingActive: {
    backgroundColor: '#f97316',
  },
  transcribingIndicator: {
    alignItems: 'center',
    marginBottom: 20,
  },
  transcribingText: {
    fontSize: 14,
    color: '#9333ea',
    fontStyle: 'italic',
  },
  addAffirmationButton: {
    backgroundColor: '#06b6d4',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  refineButton: {
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  refineButtonLoading: {
    shadowOpacity: 0.2,
  },
  refineButtonGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#9333ea',
  },
  refineButtonText: {
    color: '#9333ea',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  refineButtonTextLoading: {
    color: '#ec4899',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonTextDisabled: {
    color: '#d1d5db',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ec4899',
  },
  closeButton: {
    padding: 8,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  feedbackContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  feedbackText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#1f2937',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    marginBottom: 24,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9333ea',
    marginBottom: 12,
  },
  suggestionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: '#1f2937',
    fontStyle: 'italic',
    marginRight: 12,
  },
  modalActions: {
    alignItems: 'center',
  },
  keepButton: {
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#9ca3af',
  },
  keepButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  proceedButton: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  proceedButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  // Cosmic Surprise Styles
  cosmicContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  cosmicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  cosmicTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f59e0b',
    marginLeft: 16,
  },
  cosmicCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#fbbf24',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    alignItems: 'center',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  categoryTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cosmicAffirmationText: {
    fontSize: 20,
    lineHeight: 28,
    color: '#1f2937',
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '500',
    marginBottom: 20,
  },
  cosmicSubtitle: {
    fontSize: 16,
    color: '#f59e0b',
    textAlign: 'center',
    fontWeight: '500',
  },
  cosmicActions: {
    gap: 16,
    paddingHorizontal: 20,
  },
  cosmicAddButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  cosmicAddButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  cosmicRetryButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  cosmicRetryButtonText: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Disabled state styles
  pathCardDisabled: {
    opacity: 0.6,
  },
  pathGradientDisabled: {
    opacity: 0.7,
  },
  pathDescriptionDisabled: {
    color: '#9ca3af',
  },
  comingSoonOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#9333ea',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  comingSoonOverlayText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});