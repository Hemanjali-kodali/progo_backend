import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap, 
  UserCircle, 
  Users, 
  Lock, 
  Eye, 
  EyeOff,
  LogIn,
  AlertCircle,
  Bot,
  TrendingUp,
  Clock
} from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import { buildApiUrl } from '../utils/api';

const Login = ({ onLogin, theme, toggleTheme }) => {
  const [role, setRole] = useState('student');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotOtp, setForgotOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const forgotExampleContact = role === 'parent' ? 'parent email linked to registration' : 'student email linked to registration';

  const handleForgotPasswordClick = () => {
    setShowForgotPassword(true);
    setForgotOtp('');
    setOtpSent(false);
    setOtpVerified(false);
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotError('');
    setForgotSuccess('');
  };

  const handleSendOtp = async () => {
    if (!registrationNumber.trim()) {
      setForgotError('Please enter registration number first.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const response = await fetch(buildApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          role,
          registrationNumber: registrationNumber.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setForgotError(data.message || 'Unable to send OTP right now.');
        return;
      }

      setForgotSuccess(data.message || 'OTP sent successfully.');
      setOtpSent(true);
      setOtpVerified(false);
    } catch (err) {
      setForgotError('Network error while sending OTP. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!forgotOtp.trim()) {
      setForgotError('Please enter the OTP.');
      return;
    }

    if (!registrationNumber.trim()) {
      setForgotError('Registration number is required for OTP verification.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const response = await fetch(buildApiUrl('/api/auth/verify-otp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          role,
          registrationNumber: registrationNumber.trim(),
          otp: forgotOtp.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setForgotError(data.message || 'OTP verification failed.');
        return;
      }

      setOtpVerified(true);
      setForgotSuccess(data.message || 'OTP verified successfully.');
    } catch (err) {
      setForgotError('Network error while verifying OTP. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otpVerified) {
      setForgotError('Verify OTP first.');
      return;
    }

    if (!newPassword || !confirmNewPassword) {
      setForgotError('Enter new password and confirm it.');
      return;
    }

    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setForgotError('New password and confirm password do not match.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const response = await fetch(buildApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          role,
          registrationNumber: registrationNumber.trim(),
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setForgotError(data.message || 'Password reset failed.');
        return;
      }

      setPassword(newPassword);
      setForgotSuccess(data.message || 'Password reset successful.');
      setShowForgotPassword(false);
      setOtpSent(false);
      setOtpVerified(false);
      setForgotOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setForgotError('Network error while resetting password. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  if (!registrationNumber.trim()) {
    setError('Registration number is required.');
    return;
  }

  if (!password.trim()) {
    setError(role === 'parent' ? 'Parent phone number is required.' : 'Password is required.');
    return;
  }

  setLoading(true);

  try {

    // STUDENT LOGIN
    if (role === "student") {

      const response = await fetch(buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          registrationNumber,
          password,
          role
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      onLogin(data.user);
    }

    // PARENT LOGIN
    else if (role === "parent") {

      // Step 1: verify registration number
      const regResponse = await fetch(buildApiUrl('/api/auth/verify-registration'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          registrationNumber
        })
      });

      const regData = await regResponse.json();

      if (!regResponse.ok) {
        setError(regData.message || "Invalid registration number");
        setLoading(false);
        return;
      }

      // Step 2: verify phone (password field used as phone)
      const phoneResponse = await fetch(buildApiUrl('/api/auth/verify-phone'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phoneNumber: password
        })
      });

      const phoneData = await phoneResponse.json();

      if (!phoneResponse.ok) {
        setError(phoneData.message || "Invalid parent phone number");
        setLoading(false);
        return;
      }

      // parent login success
      onLogin(
        phoneData.user || {
          role: 'parent',
          firstName: phoneData.data?.parent?.name?.split(' ')[0] || 'Parent',
          lastName: phoneData.data?.parent?.name?.split(' ').slice(1).join(' ') || '',
          relationship: phoneData.data?.parent?.relationship,
          linkedStudent: phoneData.data?.student
            ? {
                firstName: phoneData.data.student.name?.split(' ')[0],
                lastName: phoneData.data.student.name?.split(' ').slice(1).join(' '),
                registrationNumber: phoneData.data.student.registrationNumber,
                department: phoneData.data.student.department,
                year: phoneData.data.student.year
              }
            : null
        }
      );

    }

  } catch (err) {
    setError("Network error. Please check your connection.");
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-6xl relative z-10"
      >
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block text-center lg:text-left"
          >
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold gradient-text">ProGO</h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Intelligent Student Assistant</p>
              </div>
            </div>

            <h2 className="text-4xl font-bold mb-4 text-slate-800 dark:text-white">
              Welcome to the Future of<br />Student Support
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Experience AI-powered assistance with 95% accuracy,<br />
              real-time insights, and 24/7 availability.
            </p>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 gap-4">
              {[
                { icon: Bot, title: 'AI-Powered', desc: 'Smart chatbot with ML predictions', color: 'from-blue-500 to-cyan-500' },
                { icon: TrendingUp, title: 'Performance Insights', desc: 'ML-driven academic predictions', color: 'from-purple-500 to-pink-500' },
                { icon: Clock, title: '24/7 Available', desc: 'Get answers anytime, anywhere', color: 'from-orange-500 to-red-500' }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="glass-effect rounded-2xl p-4 flex items-center gap-4 hover-glow group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-slate-800 dark:text-white">{feature.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold gradient-text">ProGO</h1>
            </div>

            <div className="glass-effect rounded-3xl p-8 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Welcome Back</h2>
                <p className="text-slate-600 dark:text-slate-400">Sign in to continue to your dashboard</p>
              </div>

              {/* Role Selection */}
              <div className="flex gap-3 mb-6">
                {[
                  { value: 'student', icon: UserCircle, label: 'Student' },
                  { value: 'parent', icon: Users, label: 'Parent' }
                ].map((roleOption) => (
                  <button
                    key={roleOption.value}
                    type="button"
                    onClick={() => setRole(roleOption.value)}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                      role === roleOption.value
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <roleOption.icon className="w-5 h-5" />
                    <span>{roleOption.label}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Registration Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Registration Number
                  </label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your registration number"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPasswordClick}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Forgot Password?
                  </button>
                </div>

                {showForgotPassword && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-900/20 space-y-3"
                  >
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      OTP will be sent to {forgotExampleContact} for this registration number.
                    </p>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={forgotLoading}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {forgotLoading ? 'Sending OTP...' : 'Send OTP'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setOtpSent(false);
                          setOtpVerified(false);
                          setForgotOtp('');
                        }}
                        className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Close
                      </button>
                    </div>

                    {otpSent && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value)}
                          placeholder="Enter OTP"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={forgotLoading || otpVerified}
                          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {otpVerified ? 'OTP Verified' : 'Verify OTP'}
                        </button>
                      </div>
                    )}

                    {otpVerified && role === 'student' && (
                      <div className="space-y-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <input
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleResetPassword}
                          disabled={forgotLoading}
                          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {forgotLoading ? 'Updating Password...' : 'Update Password'}
                        </button>
                      </div>
                    )}

                    {otpVerified && role === 'parent' && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        OTP verified. Parent flow currently uses phone verification for login.
                      </p>
                    )}

                    {forgotError && <p className="text-sm text-red-600 dark:text-red-400">{forgotError}</p>}
                    {forgotSuccess && <p className="text-sm text-green-600 dark:text-green-400">{forgotSuccess}</p>}
                  </motion.div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all ripple flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>

            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
