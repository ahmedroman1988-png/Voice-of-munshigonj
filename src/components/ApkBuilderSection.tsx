import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Copy,
  Check,
  Terminal,
  Settings,
  Code2,
  FileCode,
  Sparkles,
  Zap,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { ApkProjectConfig, Language } from '../types';
import {
  exportProjectZip,
  getMainActivityKt,
  getAudioRecordServiceKt,
  getAndroidManifestXml,
  getAppBuildGradle,
  getGithubWorkflowYaml,
  getReadmeMarkdown,
} from '../data/androidProjectFiles';
import confetti from 'canvas-confetti';

interface ApkBuilderSectionProps {
  language: Language;
  onSwitchToGuides: () => void;
}

export const ApkBuilderSection: React.FC<ApkBuilderSectionProps> = ({
  language,
  onSwitchToGuides,
}) => {
  const isBn = language === 'bn';

  // Config State
  const [config, setConfig] = useState<ApkProjectConfig>({
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

  const [activeFileTab, setActiveFileTab] = useState<
    'main_activity' | 'service' | 'manifest' | 'gradle' | 'github_actions'
  >('main_activity');

  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [buildSimulationStep, setBuildSimulationStep] = useState<number>(0);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [isSimulatingBuild, setIsSimulatingBuild] = useState<boolean>(false);

  // File content mapping
  const getFileContent = () => {
    switch (activeFileTab) {
      case 'main_activity':
        return { name: 'MainActivity.kt', code: getMainActivityKt(config), lang: 'kotlin' };
      case 'service':
        return { name: 'AudioRecordService.kt', code: getAudioRecordServiceKt(config), lang: 'kotlin' };
      case 'manifest':
        return { name: 'AndroidManifest.xml', code: getAndroidManifestXml(config), lang: 'xml' };
      case 'gradle':
        return { name: 'app/build.gradle.kts', code: getAppBuildGradle(config), lang: 'kotlin' };
      case 'github_actions':
        return { name: '.github/workflows/build-apk.yml', code: getGithubWorkflowYaml(config), lang: 'yaml' };
      default:
        return { name: 'MainActivity.kt', code: getMainActivityKt(config), lang: 'kotlin' };
    }
  };

  const handleCopyCode = () => {
    const { code } = getFileContent();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadProjectZip = async () => {
    setIsZipping(true);
    try {
      const zipBlob = await exportProjectZip(config);
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${config.appName.replace(/\s+/g, '_')}_Android_Source_Project.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F43F5E', '#38BDF8', '#818CF8', '#10B981'],
      });
    } catch (err) {
      console.error('ZIP generation error:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleRunBuildSimulation = () => {
    setIsSimulatingBuild(true);
    setBuildSimulationStep(1);
    setBuildLogs([
      `> Starting Gradle Daemon...`,
      `> Configuring project :app with Target SDK ${config.targetSdk}`,
      `> Package: ${config.packageName} (v${config.versionName})`,
    ]);

    const steps = [
      { step: 2, log: `> Task :app:preBuild UP-TO-DATE\n> Task :app:preDebugBuild UP-TO-DATE` },
      { step: 3, log: `> Task :app:compileDebugKotlin [MainActivity.kt, AudioRecordService.kt]` },
      { step: 4, log: `> Task :app:processDebugResources [Merging AndroidManifest.xml & Drawables]` },
      { step: 5, log: `> Task :app:mergeDebugNativeLibs [Extracting Audio Codecs]` },
      { step: 6, log: `> Task :app:packageDebug [Generating ${config.appName.replace(/\s+/g, '_')}-debug.apk]` },
      {
        step: 7,
        log: `BUILD SUCCESSFUL in 9s\n24 actionable tasks: 24 executed\n\nOUTPUT: app/build/outputs/apk/debug/${config.appName.replace(/\s+/g, '_')}-debug.apk`,
      },
    ];

    steps.forEach((s, idx) => {
      setTimeout(() => {
        setBuildSimulationStep(s.step);
        setBuildLogs((prev) => [...prev, s.log]);
        if (idx === steps.length - 1) {
          setIsSimulatingBuild(false);
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.65 },
          });
        }
      }, (idx + 1) * 1100);
    });
  };

  const currentFile = getFileContent();

  return (
    <div className="space-y-6">
      {/* Top Banner: APK Generator Title Card */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-indigo-950/60 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
                <Smartphone className="w-5 h-5" />
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {isBn ? 'অ্যান্ড্রয়েড APK বিল্ডার ও প্রজেক্ট হাব' : 'Android APK Builder & Project Hub'}
              </h2>
            </div>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              {isBn
                ? 'আপনার প্রয়োজন অনুযায়ী সম্পূর্ণ Android Studio Kotlin প্রজেক্ট জেনারেট করুন। সরাসরি জিপ (.zip) ডাউনলোড করে GitHub Actions বা Android Studio দিয়ে নিমিষেই APK বিল্ড করুন।'
                : 'Generate a complete, ready-to-build Android Studio Kotlin project. Download as .ZIP and compile via GitHub Actions or Android Studio in minutes.'}
            </p>
          </div>

          {/* 1-Click Project Zip Download */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <button
              id="download-project-zip-btn"
              onClick={handleDownloadProjectZip}
              disabled={isZipping}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-rose-500 via-rose-600 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl shadow-xl shadow-rose-500/30 transition-all flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              <span>
                {isZipping
                  ? isBn
                    ? 'জিপ তৈরি হচ্ছে...'
                    : 'Packing ZIP...'
                  : isBn
                  ? 'সম্পূর্ণ অ্যান্ড্রয়েড প্রজেক্ট ডাউনলোড (.ZIP)'
                  : 'Download Complete Project (.ZIP)'}
              </span>
            </button>

            <button
              onClick={onSwitchToGuides}
              className="w-full sm:w-auto px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-2xl border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <span>{isBn ? 'বিল্ড গাইড দেখুন' : 'View Build Guide'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Configurator + Live Build Terminal Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Project Configuration (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-sky-400" />
              <span>{isBn ? 'প্রজেক্ট কনফিগারেশন' : 'Project Configuration'}</span>
            </h3>
            <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
              Android 15 Ready
            </span>
          </div>

          <div className="space-y-4 text-xs md:text-sm">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isBn ? 'অ্যাপের নাম (App Name)' : 'App Name'}
              </label>
              <input
                type="text"
                value={config.appName}
                onChange={(e) => setConfig({ ...config, appName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isBn ? 'প্যাকেজ আইডি (Package Name)' : 'Package Name'}
              </label>
              <input
                type="text"
                value={config.packageName}
                onChange={(e) => setConfig({ ...config, packageName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Version Name</label>
                <input
                  type="text"
                  value={config.versionName}
                  onChange={(e) => setConfig({ ...config, versionName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Version Code</label>
                <input
                  type="number"
                  value={config.versionCode}
                  onChange={(e) => setConfig({ ...config, versionCode: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Min SDK</label>
                <input
                  type="number"
                  value={config.minSdk}
                  onChange={(e) => setConfig({ ...config, minSdk: parseInt(e.target.value) || 24 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target SDK</label>
                <input
                  type="number"
                  value={config.targetSdk}
                  onChange={(e) => setConfig({ ...config, targetSdk: parseInt(e.target.value) || 35 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Feature Flags */}
            <div className="pt-2 space-y-2.5">
              <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-200 font-medium">
                  {isBn ? 'ব্যাকগ্রাউন্ড অডিও সার্ভিস (Foreground Service)' : 'Foreground Audio Service'}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-200 font-medium">
                  {isBn ? 'লকস্ক্রিন নোটিফিকেশন কন্ট্রোল' : 'Notification Controls'}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-200 font-medium">
                  {isBn ? 'GitHub Actions অটো APK বিল্ডার ফাইল' : 'GitHub Actions CI Auto Builder'}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Build Terminal & Simulator (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-rose-400" />
                <h3 className="font-bold text-base text-white">
                  {isBn ? 'লাইভ APK কম্পাইলার সিমুলেটর' : 'Live APK Compiler Simulator'}
                </h3>
              </div>

              <button
                id="run-build-sim-btn"
                onClick={handleRunBuildSimulation}
                disabled={isSimulatingBuild}
                className="px-3.5 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-40"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>{isSimulatingBuild ? (isBn ? 'কম্পাইল হচ্ছে...' : 'Building...') : (isBn ? 'কম্পাইল টেস্ট চালান' : 'Run Compile Test')}</span>
              </button>
            </div>

            {/* Terminal Window Box */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800/90 p-4 font-mono text-xs text-slate-300 h-64 overflow-y-auto space-y-2 shadow-inner">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-800 text-slate-500 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2">gradlew assembleDebug — Android Studio Gradle 8.9</span>
              </div>

              {buildLogs.length === 0 ? (
                <div className="text-slate-500 italic py-6 text-center">
                  {isBn
                    ? 'উপরের "কম্পাইল টেস্ট চালান" বাটনে ক্লিক করে স্বয়ংক্রিয় Gradle বিল্ড প্রসেস দেখুন।'
                    : 'Click "Run Compile Test" to simulate the automated Gradle APK compilation.'}
                </div>
              ) : (
                <div className="space-y-1">
                  {buildLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`whitespace-pre-wrap ${
                        log.includes('BUILD SUCCESSFUL')
                          ? 'text-emerald-400 font-bold bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/30'
                          : log.includes('Task')
                          ? 'text-sky-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                  {isSimulatingBuild && (
                    <div className="flex items-center gap-2 text-rose-400 animate-pulse pt-2">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      <span>{isBn ? 'প্যাকেজ তৈরি হচ্ছে...' : 'Assembling APK binaries...'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick info footer */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              {isBn ? 'কোনো ম্যালওয়্যার নেই • নিরাপদ ওপেন সোর্স' : '100% Clean Open-Source Kotlin'}
            </span>
            <span className="font-mono text-slate-500">ARM64 + x86_64 Support</span>
          </div>
        </div>
      </div>

      {/* Code Inspector Tabs & Raw Viewer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-white">
              {isBn ? 'সোর্স কোড ইনস্পেক্টর (Source Code Inspector)' : 'Source Code Inspector'}
            </h3>
          </div>

          {/* File selection pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveFileTab('main_activity')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeFileTab === 'main_activity'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MainActivity.kt
            </button>
            <button
              onClick={() => setActiveFileTab('service')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeFileTab === 'service'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              AudioRecordService.kt
            </button>
            <button
              onClick={() => setActiveFileTab('manifest')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeFileTab === 'manifest'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              AndroidManifest.xml
            </button>
            <button
              onClick={() => setActiveFileTab('gradle')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeFileTab === 'gradle'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              build.gradle.kts
            </button>
            <button
              onClick={() => setActiveFileTab('github_actions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeFileTab === 'github_actions'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              build-apk.yml (CI)
            </button>
          </div>
        </div>

        {/* Code Box */}
        <div className="relative">
          <div className="flex items-center justify-between bg-slate-950 px-4 py-2.5 rounded-t-2xl border-t border-x border-slate-800 text-xs text-slate-400">
            <span className="font-mono text-sky-400">{currentFile.name}</span>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{isBn ? 'কপি হয়েছে' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isBn ? 'কোড কপি করুন' : 'Copy Code'}</span>
                </>
              )}
            </button>
          </div>

          <pre className="bg-slate-950/95 border border-slate-800 rounded-b-2xl p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-96 leading-relaxed">
            <code>{currentFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
