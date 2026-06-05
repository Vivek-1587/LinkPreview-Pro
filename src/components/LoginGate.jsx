// src/components/LoginGate.jsx - Glassmorphic Auth Gate for LinkPreview Pro
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Link2, ShieldCheck, Mail, Lock, User, AlertCircle, Sparkles, Key, ArrowLeft, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginGate() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  // Steps: 1 = Enter Email, 2 = Enter OTP, 3 = Enter New Password
  const [resetStep, setResetStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { login, register } = useAuth();

  const resetForgotState = () => {
    setShowForgot(false);
    setResetStep(1);
    setOtp('');
    setNewPassword('');
    setError('');
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (resetStep === 1) {
        // Step 1: Request OTP — backend generates and logs OTP
        await api.auth.requestPasswordReset(email);
        setResetStep(2);
      } else if (resetStep === 2) {
        // Step 2: Verify OTP against database
        await api.auth.verifyResetToken(email, otp);
        setResetStep(3);
      } else {
        // Step 3: Reset password (OTP re-validated server-side)
        await api.auth.resetPassword(email, otp, newPassword);
        resetForgotState();
        setSuccessMessage('Your password has been updated successfully. Please sign in with your new password.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new Event('popstate'));
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = {
    1: { title: 'Reset Password', subtitle: 'Enter your email to receive an OTP' },
    2: { title: 'Verify OTP',     subtitle: `Check your email for the 6-digit code` },
    3: { title: 'New Password',   subtitle: 'Choose a strong new password' },
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="relative w-full max-w-md">
        {/* Decorative background glow rings */}
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Central Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="premium-card p-8 backdrop-blur-xl border border-white/10 relative overflow-hidden"
        >
          {/* Logo & Brand */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 shadow-[0_0_20px_rgba(59,130,246,0.4)] mb-4">
              <Link2 className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              LinkPreview<span className="text-blue-500">Pro</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Premium Developer Metadata Extraction Console</p>
          </div>

          {/* Toggle Tabs (only for login/register, not forgot) */}
          {!showForgot && (
            <div className="flex border-b border-white/5 mb-6">
              <button
                onClick={() => { setIsLogin(true); setError(''); setSuccessMessage(''); }}
                className={`flex-1 pb-3 text-sm font-semibold transition-all relative ${
                  isLogin ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Sign In
                {isLogin && (
                  <motion.div
                    layoutId="auth-tab-bar"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                  />
                )}
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(''); setSuccessMessage(''); }}
                className={`flex-1 pb-3 text-sm font-semibold transition-all relative ${
                  !isLogin ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Create Account
                {!isLogin && (
                  <motion.div
                    layoutId="auth-tab-bar"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                  />
                )}
              </button>
            </div>
          )}

          {/* Forgot Password Header */}
          {showForgot && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              {/* Step indicator */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={resetStep === 1 ? resetForgotState : () => { setResetStep(s => s - 1); setError(''); }}
                  className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" />
                  {resetStep === 1 ? 'Back to Sign In' : 'Back'}
                </button>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map(s => (
                    <div
                      key={s}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        s === resetStep ? 'w-6 bg-blue-500' : s < resetStep ? 'w-3 bg-blue-500/50' : 'w-3 bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <h3 className="text-base font-bold text-white">{stepTitles[resetStep].title}</h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                {resetStep === 2
                  ? `Check your email (${email}) for the 6-digit code`
                  : stepTitles[resetStep].subtitle}
              </p>
            </motion.div>
          )}

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Alert */}
          {successMessage && !showForgot && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-start gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs"
            >
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {/* ---- FORGOT PASSWORD FLOW ---- */}
          {showForgot ? (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {resetStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-1.5"
                  >
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane.doe@developer.com"
                        className="w-full text-xs bg-zinc-950/60 border border-white/5 hover:border-white/10 focus:border-blue-500 focus:bg-zinc-950 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 outline-none transition-all"
                      />
                    </div>
                  </motion.div>
                )}

                {resetStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-1.5"
                  >
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">6-Digit OTP</label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <input
                        type="text"
                        required
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full text-xs bg-zinc-950/60 border border-white/5 hover:border-white/10 focus:border-blue-500 focus:bg-zinc-950 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 outline-none transition-all tracking-[0.3em] font-mono"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 pt-1">
                      OTP is printed in the server console (development mode). It expires in 15 minutes.
                    </p>
                  </motion.div>
                )}

                {resetStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-1.5"
                  >
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full text-xs bg-zinc-950/60 border border-white/5 hover:border-white/10 focus:border-blue-500 focus:bg-zinc-950 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 outline-none transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 pt-1">Minimum 8 characters.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all shadow-[0_4px_15px_rgba(59,130,246,0.3)] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>
                      {resetStep === 1 ? 'Send OTP' : resetStep === 2 ? 'Verify OTP' : 'Set New Password'}
                    </span>
                  </>
                )}
              </button>
            </form>

          ) : (
          /* ---- LOGIN / REGISTER FLOW ---- */
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full text-xs bg-zinc-950/60 border border-white/5 hover:border-white/10 focus:border-blue-500 focus:bg-zinc-950 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane.doe@developer.com"
                  className="w-full text-xs bg-zinc-950/60 border border-white/5 hover:border-white/10 focus:border-blue-500 focus:bg-zinc-950 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full text-xs bg-zinc-950/60 border border-white/5 hover:border-white/10 focus:border-blue-500 focus:bg-zinc-950 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-600 outline-none transition-all"
                />
              </div>
              {isLogin && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgot(true);
                      setError('');
                      setResetStep(1);
                      setOtp('');
                      setNewPassword('');
                      setSuccessMessage('');
                    }}
                    className="text-[10px] text-zinc-400 hover:text-blue-400 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-all shadow-[0_4px_15px_rgba(59,130,246,0.3)] disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>{isLogin ? 'Sign In Workspace' : 'Create Workspace Account'}</span>
                </>
              )}
            </button>
          </form>
          )}

          {/* Secure footnote */}
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 font-medium">
            <Key className="h-3 w-3 text-zinc-600" />
            <span>SQLite Database Secured Local Auth</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
