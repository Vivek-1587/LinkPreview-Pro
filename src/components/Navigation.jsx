// src/components/Navigation.jsx - Dynamic Navbar
import React, { useState } from 'react';
import { Link2, LayoutDashboard, Database, FolderHeart, KeyRound, FileText, ChevronDown, User, Settings, LogOut, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Navigation({ currentPath }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  const handleNavClick = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { id: 'previews', label: 'Previews', icon: Database, path: '/previews' },
    { id: 'collections', label: 'Collections', icon: FolderHeart, path: '/collections' },
    { id: 'apikeys', label: 'API Keys', icon: KeyRound, path: '/settings/api-keys' },
    { id: 'docs', label: 'Documentation', icon: FileText, path: '/docs' },
  ];

  const initials = user && user.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => handleNavClick('/')}>
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
            // Highlight API Keys if path starts with settings/api-keys
            const isActive = currentPath === item.path || (item.id === 'apikeys' && currentPath === '/settings/api-keys');
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                className={`relative flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
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
          {isAuthenticated ? (
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-white/5 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-white/10 transition-all cursor-pointer"
            >
              <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                {initials}
              </div>
              <span className="text-xs font-semibold text-zinc-300 hidden sm:inline">{user.name}</span>
              <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-white/10 transition-all cursor-pointer"
            >
              <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                <User className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-semibold text-zinc-400 hidden sm:inline">Not signed in</span>
              <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
            </button>
          )}

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
                  {isAuthenticated ? (
                    <>
                      {/* Account Header */}
                      <div className="px-3 py-2.5 mb-1.5 border-b border-white/5">
                        <p className="text-xs text-zinc-400">Signed in as</p>
                        <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                      </div>

                      {/* Dropdown Items */}
                      <div className="space-y-0.5">
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            handleNavClick('/profile');
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer"
                        >
                          <User className="h-3.5 w-3.5 text-zinc-400" />
                          <span>My Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            handleNavClick('/settings');
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-zinc-300 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer"
                        >
                          <Settings className="h-3.5 w-3.5 text-zinc-400" />
                          <span>Workspace Settings</span>
                        </button>
                      </div>

                      <div className="my-1.5 border-t border-white/5" />

                      {/* Log Out */}
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <div className="p-3 text-center space-y-3">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <ShieldAlert className="h-6 w-6 text-zinc-600" />
                        <span className="text-xs font-medium text-zinc-400">Not signed in</span>
                      </div>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          handleNavClick('/');
                        }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-[0_4px_10px_rgba(59,130,246,0.2)] cursor-pointer"
                      >
                        Login / Sign In
                      </button>
                    </div>
                  )}
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
          const isActive = currentPath === item.path || (item.id === 'apikeys' && currentPath === '/settings/api-keys');
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
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
