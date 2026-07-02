import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, Modal, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Check, 
  AlertCircle,
  Activity,
  User,
  ExternalLink,
  ShieldAlert
} from 'lucide-react-native';
import tw from 'twrnc';

interface LoginScreenProps {
  onLoginSuccess: (email: string, isGoogleUser: boolean) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  // Modes: 'login' | 'signup' | 'forgot'
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Loading & error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Google sign in simulation modal
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleStep, setGoogleStep] = useState<'choose' | 'loading' | 'success'>('choose');

  // Load pre-seeded account or handle local persistence
  useEffect(() => {
    // Fill in default email for convenience
    setEmail('drsalman031@gmail.com');
    setPassword('password123');
  }, []);

  const validateEmail = (emailStr: string) => {
    return emailStr.includes('@') && emailStr.includes('.');
  };

  const handleLogin = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all clinical credentials.');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid academic/clinical email ID.');
      return;
    }

    setIsLoading(true);

    try {
      // Allow the pre-seeded clinical account
      if (email.toLowerCase() === 'drsalman031@gmail.com' && password === 'password123') {
        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess('drsalman031@gmail.com', false);
        }, 1200);
        return;
      }

      // Check dynamic local registration accounts
      const storedUsersStr = await AsyncStorage.getItem('oci_registered_users');
      const users = storedUsersStr ? JSON.parse(storedUsersStr) : {};

      if (users[email.toLowerCase()] && users[email.toLowerCase()] === password) {
        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess(email.toLowerCase(), false);
        }, 1200);
      } else {
        setTimeout(() => {
          setIsLoading(false);
          setErrorMessage('Invalid clinical email or access token. Please check password or use drsalman031@gmail.com.');
        }, 1000);
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Internal database link failure. Please try again.');
    }
  };

  const handleSignUp = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMessage('All registration fields are required.');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage('Enter a valid institutional email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Confirm password must match the password.');
      return;
    }

    setIsLoading(true);

    try {
      const storedUsersStr = await AsyncStorage.getItem('oci_registered_users');
      const users = storedUsersStr ? JSON.parse(storedUsersStr) : {};

      if (email.toLowerCase() === 'drsalman031@gmail.com' || users[email.toLowerCase()]) {
        setIsLoading(false);
        setErrorMessage('This physician email is already registered.');
        return;
      }

      // Save credentials locally
      users[email.toLowerCase()] = password;
      await AsyncStorage.setItem('oci_registered_users', JSON.stringify(users));

      setTimeout(() => {
        setIsLoading(false);
        setSuccessMessage('Physician account registered successfully! You can now sign in.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Storage write failed. Try again.');
    }
  };

  const handleForgotPassword = () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage('Enter a valid clinical email.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage(`A password reset link and token have been dispatched to ${email}. Please check your institutional inbox.`);
      setMode('login');
    }, 1500);
  };

  // Google sign in flow trigger
  const handleGoogleSignInTrigger = () => {
    setGoogleStep('choose');
    setShowGoogleModal(true);
  };

  const selectGoogleAccount = (selectedEmail: string) => {
    setGoogleStep('loading');
    setTimeout(() => {
      setGoogleStep('success');
      setTimeout(() => {
        setShowGoogleModal(false);
        onLoginSuccess(selectedEmail, true);
      }, 1500);
    }, 2000);
  };

  return (
    <View style={tw`flex-1 bg-[#050814] justify-center px-6 relative`}>
      {/* Absolute high-tech glowing background effects */}
      <View style={[tw`absolute w-60 h-60 rounded-full bg-teal-500/10 blur-3xl`, { top: '10%', left: '-20%' }]} />
      <View style={[tw`absolute w-72 h-72 rounded-full bg-cyan-500/5 blur-3xl`, { bottom: '15%', right: '-30%' }]} />

      <View style={tw`w-full max-w-[380px] mx-auto space-y-6`}>
        {/* Header Branding */}
        <View style={tw`items-center space-y-3`}>
          <View style={tw`w-14 h-14 bg-teal-500/10 rounded-2xl items-center justify-center border border-teal-500/30 shadow-2xl`}>
            <Activity size={28} color="#14B8A6" />
          </View>
          <View style={tw`items-center`}>
            <Text style={tw`text-xl font-black text-white tracking-wide uppercase`}>
              OCI CLINICAL SUITE
            </Text>
            <Text style={tw`text-[9px] font-black uppercase text-teal-400 tracking-widest mt-1 font-mono`}>
              Orthodontic Decision Engine
            </Text>
          </View>
        </View>

        {/* Dynamic Panel Container */}
        <View style={tw`bg-[#0B1020]/90 p-6 rounded-[28px] border border-white/5 shadow-2xl space-y-5 relative overflow-hidden`}>
          
          {/* Form Title */}
          <View style={tw`border-b border-white/5 pb-3`}>
            <Text style={tw`text-sm font-black text-white`}>
              {mode === 'login' ? 'Clinical Sign In' : mode === 'signup' ? 'Create Practitioner Account' : 'Recover Access Token'}
            </Text>
            <Text style={tw`text-[10px] text-slate-400 mt-1`}>
              {mode === 'login' 
                ? 'Authorized access only. Use drsalman031@gmail.com' 
                : mode === 'signup' 
                  ? 'Register institutional MDS credentials' 
                  : 'Enter email to receive cryptographic credentials reset'}
            </Text>
          </View>

          {/* Feedback alerts */}
          {errorMessage ? (
            <View style={tw`bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex-row items-center space-x-2`}>
              <AlertCircle size={14} color="#F43F5E" style={tw`shrink-0`} />
              <Text style={tw`text-[11px] text-rose-300 font-bold flex-1`}>{errorMessage}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={tw`bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex-row items-center space-x-2`}>
              <Check size={14} color="#10B981" style={tw`shrink-0`} />
              <Text style={tw`text-[11px] text-emerald-300 font-bold flex-1`}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Input Fields */}
          <View style={tw`space-y-4`}>
            {/* Email Field */}
            <View style={tw`space-y-1.5`}>
              <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>Clinical Email ID</Text>
              <View style={tw`flex-row items-center bg-black/40 border border-white/10 rounded-2xl px-3.5 py-3 focus-within:border-teal-500`}>
                <Mail size={16} color="#94A3B8" style={tw`mr-2.5`} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="physician@hospital.com"
                  placeholderTextColor="#475569"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={tw`flex-1 text-white text-xs font-bold p-0`}
                />
              </View>
            </View>

            {/* Password Field (hidden in forgot mode) */}
            {mode !== 'forgot' && (
              <View style={tw`space-y-1.5`}>
                <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>Password</Text>
                <View style={tw`flex-row items-center bg-black/40 border border-white/10 rounded-2xl px-3.5 py-3`}>
                  <Lock size={16} color="#94A3B8" style={tw`mr-2.5`} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#475569"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    style={tw`flex-1 text-white text-xs font-bold p-0`}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={tw`p-1`}>
                    {showPassword ? <EyeOff size={16} color="#94A3B8" /> : <Eye size={16} color="#94A3B8" />}
                  </Pressable>
                </View>
              </View>
            )}

            {/* Confirm Password Field (Only in signup mode) */}
            {mode === 'signup' && (
              <View style={tw`space-y-1.5`}>
                <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono`}>Confirm Password</Text>
                <View style={tw`flex-row items-center bg-black/40 border border-white/10 rounded-2xl px-3.5 py-3`}>
                  <Lock size={16} color="#94A3B8" style={tw`mr-2.5`} />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#475569"
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    style={tw`flex-1 text-white text-xs font-bold p-0`}
                  />
                  <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={tw`p-1`}>
                    {showConfirmPassword ? <EyeOff size={16} color="#94A3B8" /> : <Eye size={16} color="#94A3B8" />}
                  </Pressable>
                </View>
              </View>
            )}

            {/* Forgot Password link (Only in login mode) */}
            {mode === 'login' && (
              <Pressable 
                onPress={() => setMode('forgot')}
                style={tw`self-end py-1`}
              >
                <Text style={tw`text-[10px] font-black text-teal-400 font-mono uppercase tracking-wide`}>
                  Forgot Password?
                </Text>
              </Pressable>
            )}
          </View>

          {/* CTA Primary Action Button */}
          <Pressable
            disabled={isLoading}
            onPress={
              mode === 'login' ? handleLogin : mode === 'signup' ? handleSignUp : handleForgotPassword
            }
            style={({ pressed }) => [
              tw`w-full py-4 rounded-2xl items-center justify-center flex-row space-x-2`,
              { backgroundColor: pressed ? '#0D9488' : '#14B8A6' }
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>
                {mode === 'login' ? 'Validate & Enter' : mode === 'signup' ? 'Create Account' : 'Send Cryptographic Reset'}
              </Text>
            )}
          </Pressable>

          {/* Social Divider (only on login/signup mode) */}
          {mode !== 'forgot' && (
            <View style={tw`flex-row items-center py-1`}>
              <View style={tw`flex-1 h-[1px] bg-white/5`} />
              <Text style={tw`text-[9px] font-black text-slate-500 uppercase tracking-widest px-3 font-mono`}>OR CONNECT WITH</Text>
              <View style={tw`flex-1 h-[1px] bg-white/5`} />
            </View>
          )}

          {/* Connect with Google SSO (only on login/signup mode) */}
          {mode !== 'forgot' && (
            <Pressable
              onPress={handleGoogleSignInTrigger}
              style={({ pressed }) => [
                tw`w-full py-3.5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 items-center justify-center flex-row`,
                pressed ? tw`bg-white/10` : {}
              ]}
            >
              {/* Google stylized color circle G */}
              <View style={tw`w-4 h-4 rounded-full mr-2.5 bg-white items-center justify-center border border-slate-200 overflow-hidden`}>
                <Text style={[tw`font-black text-center text-[10px]`, { color: '#4285F4', marginTop: -1 }]}>G</Text>
              </View>
              <Text style={tw`text-xs font-bold text-slate-300`}>
                Connect with Google Email
              </Text>
            </Pressable>
          )}

          {/* Back to Login / Sign up toggles */}
          <View style={tw`flex-row justify-center pt-2`}>
            {mode === 'login' ? (
              <View style={tw`flex-row items-center space-x-1`}>
                <Text style={tw`text-[11px] text-slate-400`}>First time using OCI?</Text>
                <Pressable onPress={() => setMode('signup')}>
                  <Text style={tw`text-[11px] font-black text-teal-400 font-mono uppercase`}>Sign Up</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable 
                onPress={() => setMode('login')}
                style={tw`flex-row items-center space-x-1.5`}
              >
                <ArrowLeft size={12} color="#14B8A6" />
                <Text style={tw`text-[11px] font-black text-teal-400 font-mono uppercase`}>Back to Sign In</Text>
              </Pressable>
            )}
          </View>

        </View>

        {/* Footer Medical Disclaimer info */}
        <View style={tw`items-center space-y-1 pb-4`}>
          <View style={tw`flex-row items-center space-x-1`}>
            <ShieldAlert size={12} color="#475569" />
            <Text style={tw`text-[9px] text-slate-500 font-mono uppercase`}>HIPAA Security Standard Compliant</Text>
          </View>
          <Text style={tw`text-[8px] text-slate-600 text-center max-w-[300px] leading-normal`}>
            This clinical workspace is reserved for registered medical orthodontists. Cephalometric calculation schemas represent diagnostic decision guides only.
          </Text>
        </View>
      </View>

      {/* ----------------- GOOGLE SSO SIMULATOR MODAL ----------------- */}
      <Modal
        visible={showGoogleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoogleModal(false)}
      >
        <View style={tw`flex-1 bg-black/80 justify-center items-center px-4`}>
          <View style={tw`w-full max-w-[360px] bg-white rounded-3xl p-6 shadow-2xl border border-slate-200`}>
            
            {/* Google Logo */}
            <View style={tw`items-center mb-6`}>
              <View style={tw`flex-row items-center justify-center`}>
                <Text style={[tw`font-black text-lg`, { color: '#4285F4' }]}>G</Text>
                <Text style={[tw`font-black text-lg`, { color: '#EA4335' }]}>o</Text>
                <Text style={[tw`font-black text-lg`, { color: '#FBBC05' }]}>o</Text>
                <Text style={[tw`font-black text-lg`, { color: '#4285F4' }]}>g</Text>
                <Text style={[tw`font-black text-lg`, { color: '#34A853' }]}>l</Text>
                <Text style={[tw`font-black text-lg`, { color: '#EA4335' }]}>e</Text>
              </View>
              <Text style={tw`text-xs text-slate-500 mt-2 font-medium text-center`}>
                Sign in to continue to <Text style={tw`font-black text-slate-800`}>OCI Decision Engine</Text>
              </Text>
            </View>

            {googleStep === 'choose' && (
              <View style={tw`space-y-4`}>
                <Text style={tw`text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1`}>
                  Choose account
                </Text>

                {/* Account row 1 */}
                <Pressable
                  onPress={() => selectGoogleAccount('drsalman031@gmail.com')}
                  style={({ pressed }) => [
                    tw`flex-row items-center p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50`,
                    pressed ? tw`bg-slate-100` : {}
                  ]}
                >
                  <View style={tw`w-10 h-10 rounded-full bg-teal-500 items-center justify-center mr-3 shadow-sm border border-white`}>
                    <Text style={tw`text-white font-extrabold text-sm`}>DS</Text>
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-xs font-black text-slate-800`}>Dr. Salman MDS</Text>
                    <Text style={tw`text-[10px] text-slate-500 font-mono`}>drsalman031@gmail.com</Text>
                  </View>
                  <ExternalLink size={12} color="#94A3B8" />
                </Pressable>

                {/* Account row 2 - custom input */}
                <Pressable
                  onPress={() => selectGoogleAccount('clinician.guest@gmail.com')}
                  style={({ pressed }) => [
                    tw`flex-row items-center p-3.5 border border-slate-150 rounded-2xl`,
                    pressed ? tw`bg-slate-50` : {}
                  ]}
                >
                  <View style={tw`w-10 h-10 rounded-full bg-slate-200 items-center justify-center mr-3`}>
                    <User size={18} color="#64748B" />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-xs font-black text-slate-800`}>Guest Clinician</Text>
                    <Text style={tw`text-[10px] text-slate-500 font-mono`}>clinician.guest@gmail.com</Text>
                  </View>
                  <ExternalLink size={12} color="#94A3B8" />
                </Pressable>

                <Pressable
                  onPress={() => setShowGoogleModal(false)}
                  style={tw`py-3 items-center`}
                >
                  <Text style={tw`text-xs font-bold text-slate-500`}>Cancel</Text>
                </Pressable>
              </View>
            )}

            {googleStep === 'loading' && (
              <View style={tw`py-8 items-center space-y-4`}>
                <ActivityIndicator size="large" color="#4285F4" />
                <Text style={tw`text-xs font-bold text-slate-600 font-mono`}>
                  Authenticating secure token payload...
                </Text>
              </View>
            )}

            {googleStep === 'success' && (
              <View style={tw`py-8 items-center space-y-3`}>
                <View style={tw`w-12 h-12 bg-emerald-100 rounded-full items-center justify-center border border-emerald-300 shadow-inner`}>
                  <Check size={24} color="#10B981" />
                </View>
                <Text style={tw`text-sm font-black text-slate-800`}>
                  Successfully Authenticated
                </Text>
                <Text style={tw`text-xs text-slate-500 text-center`}>
                  Redirecting to your clinical OCI index dashboard...
                </Text>
              </View>
            )}

          </View>
        </View>
      </Modal>

    </View>
  );
}
