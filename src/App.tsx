import React, { useState } from 'react';
import { ActiveTab, Language, RecordingItem } from './types';
import { Header } from './components/Header';
import { AudioRecorderStudio } from './components/AudioRecorderStudio';
import { RecordingsList } from './components/RecordingsList';
import { ApkBuilderSection } from './components/ApkBuilderSection';
import { ApkGuideSection } from './components/ApkGuideSection';
import { exportProjectZip } from './data/androidProjectFiles';
import {
  Mic,
  Folder,
  Smartphone,
  BookOpen,
  Radio,
  Sparkles,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('apk_builder');
  const [language, setLanguage] = useState<Language>('bn');
  const [isRecordingLive, setIsRecordingLive] = useState<boolean>(false);

  // Sample recordings to get started
  const [recordings, setRecordings] = useState<RecordingItem[]>([
    {
      id: 'demo_1',
      title: 'UltraRecord_Demo_Studio_HQ',
      blob: new Blob([''], { type: 'audio/wav' }),
      url: 'https://cdn.freesound.org/previews/567/567634_5674468-lq.mp3',
      duration: 14,
      createdAt: Date.now() - 1000 * 60 * 30,
      size: 1024 * 320,
      format: 'wav',
      sampleRate: 48000,
      tags: ['HQ Studio', 'Demo', '48kHz'],
      notes: 'Sample high quality 48kHz audio demonstration',
    },
    {
      id: 'demo_2',
      title: 'Voice_Note_Meeting_Lecture',
      blob: new Blob([''], { type: 'audio/webm' }),
      url: 'https://cdn.freesound.org/previews/612/612610_11861866-lq.mp3',
      duration: 28,
      createdAt: Date.now() - 1000 * 60 * 120,
      size: 1024 * 640,
      format: 'webm',
      sampleRate: 44100,
      tags: ['Voice Memo', 'Meeting'],
      notes: 'Clean voice recording test',
    },
  ]);

  const handleSaveRecording = (newRecording: RecordingItem) => {
    setRecordings((prev) => [newRecording, ...prev]);
    setActiveTab('recordings');
  };

  const handleDeleteRecording = (id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRecording = (updated: RecordingItem) => {
    setRecordings((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleQuickDownloadZip = async () => {
    try {
      const zipBlob = await exportProjectZip({
        appName: 'UltraRecord HD',
        packageName: 'com.ultrarecord.app',
        versionName: '2.4.0',
        versionCode: 24,
        minSdk: 24,
        targetSdk: 35,
        enableBackgroundService: true,
        enableNoiseReduction: true,
        enableNotificationControls: true,
      });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'UltraRecord_Android_Project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
    }
  };

  const isBn = language === 'bn';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        isRecording={isRecordingLive}
        recordingCount={recordings.length}
      />

      {/* Main App Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 md:py-8">
        {activeTab === 'recorder' && (
          <AudioRecorderStudio
            language={language}
            onSaveRecording={handleSaveRecording}
            onSwitchToApkBuilder={() => setActiveTab('apk_builder')}
          />
        )}

        {activeTab === 'recordings' && (
          <RecordingsList
            recordings={recordings}
            language={language}
            onDeleteRecording={handleDeleteRecording}
            onUpdateRecording={handleUpdateRecording}
            onSwitchToRecorder={() => setActiveTab('recorder')}
          />
        )}

        {activeTab === 'apk_builder' && (
          <ApkBuilderSection
            language={language}
            onSwitchToGuides={() => setActiveTab('apk_guides')}
          />
        )}

        {activeTab === 'apk_guides' && (
          <ApkGuideSection
            language={language}
            onDownloadZip={handleQuickDownloadZip}
          />
        )}
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-8 px-4 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500" />
            <span className="font-semibold text-slate-400">UltraRecord Audio Studio & APK Hub</span>
            <span>•</span>
            <span>Jetpack Compose & Kotlin 2.0</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('apk_builder')}
              className="hover:text-slate-300 transition-colors"
            >
              {isBn ? 'APK প্যাকেজ' : 'APK Package'}
            </button>
            <button
              onClick={() => setActiveTab('apk_guides')}
              className="hover:text-slate-300 transition-colors"
            >
              {isBn ? 'টিউটোরিয়াল ও গাইড' : 'Build Guides'}
            </button>
            <button
              onClick={() => setActiveTab('recorder')}
              className="hover:text-slate-300 transition-colors"
            >
              {isBn ? 'রেকর্ডার' : 'Live Studio'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
