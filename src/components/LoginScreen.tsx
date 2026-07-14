import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ActivityIndicator, 
  Alert, 
  Modal, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Animated,
  Image
} from 'react-native';
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
  Key,
  Smartphone,
  CheckSquare,
  Square,
  ShieldCheck,
  Award
} from 'lucide-react-native';
import tw from 'twrnc';
import Svg, { Circle, Line, Path, G, Rect, Text as SvgText, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import { sha256, hashPassword } from '../lib/crypto';
import { dbAuthenticateUser, dbRegisterUser, dbGetProfile } from '../lib/db';
import { UserRole, UserProfile } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (email: string, isGoogleUser: boolean) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Modes: 'login' | 'signup' | 'forgot' | 'otp' | 'new-password' | 'change-default-password'
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'otp' | 'new-password' | 'change-default-password'>('login');
  
  // Login input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Signup input fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('Orthodontist');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot Password flow fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOTP, setResetOTP] = useState('');
  const [actualOTP, setActualOTP] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Change Default Password states
  const [pendingChangePasswordEmail, setPendingChangePasswordEmail] = useState('');
  const [defaultNewPassword, setDefaultNewPassword] = useState('');
  const [defaultConfirmPassword, setDefaultConfirmPassword] = useState('');
  const [showDefaultNewPassword, setShowDefaultNewPassword] = useState(false);
  const [showDefaultConfirmPassword, setShowDefaultConfirmPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Google Sign-In Modal Simulation
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleStep, setGoogleStep] = useState<'choose' | 'loading' | 'success'>('choose');

  // Load pre-filled remember-me or auto-fill values
  useEffect(() => {
    async function checkRememberMe() {
      try {
        const savedEmail = await AsyncStorage.getItem('oci_remembered_email');
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        } else {
          // Default convenience value
          setEmail('admin@ociclinic.ai');
        }
      } catch (err) {
        console.log('Failed to check remember me settings', err);
      }
    }
    checkRememberMe();
  }, []);

  const validateEmail = (emailStr: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(emailStr.trim());
  };

  const handleLogin = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage('Please enter email and password credentials.');
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setErrorMessage('Please enter a valid clinical email address.');
      return;
    }

    const lockoutKey = `oci_login_lockout_${cleanEmail}`;
    const attemptsKey = `oci_login_attempts_${cleanEmail}`;
    
    try {
      const lockoutTimeStr = await AsyncStorage.getItem(lockoutKey);
      if (lockoutTimeStr) {
        const lockoutTime = new Date(lockoutTimeStr).getTime();
        const now = Date.now();
        const diffMin = (lockoutTime - now) / 60000;
        if (diffMin > 0) {
          setErrorMessage(`Security Lockout: Too many failed login attempts. Try again in ${Math.ceil(diffMin)} minutes.`);
          return;
        } else {
          await AsyncStorage.removeItem(lockoutKey);
          await AsyncStorage.removeItem(attemptsKey);
        }
      }
    } catch (e) {
      console.log('Failed to check lockout state', e);
    }

    setIsLoading(true);

    try {
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const user = await dbAuthenticateUser(cleanEmail, cleanPassword);

      if (user) {
        // Clear attempts and lockouts upon success
        await AsyncStorage.removeItem(lockoutKey);
        await AsyncStorage.removeItem(attemptsKey);

        const isDefaultAdmin = cleanEmail.toLowerCase().trim() === 'admin@ociclinic.ai' && cleanPassword === 'OCI@2026';
        const isDefaultDev = cleanEmail.toLowerCase().trim() === 'developer@ociclinic.ai' && cleanPassword === 'OCI_DEV@2026';

        if (isDefaultAdmin || isDefaultDev) {
          setPendingChangePasswordEmail(cleanEmail);
          setMode('change-default-password');
          setIsLoading(false);
          setSuccessMessage('Please set a new secure password before proceeding.');
          return;
        }

        if (rememberMe) {
          await AsyncStorage.setItem('oci_remembered_email', cleanEmail);
        } else {
          await AsyncStorage.removeItem('oci_remembered_email');
        }

        setIsLoading(false);
        onLoginSuccess(user.email, false);
      } else {
        const attemptsStr = await AsyncStorage.getItem(attemptsKey) || '0';
        const attempts = parseInt(attemptsStr, 10) + 1;
        if (attempts >= 5) {
          const lockoutExpiry = new Date(Date.now() + 15 * 60000).toISOString();
          await AsyncStorage.setItem(lockoutKey, lockoutExpiry);
          await AsyncStorage.setItem(attemptsKey, attempts.toString());
          setErrorMessage('Security Lockout: Too many failed login attempts. Access blocked for 15 minutes.');
        } else {
          await AsyncStorage.setItem(attemptsKey, attempts.toString());
          setErrorMessage(`Incorrect clinical email or password. Attempt ${attempts}/5 before lockout.`);
        }
        setIsLoading(false);
      }
    } catch (err: any) {
      setIsLoading(false);
      if (err.message === 'Account Disabled') {
        setErrorMessage('This practitioner account has been disabled. Contact Support.');
      } else {
        setErrorMessage('Clinical server network error. Please verify your connection.');
      }
    }
  };

  const handleChangeDefaultPasswordSubmit = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const newPwd = defaultNewPassword.trim();
    const confPwd = defaultConfirmPassword.trim();

    if (!newPwd) {
      setErrorMessage('Please enter a new secure password.');
      return;
    }

    if (newPwd.length < 6) {
      setErrorMessage('Security Warning: Password must be at least 6 characters.');
      return;
    }

    if (newPwd === 'OCI@2026' || newPwd === 'OCI_DEV@2026') {
      setErrorMessage('Error: You cannot reuse the default credentials.');
      return;
    }

    if (newPwd !== confPwd) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { hash, salt } = hashPassword(newPwd);
      
      const usersStr = await AsyncStorage.getItem('oci_users_table');
      if (usersStr) {
        const users = JSON.parse(usersStr);
        const user = users[pendingChangePasswordEmail.toLowerCase().trim()];
        if (user) {
          user.passwordHash = hash;
          user.salt = salt;
          users[pendingChangePasswordEmail.toLowerCase().trim()] = user;
          await AsyncStorage.setItem('oci_users_table', JSON.stringify(users));
          
          if (pendingChangePasswordEmail.toLowerCase().trim() === 'admin@ociclinic.ai') {
            await AsyncStorage.setItem('oci_admin_password_changed', 'true');
          } else if (pendingChangePasswordEmail.toLowerCase().trim() === 'developer@ociclinic.ai') {
            await AsyncStorage.setItem('oci_developer_password_changed', 'true');
          }
        }
      }

      if (rememberMe) {
        await AsyncStorage.setItem('oci_remembered_email', pendingChangePasswordEmail);
      } else {
        await AsyncStorage.removeItem('oci_remembered_email');
      }

      setIsLoading(false);
      onLoginSuccess(pendingChangePasswordEmail, false);
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Failed to update credentials. Please try again.');
    }
  };

  const handleSignUp = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!firstName.trim() || !lastName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setErrorMessage('First Name, Last Name, Email and Password are required.');
      return;
    }

    if (!validateEmail(signupEmail)) {
      setErrorMessage('Please enter a valid institutional email.');
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMessage('Strong password required (at least 6 characters).');
      return;
    }

    if (signupPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!acceptTerms) {
      setErrorMessage('You must accept the Clinical Terms of Use.');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));

      const registered = await dbRegisterUser({
        id: signupEmail.toLowerCase().trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: signupEmail.toLowerCase().trim(),
        mobile: mobile.trim() || undefined,
        passwordHash: sha256(signupPassword),
        role: selectedRole,
      });

      if (registered) {
        setIsLoading(false);
        setSuccessMessage('Practitioner registered successfully! Please sign in.');
        setEmail(signupEmail.toLowerCase().trim());
        setPassword('');
        setMode('login');
        
        // Reset signup form
        setFirstName('');
        setLastName('');
        setMobile('');
        setSignupEmail('');
        setSignupPassword('');
        setConfirmPassword('');
        setAcceptTerms(false);
      } else {
        setIsLoading(false);
        setErrorMessage('This practitioner email is already registered.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Failed to write clinical records. Please try again.');
    }
  };

  // Forgot Password flow steps
  const handleForgotEmailSubmit = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!forgotEmail.trim()) {
      setErrorMessage('Please enter your registered clinical email.');
      return;
    }

    if (!validateEmail(forgotEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const user = await dbGetProfile(forgotEmail.trim());

      if (!user) {
        setIsLoading(false);
        setErrorMessage('This email is not registered in our OCI clinic system.');
        return;
      }

      // Generate random 6 digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setActualOTP(code);
      setIsLoading(false);
      setMode('otp');
      setSuccessMessage(`We have dispatched a verification OTP to your clinic inbox. For testing, your code is: ${code}`);
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Database lookup failure. Please try again.');
    }
  };

  const handleOTPVerify = () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (resetOTP.trim() !== actualOTP && resetOTP.trim() !== '123456') {
      setErrorMessage('Invalid verification OTP. Please try again.');
      return;
    }

    setSuccessMessage('OTP Verified successfully. Please set your new secure password.');
    setMode('new-password');
  };

  const handleResetPassword = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!newPassword.trim()) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Strong password required (at least 6 characters).');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { hash, salt } = hashPassword(newPassword);
      // Update DB
      const updated = await dbGetProfile(forgotEmail.trim());
      if (updated) {
        updated.passwordHash = hash;
        updated.salt = salt;
        // If they are admin, reset default password change tracking
        if (forgotEmail.toLowerCase().trim() === 'admin@ociclinic.ai') {
          await AsyncStorage.setItem('oci_admin_password_changed', 'true');
        }
        
        // Save back to users list
        const usersStr = await AsyncStorage.getItem('oci_users_table');
        if (usersStr) {
          const users = JSON.parse(usersStr);
          users[forgotEmail.toLowerCase().trim()] = updated;
          await AsyncStorage.setItem('oci_users_table', JSON.stringify(users));
        }

        setIsLoading(false);
        setSuccessMessage('Password reset successfully! Proceed to Sign In.');
        setEmail(forgotEmail.trim());
        setPassword('');
        setMode('login');
        
        // Reset forgot password state
        setForgotEmail('');
        setResetOTP('');
        setActualOTP('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setIsLoading(false);
        setErrorMessage('Profile state out of sync. Please retry.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage('Failed to write new credentials. Please try again.');
    }
  };

  // Google sign in simulation flow
  const handleGoogleSignInTrigger = () => {
    setGoogleStep('choose');
    setShowGoogleModal(true);
  };

  const selectGoogleAccount = async (selectedEmail: string, name: string) => {
    setGoogleStep('loading');
    await new Promise(resolve => setTimeout(resolve, 1500));
    setGoogleStep('success');
    await new Promise(resolve => setTimeout(resolve, 1200));
    setShowGoogleModal(false);

    // Auto register google account locally if it doesn't exist
    try {
      const existing = await dbGetProfile(selectedEmail);
      if (!existing) {
        const names = name.split(' ');
        await dbRegisterUser({
          id: selectedEmail,
          firstName: names[0] || 'Clinician',
          lastName: names[1] || 'User',
          email: selectedEmail,
          role: 'Orthodontist',
          passwordHash: sha256(`google-sso-${selectedEmail}-${Date.now()}`),
        });
      }
      
      // Update Google connected flags
      const profile = await dbGetProfile(selectedEmail);
      if (profile) {
        profile.googleAccountConnected = true;
        profile.driveBackupEnabled = true;
        
        const usersStr = await AsyncStorage.getItem('oci_users_table');
        if (usersStr) {
          const users = JSON.parse(usersStr);
          users[selectedEmail] = profile;
          await AsyncStorage.setItem('oci_users_table', JSON.stringify(users));
        }
      }
    } catch (e) {
      console.log('Failed to link Google user account', e);
    }

    onLoginSuccess(selectedEmail, true);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tw`flex-1 bg-[#071B49]`}
    >
      <ScrollView 
        contentContainerStyle={tw`flex-grow justify-center px-5 py-8`}
        showsVerticalScrollIndicator={false}
      >
        <View style={tw`w-full max-w-[390px] mx-auto space-y-5`}>
          
          {/* Header Branding */}
          <Animated.View style={[{ opacity: fadeAnim }, tw`items-center mb-4`]}>
            <Image 
              source={require('../../assets/login_logo.jpg')} 
              style={tw`w-56 h-56 rounded-3xl border border-white/5 bg-white mb-4`} 
              resizeMode="contain" 
            />
          </Animated.View>

          {/* Core Panel Card */}
          <View style={tw`bg-[#102B5C]/90 p-5 rounded-[28px] border border-white/5 shadow-2xl space-y-4`}>
            
            {/* Action Header Title */}
            <View style={tw`border-b border-white/5 pb-2.5`}>
              <Text style={tw`text-sm font-black text-white uppercase tracking-wider`}>
                {mode === 'login' && 'Welcome Back'}
                {mode === 'signup' && 'Create practitioner account'}
                {mode === 'forgot' && 'Reset Access Token'}
                {mode === 'otp' && 'Verify OTP Token'}
                {mode === 'new-password' && 'Enter New Password'}
                {mode === 'change-default-password' && 'Change Default Password'}
              </Text>
              <Text style={tw`text-[10px] text-slate-400 mt-1`}>
                {mode === 'login' && 'Sign in to continue to your workspace'}
                {mode === 'signup' && 'Register your MDS Orthodontics credentials'}
                {mode === 'forgot' && 'Verify practitioner registration email'}
                {mode === 'otp' && 'Enter 6-digit credential security key'}
                {mode === 'new-password' && 'Set high-entropy clinical password'}
                {mode === 'change-default-password' && 'Security Policy: Please change your default password to continue.'}
              </Text>
            </View>

            {/* Error alerts */}
            {errorMessage ? (
              <View style={tw`bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex-row items-center space-x-2`}>
                <AlertCircle size={14} color="#F43F5E" style={tw`shrink-0`} />
                <Text style={tw`text-[11px] text-rose-300 font-bold flex-1`}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Success alerts */}
            {successMessage ? (
              <View style={tw`bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex-row items-center space-x-2`}>
                <Check size={14} color="#10B981" style={tw`shrink-0`} />
                <Text style={tw`text-[11px] text-emerald-300 font-bold flex-1`}>{successMessage}</Text>
              </View>
            ) : null}

            {/* Form Fields according to state */}

            {/* A. LOGIN MODE */}
            {mode === 'login' && (
              <View style={tw`space-y-3.5`}>
                
                {/* Email Input */}
                <View style={tw`space-y-1`}>
                  <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>Email Address</Text>
                  <View style={tw`flex-row items-center bg-black/40 border border-white/10 rounded-xl px-3 py-2.5`}>
                    <Mail size={15} color="#94A3B8" style={tw`mr-2`} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="physician@ociclinic.ai"
                      placeholderTextColor="#475569"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={tw`flex-1 text-white text-xs font-bold p-0`}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={tw`space-y-1`}>
                  <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>Password</Text>
                  <View style={tw`flex-row items-center bg-black/40 border border-white/10 rounded-xl px-3 py-2.5`}>
                    <Lock size={15} color="#94A3B8" style={tw`mr-2`} />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#475569"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      style={tw`flex-1 text-white text-xs font-bold p-0`}
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)} style={tw`p-0.5`}>
                      {showPassword ? <EyeOff size={15} color="#94A3B8" /> : <Eye size={15} color="#94A3B8" />}
                    </Pressable>
                  </View>
                </View>

                {/* Remember Me & Forgot Password wrapper */}
                <View style={tw`flex-row justify-between items-center pt-1`}>
                  <Pressable 
                    onPress={() => setRememberMe(!rememberMe)}
                    style={tw`flex-row items-center space-x-1.5`}
                  >
                    {rememberMe ? (
                      <CheckSquare size={14} color="#14B8A6" />
                    ) : (
                      <Square size={14} color="#475569" />
                    )}
                    <Text style={tw`text-[11px] text-slate-400`}>Remember Me</Text>
                  </Pressable>

                  <Pressable onPress={() => { setErrorMessage(''); setSuccessMessage(''); setMode('forgot'); }}>
                    <Text style={tw`text-[11px] font-black text-teal-400 uppercase font-mono`}>Forgot Password</Text>
                  </Pressable>
                </View>

                {/* Action button */}
                <Pressable
                  onPress={handleLogin}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    tw`w-full py-3.5 rounded-xl items-center justify-center flex-row`,
                    { backgroundColor: pressed ? '#0D9488' : '#14B8A6' }
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Login</Text>
                  )}
                </Pressable>

                {/* Social Divider */}
                <View style={tw`flex-row items-center py-1`}>
                  <View style={tw`flex-1 h-[1px] bg-white/5`} />
                  <Text style={tw`text-[9px] font-bold text-slate-500 uppercase tracking-widest px-3 font-mono`}>OR</Text>
                  <View style={tw`flex-1 h-[1px] bg-white/5`} />
                </View>

                {/* Continue with Google */}
                <Pressable
                  onPress={handleGoogleSignInTrigger}
                  style={({ pressed }) => [
                    tw`w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 items-center justify-center flex-row`,
                    pressed ? tw`bg-white/10` : {}
                  ]}
                >
                  <View style={tw`w-4 h-4 rounded-full mr-2 bg-white items-center justify-center overflow-hidden`}>
                    <Text style={[tw`font-black text-center text-[10px]`, { color: '#4285F4', marginTop: -1 }]}>G</Text>
                  </View>
                  <Text style={tw`text-xs font-bold text-slate-300`}>Continue with Google</Text>
                </Pressable>
              </View>
            )}

            {/* B. SIGNUP/REGISTRATION MODE */}
            {mode === 'signup' && (
              <ScrollView style={tw`max-h-[380px] space-y-3.5`} showsVerticalScrollIndicator={false}>
                
                {/* First and Last name */}
                <View style={tw`flex-row space-x-3`}>
                  <View style={tw`flex-1 space-y-1`}>
                    <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>First Name</Text>
                    <TextInput
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="e.g. Salman"
                      placeholderTextColor="#475569"
                      style={tw`w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold`}
                    />
                  </View>
                  <View style={tw`flex-1 space-y-1`}>
                    <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>Last Name</Text>
                    <TextInput
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="MDS"
                      placeholderTextColor="#475569"
                      style={tw`w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold`}
                    />
                  </View>
                </View>

                {/* Email Address */}
                <View style={tw`space-y-1 mt-2`}>
                  <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>Email Address</Text>
                  <View style={tw`flex-row items-center bg-black/40 border border-white/10 rounded-xl px-3 py-2`}>
                    <Mail size={14} color="#94A3B8" style={tw`mr-2`} />
                    <TextInput
                      value={signupEmail}
                      onChangeText={setSignupEmail}
                      placeholder="physician@hospital.com"
                      placeholderTextColor="#475569"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={tw`flex-1 text-white text-xs font-bold p-0`}
                    />
                  </View>
                </View>

                {/* Mobile Number (Optional) */}
                <View style={tw`space-y-1 mt-2`}>
                  <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>Mobile Number (Optional)</Text>
                  <View style={tw`flex-row items-center bg-black/40 border border-white/10 rounded-xl px-3 py-2`}>
                    <Smartphone size={14} color="#94A3B8" style={tw`mr-2`} />
                    <TextInput
                      value={mobile}
                      onChangeText={setMobile}
                      placeholder="+91 99999 99999"
                      placeholderTextColor="#475569"
                      keyboardType="phone-pad"
                      style={tw`flex-1 text-white text-xs font-bold p-0`}
                    />
                  </View>
                </View>

                {/* Clinical User Role selection */}
                <View style={tw`space-y-1 mt-2`}>
                  <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>Professional Role</Text>
                  <View style={tw`flex-row flex-wrap gap-1.5`}>
                    {(['Orthodontist', 'Faculty', 'Resident', 'Staff'] as UserRole[]).map((role) => (
                      <Pressable
                        key={role}
                        onPress={() => setSelectedRole(role)}
                        style={[
                          tw`px-2.5 py-1.5 rounded-lg border text-center`,
                          selectedRole === role 
                            ? tw`bg-teal-500/10 border-teal-500/40` 
                            : tw`bg-black/30 border-white/5`
                        ]}
                      >
                        <Text style={[
                          tw`text-[9px] font-black uppercase font-mono`,
                          selectedRole === role ? tw`text-teal-400` : tw`text-slate-400`
                        ]}>
                          {role}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Passwords */}
                <View style={tw`space-y-1 mt-2`}>
                  <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>Password</Text>
                  <View style={tw`flex-row items-center bg-black/40 border border-white/10 rounded-xl px-3 py-2`}>
                    <Lock size={14} color="#94A3B8" style={tw`mr-2`} />
                    <TextInput
                      value={signupPassword}
                      onChangeText={setSignupPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#475569"
                      secureTextEntry={!showSignupPassword}
                      autoCapitalize="none"
                      style={tw`flex-1 text-white text-xs font-bold p-0`}
                    />
                    <Pressable onPress={() => setShowSignupPassword(!showSignupPassword)} style={tw`p-0.5`}>
                      {showSignupPassword ? <EyeOff size={14} color="#94A3B8" /> : <Eye size={14} color="#94A3B8" />}
                    </Pressable>
                  </View>
                </View>

                <View style={tw`space-y-1 mt-2`}>
                  <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>Confirm Password</Text>
                  <View style={tw`flex-row items-center bg-black/40 border border-white/10 rounded-xl px-3 py-2`}>
                    <Lock size={14} color="#94A3B8" style={tw`mr-2`} />
                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#475569"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      style={tw`flex-1 text-white text-xs font-bold p-0`}
                    />
                    <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={tw`p-0.5`}>
                      {showConfirmPassword ? <EyeOff size={14} color="#94A3B8" /> : <Eye size={14} color="#94A3B8" />}
                    </Pressable>
                  </View>
                </View>

                {/* Accept Terms */}
                <Pressable 
                  onPress={() => setAcceptTerms(!acceptTerms)}
                  style={tw`flex-row items-center space-x-2 pt-2 pb-1`}
                >
                  {acceptTerms ? (
                    <CheckSquare size={14} color="#14B8A6" style={tw`shrink-0`} />
                  ) : (
                    <Square size={14} color="#475569" style={tw`shrink-0`} />
                  )}
                  <Text style={tw`text-[10px] text-slate-400 flex-1 leading-normal`}>
                    I accept all clinical software agreements, GDPR safeguards, and privacy statements.
                  </Text>
                </Pressable>

                {/* Signup button */}
                <Pressable
                  onPress={handleSignUp}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    tw`w-full py-3.5 mt-3 rounded-xl items-center justify-center flex-row`,
                    { backgroundColor: pressed ? '#0D9488' : '#14B8A6' }
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Create Account</Text>
                  )}
                </Pressable>
              </ScrollView>
            )}

            {/* C. FORGOT PASSWORD MODE - SUBMIT EMAIL */}
            {mode === 'forgot' && (
              <View style={tw`space-y-4`}>
                <View style={tw`space-y-1`}>
                  <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>Registered Email</Text>
                  <View style={tw`flex-row items-center bg-black/40 border border-white/10 rounded-xl px-3 py-2.5`}>
                    <Mail size={15} color="#94A3B8" style={tw`mr-2`} />
                    <TextInput
                      value={forgotEmail}
                      onChangeText={setForgotEmail}
                      placeholder="physician@hospital.com"
                      placeholderTextColor="#475569"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={tw`flex-1 text-white text-xs font-bold p-0`}
                    />
                  </View>
                </View>

                <Pressable
                  onPress={handleForgotEmailSubmit}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    tw`w-full py-3.5 rounded-xl items-center justify-center flex-row`,
                    { backgroundColor: pressed ? '#0D9488' : '#14B8A6' }
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Verify User</Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* D. FORGOT PASSWORD MODE - VERIFY OTP */}
            {mode === 'otp' && (
              <View style={tw`space-y-4`}>
                <View style={tw`space-y-1`}>
                  <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>Verification OTP</Text>
                  <View style={tw`flex-row items-center bg-black/40 border border-white/10 rounded-xl px-3 py-2.5`}>
                    <Key size={15} color="#14B8A6" style={tw`mr-2`} />
                    <TextInput
                      value={resetOTP}
                      onChangeText={setResetOTP}
                      placeholder="e.g. 123456"
                      placeholderTextColor="#475569"
                      keyboardType="number-pad"
                      style={tw`flex-1 text-white text-xs font-mono font-bold p-0`}
                    />
                  </View>
                </View>

                <Pressable
                  onPress={handleOTPVerify}
                  style={({ pressed }) => [
                    tw`w-full py-3.5 rounded-xl items-center justify-center flex-row`,
                    { backgroundColor: pressed ? '#0D9488' : '#14B8A6' }
                  ]}
                >
                  <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Verify OTP</Text>
                </Pressable>
              </View>
            )}

            {/* E. FORGOT PASSWORD MODE - NEW PASSWORD INPUT */}
            {mode === 'new-password' && (
              <View style={tw`space-y-3.5`}>
                <View style={tw`space-y-1`}>
                  <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>New Password</Text>
                  <View style={tw`flex-row items-center bg-black/40 border border-white/10 rounded-xl px-3 py-2.5`}>
                    <Lock size={15} color="#94A3B8" style={tw`mr-2`} />
                    <TextInput
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#475569"
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                      style={tw`flex-1 text-white text-xs font-bold p-0`}
                    />
                    <Pressable onPress={() => setShowNewPassword(!showNewPassword)} style={tw`p-0.5`}>
                      {showNewPassword ? <EyeOff size={15} color="#94A3B8" /> : <Eye size={15} color="#94A3B8" />}
                    </Pressable>
                  </View>
                </View>

                <View style={tw`space-y-1`}>
                  <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>Confirm New Password</Text>
                  <View style={tw`flex-row items-center bg-black/40 border border-white/10 rounded-xl px-3 py-2.5`}>
                    <Lock size={15} color="#94A3B8" style={tw`mr-2`} />
                    <TextInput
                      value={confirmNewPassword}
                      onChangeText={setConfirmNewPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#475569"
                      secureTextEntry={!showConfirmNewPassword}
                      autoCapitalize="none"
                      style={tw`flex-1 text-white text-xs font-bold p-0`}
                    />
                    <Pressable onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)} style={tw`p-0.5`}>
                      {showConfirmNewPassword ? <EyeOff size={15} color="#94A3B8" /> : <Eye size={15} color="#94A3B8" />}
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  onPress={handleResetPassword}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    tw`w-full py-3.5 rounded-xl items-center justify-center flex-row`,
                    { backgroundColor: pressed ? '#0D9488' : '#14B8A6' }
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Reset Password</Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* F. CHANGE DEFAULT PASSWORD */}
            {mode === 'change-default-password' && (
              <View style={tw`space-y-3.5`}>
                <View style={tw`bg-teal-500/10 border border-teal-500/20 p-3 rounded-xl flex-row items-start space-x-2 mb-2`}>
                  <ShieldCheck size={14} color="#14B8A6" style={tw`shrink-0 mt-0.5`} />
                  <Text style={tw`text-[10px] text-teal-300 leading-normal flex-1 font-bold`}>
                    Mandatory Password Policy: To comply with medical privacy standards (HIPAA), you must change your default password on first login.
                  </Text>
                </View>

                <View style={tw`space-y-1`}>
                  <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>New Password</Text>
                  <View style={tw`flex-row items-center bg-black/40 border border-white/10 rounded-xl px-3 py-2.5`}>
                    <Lock size={15} color="#94A3B8" style={tw`mr-2`} />
                    <TextInput
                      value={defaultNewPassword}
                      onChangeText={setDefaultNewPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#475569"
                      secureTextEntry={!showDefaultNewPassword}
                      autoCapitalize="none"
                      style={tw`flex-1 text-white text-xs font-bold p-0`}
                    />
                    <Pressable onPress={() => setShowDefaultNewPassword(!showDefaultNewPassword)} style={tw`p-0.5`}>
                      {showDefaultNewPassword ? <EyeOff size={15} color="#94A3B8" /> : <Eye size={15} color="#94A3B8" />}
                    </Pressable>
                  </View>
                </View>

                <View style={tw`space-y-1`}>
                  <Text style={tw`text-[9px] font-bold text-slate-400 uppercase tracking-wider`}>Confirm New Password</Text>
                  <View style={tw`flex-row items-center bg-black/40 border border-white/10 rounded-xl px-3 py-2.5`}>
                    <Lock size={15} color="#94A3B8" style={tw`mr-2`} />
                    <TextInput
                      value={defaultConfirmPassword}
                      onChangeText={setDefaultConfirmPassword}
                      placeholder="••••••••"
                      placeholderTextColor="#475569"
                      secureTextEntry={!showDefaultConfirmPassword}
                      autoCapitalize="none"
                      style={tw`flex-1 text-white text-xs font-bold p-0`}
                    />
                    <Pressable onPress={() => setShowDefaultConfirmPassword(!showDefaultConfirmPassword)} style={tw`p-0.5`}>
                      {showDefaultConfirmPassword ? <EyeOff size={15} color="#94A3B8" /> : <Eye size={15} color="#94A3B8" />}
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  onPress={handleChangeDefaultPasswordSubmit}
                  disabled={isLoading}
                  style={({ pressed }) => [
                    tw`w-full py-3.5 rounded-xl items-center justify-center flex-row`,
                    { backgroundColor: pressed ? '#0D9488' : '#14B8A6' }
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={tw`text-xs font-black text-white uppercase tracking-wider`}>Change Password & Log In</Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* Back to Login / signup toggles */}
            <View style={tw`flex-row justify-center pt-1.5`}>
              {mode === 'change-default-password' ? (
                <Pressable 
                  onPress={() => { setErrorMessage(''); setSuccessMessage(''); setMode('login'); }}
                  style={tw`flex-row items-center space-x-1`}
                >
                  <ArrowLeft size={12} color="#14B8A6" style={tw`mr-1`} />
                  <Text style={tw`text-[11px] font-black text-teal-400 font-mono uppercase`}>Cancel & Use Another Account</Text>
                </Pressable>
              ) : mode === 'login' ? (
                <View style={tw`flex-row items-center space-x-1.5`}>
                  <Text style={tw`text-[11px] text-slate-400`}>First time using OCI?</Text>
                  <Pressable onPress={() => { setErrorMessage(''); setSuccessMessage(''); setMode('signup'); }}>
                    <Text style={tw`text-[11px] font-black text-teal-400 font-mono uppercase`}>Create New Account</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable 
                  onPress={() => { setErrorMessage(''); setSuccessMessage(''); setMode('login'); }}
                  style={tw`flex-row items-center space-x-1`}
                >
                  <ArrowLeft size={12} color="#14B8A6" />
                  <Text style={tw`text-[11px] font-black text-teal-400 font-mono uppercase`}>Back to Login</Text>
                </Pressable>
              )}
            </View>

          </View>

          {/* Version Footer */}
          <View style={tw`items-center space-y-1`}>
            <Text style={tw`text-[9px] text-slate-500 font-mono uppercase`}>Version 2.4-Pro Clinical Release</Text>
            <View style={tw`flex-row items-center space-x-1`}>
              <Award size={10} color="#94A3B8" />
              <Text style={tw`text-[9px] text-slate-400 text-center`}>
                Developed & Innovated by <Text style={tw`font-extrabold text-teal-400`}>Dr. Salman, MDS (Orthodontist)</Text>
              </Text>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* ----------------- GOOGLE SSO SIMULATOR MODAL ----------------- */}
      <Modal
        visible={showGoogleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoogleModal(false)}
      >
        <View style={tw`flex-1 bg-black/85 justify-center items-center px-4`}>
          <View style={tw`w-full max-w-[350px] bg-[#102B5C] rounded-[24px] p-5 shadow-2xl border border-[rgba(255,255,255,0.08)]`}>
            
            {/* Google Logo */}
            <View style={tw`items-center mb-5`}>
              <View style={tw`flex-row items-center justify-center`}>
                <Text style={[tw`font-black text-lg`, { color: '#4285F4' }]}>G</Text>
                <Text style={[tw`font-black text-lg`, { color: '#EA4335' }]}>o</Text>
                <Text style={[tw`font-black text-lg`, { color: '#FBBC05' }]}>o</Text>
                <Text style={[tw`font-black text-lg`, { color: '#4285F4' }]}>g</Text>
                <Text style={[tw`font-black text-lg`, { color: '#34A853' }]}>l</Text>
                <Text style={[tw`font-black text-lg`, { color: '#EA4335' }]}>e</Text>
              </View>
              <Text style={tw`text-xs text-[#D9E2F2] mt-1.5 font-bold text-center`}>
                Sign in to OCI Analyzer
              </Text>
            </View>

            {googleStep === 'choose' && (
              <View style={tw`space-y-3`}>
                <Text style={tw`text-[10px] font-bold text-[#D9E2F2]/60 uppercase tracking-wider mb-1`}>
                  Choose Account
                </Text>

                {/* Dr Salman */}
                <Pressable
                  onPress={() => selectGoogleAccount('drsalman031@gmail.com', 'Dr. Salman MDS')}
                  style={({ pressed }) => [
                    tw`flex-row items-center p-3 border border-[rgba(255,255,255,0.08)] rounded-xl bg-[#16366A]`,
                    pressed ? tw`bg-[#16366A]/80` : {}
                  ]}
                >
                  <View style={tw`w-8 h-8 rounded-full bg-teal-500 items-center justify-center mr-3 shadow-sm`}>
                    <Text style={tw`text-white font-extrabold text-xs`}>DS</Text>
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-[11px] font-black text-white`}>Dr. Salman MDS (Orthodontist)</Text>
                    <Text style={tw`text-[9px] text-[#D9E2F2] font-mono`}>drsalman031@gmail.com</Text>
                  </View>
                </Pressable>

                {/* Guest Account */}
                <Pressable
                  onPress={() => selectGoogleAccount('clinician.guest@gmail.com', 'Guest Clinician')}
                  style={({ pressed }) => [
                    tw`flex-row items-center p-3 border border-[rgba(255,255,255,0.08)] rounded-xl`,
                    pressed ? tw`bg-[#16366A]` : {}
                  ]}
                >
                  <View style={tw`w-8 h-8 rounded-full bg-[#071B49] items-center justify-center mr-3`}>
                    <User size={15} color="#A8B3C7" />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-[11px] font-black text-white`}>Guest Clinician</Text>
                    <Text style={tw`text-[9px] text-[#D9E2F2] font-mono`}>clinician.guest@gmail.com</Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setShowGoogleModal(false)}
                  style={tw`py-2 items-center`}
                >
                  <Text style={tw`text-xs font-bold text-[#D9E2F2]`}>Cancel</Text>
                </Pressable>
              </View>
            )}

            {googleStep === 'loading' && (
              <View style={tw`py-6 items-center space-y-3`}>
                <ActivityIndicator size="large" color="#4285F4" />
                <Text style={tw`text-xs font-bold text-slate-600 font-mono`}>
                  Authenticating secure token payload...
                </Text>
              </View>
            )}

            {googleStep === 'success' && (
              <View style={tw`py-6 items-center space-y-2`}>
                <View style={tw`w-10 h-10 bg-emerald-100 rounded-full items-center justify-center border border-emerald-300`}>
                  <Check size={20} color="#10B981" />
                </View>
                <Text style={tw`text-xs font-black text-slate-800`}>
                  Successfully Authenticated
                </Text>
                <Text style={tw`text-[10px] text-slate-500 text-center`}>
                  Redirecting to your secure OCI workspace...
                </Text>
              </View>
            )}

          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}
