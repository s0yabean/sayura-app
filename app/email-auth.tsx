import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  linkWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
} from 'firebase/auth';
import { auth } from './config/firebase';
import Purchases from './config/revenuecat';

export default function EmailAuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const passwordInputRef = useRef<TextInput>(null);
  const nameInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  // Check if email exists when user stops typing
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (email && email.includes('@') && !isSignUpMode) {
        checkEmailExists();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [email, isSignUpMode]);

  const checkEmailExists = async () => {
    try {
      setCheckingEmail(true);
      const methods = await fetchSignInMethodsForEmail(auth, email);
      setIsNewUser(methods.length === 0);
      
      // Auto-focus next field
      if (methods.length === 0 && nameInputRef.current) {
        nameInputRef.current.focus();
      } else if (methods.length > 0 && passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    } catch (error) {
      console.log('Error checking email:', error);
    } finally {
      setCheckingEmail(false);
    }
  };

  const validateForm = () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    if (!password || password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters');
      return false;
    }

    if (isSignUpMode) {
      if (!name || name.trim().length < 2) {
        Alert.alert('Invalid Name', 'Please enter your name');
        return false;
      }

      if (password !== confirmPassword) {
        Alert.alert('Password Mismatch', 'Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      Keyboard.dismiss();

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if this email was previously used with social login
      const user = userCredential.user;
      const providers = user.providerData.map(provider => provider.providerId);
      
      if (providers.length > 1) {
        console.log('User has multiple auth providers linked:', providers);
      }

      // Link RevenueCat
      try {
        await Purchases.logIn(user.uid);
        console.log('RevenueCat user linked successfully');
      } catch (rcError) {
        console.error('RevenueCat linking failed:', rcError);
      }

      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      if (error.code === 'auth/user-not-found') {
        Alert.alert('Account Not Found', 'No account exists with this email. Please sign up.');
        setIsNewUser(true);
      } else if (error.code === 'auth/wrong-password') {
        Alert.alert('Incorrect Password', 'The password you entered is incorrect.');
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert('Too Many Attempts', 'Please wait a few minutes before trying again.');
      } else {
        Alert.alert('Sign In Failed', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      Keyboard.dismiss();

      // Create account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // Send verification email (optional, non-blocking)
      try {
        await sendEmailVerification(userCredential.user);
        console.log('Verification email sent');
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }

      // Link RevenueCat
      try {
        await Purchases.logIn(userCredential.user.uid);
        console.log('RevenueCat user linked successfully');
      } catch (rcError) {
        console.error('RevenueCat linking failed:', rcError);
      }

      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert(
          'Email Already Registered',
          'An account already exists with this email. Please sign in instead.',
          [{ text: 'OK', onPress: () => setIsNewUser(false) }]
        );
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Weak Password', 'Please choose a stronger password (at least 6 characters).');
      } else {
        Alert.alert('Sign Up Failed', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Enter Email', 'Please enter your email address first.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Password Reset Email Sent',
        'Check your email for instructions to reset your password.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/user-not-found') {
        Alert.alert('Email Not Found', 'No account exists with this email address.');
      } else {
        Alert.alert('Error', 'Failed to send password reset email. Please try again.');
      }
    }
  };

  const toggleAuthMode = () => {
    setIsSignUpMode(!isSignUpMode);
    setPassword('');
    setConfirmPassword('');
    setName('');
    setIsNewUser(null);
  };

  return (
    <LinearGradient colors={['#fef7ed', '#fdf2f8', '#f3e8ff']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color="#9333ea" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>
              {isSignUpMode ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignUpMode
                ? 'Join our affirmation community'
                : 'Sign in to your account'}
            </Text>
          </View>

          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#9333ea"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading}
                returnKeyType="next"
                onSubmitEditing={() => {
                  if (isSignUpMode) nameInputRef.current?.focus();
                  else passwordInputRef.current?.focus();
                }}
              />
              {checkingEmail && (
                <ActivityIndicator size="small" color="#9333ea" style={styles.inputLoader} />
              )}
            </View>

            {/* Name Input (Sign Up Only) */}
            {isSignUpMode && (
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#9333ea"
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={nameInputRef}
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#9ca3af"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                  editable={!loading}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                />
              </View>
            )}

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#9333ea"
                style={styles.inputIcon}
              />
              <TextInput
                ref={passwordInputRef}
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete={isSignUpMode ? 'password-new' : 'password'}
                editable={!loading}
                returnKeyType={isSignUpMode ? 'next' : 'go'}
                onSubmitEditing={() => {
                  if (isSignUpMode) confirmPasswordInputRef.current?.focus();
                  else handleSignIn();
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#9333ea"
                />
              </TouchableOpacity>
            </View>

            {/* Confirm Password (Sign Up Only) */}
            {isSignUpMode && (
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#9333ea"
                  style={styles.inputIcon}
                />
                <TextInput
                  ref={confirmPasswordInputRef}
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  editable={!loading}
                  returnKeyType="go"
                  onSubmitEditing={handleSignUp}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9333ea"
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Forgot Password Link (Sign In Only) */}
            {!isSignUpMode && (
              <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={isSignUpMode ? handleSignUp : handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isSignUpMode ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Toggle Auth Mode */}
            <TouchableOpacity onPress={toggleAuthMode} disabled={loading}>
              <Text style={styles.toggleText}>
                {isSignUpMode ? 'Already have an account? ' : "Don't have an account? "}
                <Text style={styles.toggleLink}>
                  {isSignUpMode ? 'Sign In' : 'Sign Up'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 24,
    zIndex: 1,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ec4899',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9333ea',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  inputLoader: {
    marginLeft: 8,
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 8,
  },
  forgotPassword: {
    color: '#ec4899',
    fontSize: 14,
    textAlign: 'right',
    marginTop: -8,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#ec4899',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6b7280',
  },
  toggleLink: {
    color: '#ec4899',
    fontWeight: '600',
  },
});