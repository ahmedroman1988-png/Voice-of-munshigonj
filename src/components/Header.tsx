import React from 'react';
import { Radio, Sparkles, Smartphone, Mic, Folder, BookOpen, Layers } from 'lucide-react';
import { ActiveTab, Language } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isRecording: boolean;
  recordingCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  isRecording,
  recordingCount,
}) => {
  const isBn = language === 'bn';

  return (
    <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 via-rose-500 to-indigo-500 p-0.5 shadow-lg shadow-sky-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
                </div>
              </div>
              {isRecording && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-slate-950"></span>
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg md:text-xl tracking-tight text-white flex items-center gap-1.5">
                  <span>Ultra</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-rose-400">Record</span>
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded-full">
                  Pro APK v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {isBn ? 'প্রফেশনাল ব্যাকগ্রাউন্ড অডিও রেকর্ডার ও APK স্টুডিও' : 'HD Background Audio Recorder & APK Studio'}
              </p>
            </div>
          </div>

          {/* Language toggle on mobile */}
          <div className="flex md:hidden items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setLanguage('bn')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                isBn ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              বাং
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                !isBn ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-2xl w-full md:w-auto overflow-x-auto">
          <button
            id="tab-recorder-btn"
            onClick={() => setActiveTab('recorder')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'recorder'
                ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>{isBn ? 'লাইভ রেকর্ডার' : 'Live Recorder'}</span>
            {isRecording && (
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
            )}
          </button>

          <button
            id="tab-recordings-btn"
            onClick={() => setActiveTab('recordings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'recordings'
                ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>{isBn ? 'রেকর্ডিংস' : 'Recordings'}</span>
            {recordingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-slate-800 text-sky-400 rounded-md text-[11px] font-bold">
                {recordingCount}
              </span>
            )}
          </button>

          <button
            id="tab-apk-builder-btn"
            onClick={() => setActiveTab('apk_builder')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'apk_builder'
                ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4 text-rose-400" />
            <span className="text-white font-bold">{isBn ? 'APK বিল্ডার ও কোড' : 'APK Builder & Code'}</span>
          </button>

          <button
            id="tab-apk-guide-btn"
            onClick={() => setActiveTab('apk_guides')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'apk_guides'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{isBn ? 'APK বানানোর গাইড' : 'APK Build Guide'}</span>
          </button>
        </nav>

        {/* Right side controls */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language Switch */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setLanguage('bn')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                isBn ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              বাংলা
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                !isBn ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              English
            </button>
          </div>

          {/* Quick APK action button */}
          <button
            onClick={() => setActiveTab('apk_builder')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white shadow-lg shadow-rose-500/20 transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isBn ? 'APK প্যাকেজ নিন' : 'Get APK Package'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
