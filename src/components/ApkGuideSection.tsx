import React, { useState } from 'react';
import {
  BookOpen,
  Cloud,
  Laptop,
  Smartphone,
  Globe,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Download,
} from 'lucide-react';
import { Language } from '../types';

interface ApkGuideSectionProps {
  language: Language;
  onDownloadZip: () => void;
}

export const ApkGuideSection: React.FC<ApkGuideSectionProps> = ({
  language,
  onDownloadZip,
}) => {
  const isBn = language === 'bn';
  const [activeMethod, setActiveMethod] = useState<'github' | 'studio' | 'termux' | 'pwa'>('github');
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <BookOpen className="w-5 h-5" />
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {isBn ? 'APK বানানোর পূর্ণাঙ্গ গাইড ও নিয়মাবলী' : 'Complete Step-by-Step APK Build Guide'}
              </h2>
            </div>
            <p className="text-xs md:text-sm text-slate-400">
              {isBn
                ? 'আপনার সুবিধা অনুযায়ী যেকোনো একটি পদ্ধতি বেছে নিয়ে সরাসরি ইনস্টলযোগ্য .apk ফাইল তৈরি করুন।'
                : 'Choose any of the 4 methods below to build and install your Android .apk file.'}
            </p>
          </div>

          <button
            onClick={onDownloadZip}
            className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs md:text-sm rounded-xl shadow-lg shadow-rose-500/25 transition-all flex items-center gap-2 self-start md:self-auto active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>{isBn ? 'প্রজেক্ট জিপ (.zip) ডাউনলোড' : 'Download Project .ZIP'}</span>
          </button>
        </div>

        {/* Method Selector Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <button
            onClick={() => setActiveMethod('github')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeMethod === 'github'
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-6 h-6 text-indigo-400 mb-2" />
            <div className="font-bold text-sm text-white">
              {isBn ? 'পদ্ধতি ১: GitHub Actions' : 'Method 1: GitHub Cloud'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {isBn ? 'পিসি ছাড়াই ফ্রি ক্লাউডে APK' : 'Zero PC needed • 100% Free'}
            </div>
          </button>

          <button
            onClick={() => setActiveMethod('studio')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeMethod === 'studio'
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-6 h-6 text-sky-400 mb-2" />
            <div className="font-bold text-sm text-white">
              {isBn ? 'পদ্ধতি ২: Android Studio' : 'Method 2: Android Studio'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {isBn ? 'অফিশিয়াল পিসি বিল্ড' : 'Official PC / Mac Builder'}
            </div>
          </button>

          <button
            onClick={() => setActiveMethod('termux')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeMethod === 'termux'
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-6 h-6 text-emerald-400 mb-2" />
            <div className="font-bold text-sm text-white">
              {isBn ? 'পদ্ধতি ৩: Termux Mobile' : 'Method 3: Termux Terminal'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {isBn ? 'মোবাইল দিয়ে সরাসরি বিল্ড' : 'Build inside Android phone'}
            </div>
          </button>

          <button
            onClick={() => setActiveMethod('pwa')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeMethod === 'pwa'
                ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-6 h-6 text-amber-400 mb-2" />
            <div className="font-bold text-sm text-white">
              {isBn ? 'পদ্ধতি ৪: WebAPK / PWA' : 'Method 4: WebAPK / PWA'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {isBn ? '১-ক্লিকে সরাসরি ইনস্টল' : 'Instant 1-tap install on phone'}
            </div>
          </button>
        </div>
      </div>

      {/* Guide Content Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl backdrop-blur-xl">
        {/* Method 1: GitHub Actions */}
        {activeMethod === 'github' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isBn
                    ? 'GitHub Actions দিয়ে কোনো কম্পিউটার ছাড়াই ফ্রি ক্লাউডে APK তৈরি (সবচেয়ে সহজ!)'
                    : 'Build APK in GitHub Free Cloud without any PC'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isBn
                    ? 'প্রজেক্টের ভিতরে থাকা .github/workflows/build-apk.yml ফাইলটি দিয়ে স্বয়ংক্রিয়ভাবে APK তৈরি হয়।'
                    : 'Uses GitHub automated workflow to compile Android Studio code in the cloud.'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="font-bold text-sm text-sky-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isBn ? 'ধাপ ১: প্রজেক্ট জিপ ফাইল ডাউনলোড করুন' : 'Step 1: Download Project ZIP'}</span>
                </div>
                <p className="text-xs text-slate-300">
                  {isBn
                    ? 'উপরে থাকা "প্রজেক্ট জিপ (.zip) ডাউনলোড" বাটনে ক্লিক করে ফাইলটি ডাউনলোড করুন এবং আনজিপ (Extract) করুন।'
                    : 'Click "Download Project .ZIP" and extract the folder on your device.'}
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="font-bold text-sm text-sky-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isBn ? 'ধাপ ২: GitHub এ নতুন রিপোজিটোরি তৈরি করুন' : 'Step 2: Create a GitHub Repository'}</span>
                </div>
                <p className="text-xs text-slate-300">
                  {isBn
                    ? 'github.com এ যান (ফ্রি একাউন্ট) এবং "New Repository" ক্লিক করে নাম দিন UltraRecord।'
                    : 'Go to github.com, click "New Repository" and name it UltraRecord.'}
                </p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="font-bold text-sm text-sky-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isBn ? 'ধাপ ৩: ফাইল আপলোড (Push) করুন' : 'Step 3: Upload files'}</span>
                </div>
                <p className="text-xs text-slate-300 mb-2">
                  {isBn
                    ? 'সমস্ত আনজিপ করা ফাইল ও ফোল্ডার (.github সহ) GitHub এ আপলোড করুন।'
                    : 'Push or drag-and-drop all extracted files to the GitHub repo.'}
                </p>
                <div className="relative bg-slate-900 rounded-xl p-3 font-mono text-xs text-slate-300">
                  <code>
                    git init<br />
                    git add .<br />
                    git commit -m "UltraRecord APK initial source"<br />
                    git push -u origin main
                  </code>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isBn ? 'ধাপ ৪: ১ মিনিট পর সরাসরি APK ডাউনলোড করুন!' : 'Step 4: Download compiled APK Artifact'}</span>
                </div>
                <p className="text-xs text-slate-300">
                  {isBn
                    ? 'GitHub এর "Actions" ট্যাবে যান। সেখানে "Build UltraRecord Android APK" সম্পূর্ণ সবুজ টিক হলে নিচের Artifacts সেকশনে "UltraRecord-Debug-APK.zip" পাবেন। ক্লিক করলেই আপনার ফোনে APK ডাউনলোড হয়ে যাবে!'
                    : 'Go to GitHub -> Actions -> "Build UltraRecord Android APK". When green, scroll to Artifacts and download your UltraRecord-Debug-APK.zip!'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Method 2: Android Studio */}
        {activeMethod === 'studio' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isBn ? 'Android Studio দিয়ে লোকাল পিসিতে APK বিল্ড' : 'Build via Android Studio on PC/Mac'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isBn
                    ? 'অফিশিয়াল গুগল অ্যান্ড্রয়েড স্টুডিও দিয়ে ১-ক্লিকে ডিবাগ বা রিলিজ APK বানান।'
                    : 'Standard Android development environment build workflow.'}
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-slate-300">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
                <span className="font-bold text-sky-400">১. ওপেন প্রজেক্ট (Open Project):</span>
                <p>Android Studio ওপেন করে <strong>File &gt; Open</strong> দিয়ে আনজিপ করা ফোল্ডারটি সিলেক্ট করুন।</p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
                <span className="font-bold text-sky-400">২. গ্রেডল সিঙ্ক (Gradle Sync):</span>
                <p>Android Studio স্বয়ংক্রিয়ভাবে Kotlin 2.0 ও Jetpack Compose লাইব্রেরি সিঙ্ক করে নেবে।</p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
                <span className="font-bold text-emerald-400">৩. APK বিল্ড করুন (Build APK):</span>
                <p>উপরের মেনুবার থেকে <strong>Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</strong> এ ক্লিক করুন।</p>
                <div className="p-2.5 bg-slate-900 rounded-xl font-mono text-xs text-slate-400">
                  APK Location: app/build/outputs/apk/debug/app-debug.apk
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Method 3: Termux */}
        {activeMethod === 'termux' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isBn ? 'Android মোবাইলে Termux দিয়ে সরাসরি APK বিল্ড' : 'Build inside Android phone using Termux'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isBn
                    ? 'কোনো কম্পিউটার ছাড়াই সরাসরি আপনার অ্যান্ড্রয়েড ফোনে টার্মিনাল দিয়ে APK তৈরি করুন।'
                    : 'Compile Kotlin & Android APK directly from Termux terminal.'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
                <span className="font-bold text-sm text-emerald-400">
                  {isBn ? 'Termux এ নিচের কমান্ডগুলো চালান:' : 'Run the following in Termux:'}
                </span>

                <div className="relative bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300">
                  <button
                    onClick={() =>
                      handleCopy(
                        'pkg update -y && pkg install openjdk-17 git -y\nchmod +x gradlew\n./gradlew assembleDebug',
                        1
                      )
                    }
                    className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1"
                  >
                    {copiedCodeIndex === 1 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <pre>
                    {`# ১. প্রয়োজনীয় টুলস ইনস্টল করুন:
pkg update -y && pkg install openjdk-17 -y

# ২. প্রজেক্ট ডিরেক্টরিতে গিয়ে পারমিশন দিন:
chmod +x gradlew

# ৩. APK বিল্ড কমান্ড রান করুন:
./gradlew assembleDebug`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Method 4: PWA / WebAPK */}
        {activeMethod === 'pwa' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isBn ? 'মোবাইলে ইনস্ট্যান্ট WebAPK / PWA ইনস্টল' : 'Instant WebAPK / PWA Installation'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isBn
                    ? 'Google Chrome ব্রাউজার থেকে সরাসরি আপনার হোম স্ক্রিনে ফুল-স্ক্রিন অ্যাপ হিসেবে ইনস্টল করুন।'
                    : 'Install directly to your Android home screen as a standalone app.'}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs md:text-sm text-slate-300">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="font-bold text-amber-400">১. ব্রাউজার মেনু ওপেন করুন:</span>
                <p>আপনার অ্যান্ড্রয়েড ফোনের Google Chrome ব্রাউজারের উপরের ডানদিকের ৩-ডট (⋮) মেনুতে চাপ দিন।</p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="font-bold text-amber-400">২. "Install App" বা "Add to Home screen" নির্বাচন করুন:</span>
                <p><strong>"Install UltraRecord"</strong> বা <strong>"Add to Home Screen"</strong> অপশনে চাপ দিন।</p>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="font-bold text-emerald-400">৩. সম্পন্ন!</span>
                <p>আপনার ফোনের অ্যাপ ড্রয়ারে এবং হোম স্ক্রিনে আল্ট্রা রেকর্ডার অ্যাপের লোগোসহ আইকন চলে আসবে।</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
