import React, { useState } from 'react';
import { Link2, LayoutDashboard, Database, FolderHeart, KeyRound, FileText, ChevronDown, User, Settings, CreditCard, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navigation({ activeTab, setActiveTab }) {
  const [profileOpen, setProfileOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'previews', label: 'Previews', icon: Database },
    { id: 'collections', label: 'Collections', icon: FolderHeart },
    { id: 'apikeys', label: 'API Keys', icon: KeyRound },
    { id: 'docs', label: 'Documentation', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Link2 className="h-5 w-5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 transition-opacity hover:opacity-100" />
          </div>
          <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-lg font-bold tracking-tight text-transparent">
            LinkPreview<span className="text-blue-500 font-extrabold">Pro</span>
          </span>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-pill"
                    className="absolute inset-0 bg-white/[0.04] border border-white/[0.06] rounded-lg"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Side: Profile Action */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-white/5 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-white/10 transition-all cursor-pointer"
          >
            <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
              JD
            </div>
            <span className="text-xs font-semibold text-zinc-300 hidden sm:inline">John Doe</span>
            <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <>
                {/* Click outside backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                
                {/* Dropdown Card */}
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-56 z-50 rounded-xl border border-white/10 bg-zinc-950 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
                >
                  {/* Account Header */}
                  <div className="px-3 py-2.5 mb-1.5 border-b border-white/5">
                    <p className="text-xs text-zinc-400">Signed in as</p>
                    <p className="text-sm font-semibold text-white truncate">john.doe@developer.com</p>
                  </div>

                  {/* Dropdown Items */}
                  <div className="space-y-0.5">
                    <button className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors">
                      <User className="h-3.5 w-3.5 text-zinc-400" />
                      <span>My Profile</span>
                    </button>
                    <button className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors">
                      <Settings className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Workspace Settings</span>
                    </button>
                    <button className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors">
                      <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Billing & Plans</span>
                    </button>
                  </div>

                  <div className="my-1.5 border-t border-white/5" />

                  {/* Log Out */}
                  <button className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors">
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Mobile Nav Subbar */}
      <div className="md:hidden flex items-center justify-around border-t border-white/5 py-2 bg-black/40 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-blue-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
