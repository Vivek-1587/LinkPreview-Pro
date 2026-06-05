// src/components/Profile.jsx - My Profile view
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, ArrowLeft, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile({ onBack }) {
  const { user } = useAuth();

  if (!user) return null;

  const creationDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Header back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Dashboard</span>
      </button>

      {/* Main Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card p-8 border border-white/10 relative overflow-hidden"
      >
        {/* Decorative subtle gradient */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-500/5 to-purple-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Large Avatar Card */}
          <div className="h-24 w-24 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg border border-white/10 relative shrink-0">
            {initials}
            <div className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border border-zinc-950" title="Active Account" />
          </div>

          {/* User Details */}
          <div className="flex-1 space-y-5 text-center md:text-left">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{user.name}</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Workspace Member</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-center md:justify-start gap-3 text-zinc-400">
                <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Email Address</p>
                  <p className="text-xs font-medium text-white truncate max-w-[200px]">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-3 text-zinc-400">
                <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Joined Workspace</p>
                  <p className="text-xs font-medium text-white">{creationDate}</p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900 border border-white/5 text-[10px] font-semibold text-zinc-400">
                <Shield className="h-3.5 w-3.5 text-blue-500" />
                <span>Default Group: Developer</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-900 border border-white/5 text-[10px] font-semibold text-zinc-400">
                <User className="h-3.5 w-3.5 text-purple-500" />
                <span>Workspace: Private</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
