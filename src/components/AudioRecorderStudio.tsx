import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Square,
  Pause,
  Play,
  Bookmark,
  Sliders,
  Sparkles,
  Volume2,
  CheckCircle2,
  Bell,
  HardDrive,
  ShieldCheck,
  Zap,
  Info,
  Radio,
} from 'lucide-react';
import { AudioSettings, Language, RecordingItem } from '../types';
import { encodeWAV, formatSeconds, formatShortTime } from '../utils/audioEncoder';
import confetti from 'canvas-confetti';

interface AudioRecorderStudioProps {
  language: Language;
  onSaveRecording: (recording: RecordingItem) => void;
  onSwitchToApkBuilder: () => void;
}

export const AudioRecorderStudio: React.FC<AudioRecorderStudioProps> = ({
  language,
  onSaveRecording,
  onSwitchToApkBuilder,
}) => {
  const isBn = language === 'bn';

  // Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [markers, setMarkers] = useState<number[]>([]);
  const [dbLevel, setDbLevel] = useState<number>(-60);
  const [peakLevel, setPeakLevel] = useState<number>(-60);
  const [activeVisualizer, setActiveVisualizer] = useState<'wave' | 'frequency' | 'circular'>('wave');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [isBackgroundSimActive, setIsBackgroundSimActive] = useState<boolean>(true);

  // Audio Settings
  const [settings, setSettings] = useState<AudioSettings>({
    format: 'wav',
    sampleRate: 48000,
    bitDepth: 24,
    channels: 1,
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
    gain: 1.0,
  });

  // Audio API Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pcmSamplesRef = useRef<Float32Array[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, []);

  const stopRecordingCleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
  };

  // Start Recording
  const handleStartRecording = async () => {
    setPermissionError(null);
    audioChunksRef.current = [];
    pcmSamplesRef.current = [];
    setMarkers([]);
    setRecordingDuration(0);

    try {
      // Request mic stream with enhanced constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
          autoGainControl: settings.autoGainControl,
          sampleRate: settings.sampleRate,
        },
      });
      streamRef.current = stream;

      // Setup Web Audio Context for visualizer & analysis
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: settings.sampleRate });
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      const gainNode = audioCtx.createGain();
      gainNode.gain.value = settings.gain;
      gainNodeRef.current = gainNode;

      source.connect(gainNode);
      gainNode.connect(analyser);

      // Setup ScriptProcessor / AudioWorklet for raw PCM capturing (lossless WAV)
      const bufferSize = 4096;
      const scriptProcessor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
      scriptProcessor.onaudioprocess = (e) => {
        if (!isRecording || isPaused) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const clone = new Float32Array(inputData.length);
        clone.set(inputData);
        pcmSamplesRef.current.push(clone);
      };
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(audioCtx.destination);

      // Setup standard MediaRecorder fallback/format handling
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        finalizeRecording();
      };

      mediaRecorder.start(200); // 200ms slice
      setIsRecording(true);
      setIsPaused(false);

      // Start duration counter
      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 0.1);
      }, 100);

      // Start Visualizer render loop
      renderVisualizer();
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setPermissionError(
        isBn
          ? 'মাইক্রোফোনের পারমিশন পাওয়া যায়নি। ব্রাউজারের সেটিংসে গিয়ে পারমিশন Allow করুন।'
          : 'Microphone permission denied. Please allow microphone access in your browser.'
      );
    }
  };

  // Pause / Resume
  const handleTogglePause = () => {
    if (!isRecording) return;
    if (isPaused) {
      mediaRecorderRef.current?.resume();
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      setIsPaused(false);
    } else {
      mediaRecorderRef.current?.pause();
      if (audioContextRef.current?.state === 'running') {
        audioContextRef.current.suspend();
      }
      setIsPaused(true);
    }
  };

  // Stop Recording
  const handleStopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);
    setIsPaused(false);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      finalizeRecording();
    }
  };

  // Add Marker
  const handleAddMarker = () => {
    if (!isRecording) return;
    const currentSecond = Math.round(recordingDuration * 10) / 10;
    setMarkers((prev) => [...prev, currentSecond]);
  };

  // Finalize & Create File
  const finalizeRecording = () => {
    stopRecordingCleanup();

    let finalBlob: Blob;
    let finalFormat: 'wav' | 'webm' | 'mp3' = settings.format;

    if (pcmSamplesRef.current.length > 0 && settings.format === 'wav') {
      // Merge Float32Array PCM chunks into 1 buffer
      let totalLength = 0;
      for (const chunk of pcmSamplesRef.current) {
        totalLength += chunk.length;
      }
      const fullPcm = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of pcmSamplesRef.current) {
        fullPcm.set(chunk, offset);
        offset += chunk.length;
      }
      finalBlob = encodeWAV(fullPcm, settings.sampleRate, 1);
    } else if (audioChunksRef.current.length > 0) {
      finalBlob = new Blob(audioChunksRef.current, { type: audioChunksRef.current[0].type || 'audio/webm' });
    } else {
      // Fallback empty wav
      finalBlob = encodeWAV(new Float32Array(48000), 48000, 1);
    }

    const newRecording: RecordingItem = {
      id: 'rec_' + Date.now(),
      title: `UltraRecord_${new Date().toISOString().slice(0, 10)}_${formatShortTime(recordingDuration).replace(':', 'm')}s`,
      blob: finalBlob,
      url: URL.createObjectURL(finalBlob),
      duration: Math.max(1, Math.round(recordingDuration)),
      createdAt: Date.now(),
      size: finalBlob.size,
      format: finalFormat,
      sampleRate: settings.sampleRate,
      tags: ['HD Audio', 'Voice Memo'],
      markers: markers,
    };

    onSaveRecording(newRecording);

    // Trigger celebration effect
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#38BDF8', '#F43F5E', '#10B981'],
    });
  };

  // Canvas Waveform Animation Loop
  const renderVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const timeDataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);
      analyser.getByteTimeDomainData(timeDataArray);

      // Calculate instantaneous dB Level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const val = (timeDataArray[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / bufferLength);
      const db = 20 * Math.log10(Math.max(rms, 0.0001));
      setDbLevel(Math.round(db));
      setPeakLevel((prev) => Math.max(prev - 0.5, Math.round(db)));

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Visualizer Mode 1: Frequency Bars
      if (activeVisualizer === 'frequency') {
        const barCount = 48;
        const barWidth = width / barCount - 2;
        const step = Math.floor(bufferLength / barCount);

        for (let i = 0; i < barCount; i++) {
          const value = dataArray[i * step];
          const percent = value / 255;
          const barHeight = Math.max(4, percent * height * 0.85);

          const x = i * (barWidth + 2);
          const y = height - barHeight;

          // Gradient color from Cyan to Rose
          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, '#0284c7');
          gradient.addColorStop(0.5, '#38bdf8');
          gradient.addColorStop(1, '#f43f5e');

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
          ctx.fill();
        }
      }
      // Visualizer Mode 2: Oscilloscope Waveform (Default)
      else if (activeVisualizer === 'wave') {
        ctx.lineWidth = 3;
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#38bdf8');
        gradient.addColorStop(0.5, '#f43f5e');
        gradient.addColorStop(1, '#a855f7');

        ctx.strokeStyle = gradient;
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeDataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Add subtle center baseline
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }
      // Visualizer Mode 3: Circular Pulse
      else {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) * 0.55;

        let totalEnergy = 0;
        for (let i = 0; i < 32; i++) {
          totalEnergy += dataArray[i];
        }
        const avgEnergy = totalEnergy / 32;
        const pulseRadius = radius + (avgEnergy / 255) * 28;

        // Glowing outer pulse
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Inner circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    draw();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: APK Quick Generator Notice */}
      <div className="bg-gradient-to-r from-rose-950/50 via-slate-900 to-indigo-950/50 border border-rose-500/30 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-500/30">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base md:text-lg">
                {isBn ? 'অ্যান্ড্রয়েড UltraRecord APK প্রজেক্ট প্রস্তুত' : 'Android UltraRecord APK Project Ready'}
              </span>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                {isBn ? 'রেডি টু বিল্ড' : 'Ready to Build'}
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-300">
              {isBn
                ? 'স্ক্রিন অফ/ব্যাকগ্রাউন্ডে অডিও রেকর্ড করতে সম্পূর্ণ Android Kotlin সোর্স কোড ও ১-ক্লিক APK বিল্ড প্রজেক্ট ডাউনলোড করুন।'
                : 'Download complete Android Kotlin source code & 1-click APK build package for background screen-off recording.'}
            </p>
          </div>
        </div>

        <button
          onClick={onSwitchToApkBuilder}
          className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-xs md:text-sm font-bold rounded-xl shadow-lg shadow-rose-500/25 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
        >
          <Zap className="w-4 h-4" />
          <span>{isBn ? 'APK বিল্ডারে যান' : 'Open APK Builder'}</span>
        </button>
      </div>

      {/* Permission Error notification */}
      {permissionError && (
        <div className="bg-rose-950/80 border border-rose-500/50 rounded-xl p-4 text-rose-200 text-sm flex items-center gap-3">
          <Info className="w-5 h-5 text-rose-400 shrink-0" />
          <p>{permissionError}</p>
        </div>
      )}

      {/* Main Studio Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Main Recorder Card (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Ambient Studio Lighting Glow */}
          <div
            className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
              isRecording
                ? isPaused
                  ? 'bg-amber-500/10'
                  : 'bg-rose-500/15'
                : 'bg-sky-500/10'
            }`}
          />

          {/* Top Deck Info */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-5">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-3 h-3 rounded-full ${
                  isRecording
                    ? isPaused
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-rose-500 animate-ping'
                    : 'bg-slate-600'
                }`}
              />
              <span className="font-bold text-sm tracking-wide text-white uppercase">
                {isRecording
                  ? isPaused
                    ? isBn
                      ? 'রেকর্ডিং সাময়িক স্থগিত'
                      : 'RECORDING PAUSED'
                    : isBn
                    ? 'লাইভ রেকর্ডিং চলছে'
                    : 'RECORDING LIVE'
                  : isBn
                  ? 'রেকর্ডিং স্টুডিও রেডি'
                  : 'STUDIO READY'}
              </span>
              <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                {settings.format.toUpperCase()} • {settings.sampleRate / 1000} kHz • {settings.bitDepth}-bit
              </span>
            </div>

            {/* Visualizer Type Switcher */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveVisualizer('wave')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activeVisualizer === 'wave'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Wave
              </button>
              <button
                onClick={() => setActiveVisualizer('frequency')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activeVisualizer === 'frequency'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Spectrum
              </button>
              <button
                onClick={() => setActiveVisualizer('circular')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  activeVisualizer === 'circular'
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pulse
              </button>
            </div>
          </div>

          {/* Large Digital Timer & Decibel Readout */}
          <div className="my-8 text-center flex flex-col items-center">
            <div className="font-mono text-5xl md:text-7xl font-extrabold tracking-wider text-white select-none">
              {formatSeconds(recordingDuration)}
            </div>

            {/* Audio dB Level Meter Bar */}
            <div className="mt-5 w-full max-w-md bg-slate-950/90 border border-slate-800 p-3 rounded-2xl">
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                <span>INPUT LEVEL: {dbLevel} dB</span>
                <span>PEAK: {peakLevel} dB</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-sky-400 to-rose-500 rounded-full transition-all duration-75"
                  style={{
                    width: `${Math.min(100, Math.max(4, (dbLevel + 60) * 1.66))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Interactive Waveform Canvas */}
          <div className="relative w-full h-36 md:h-44 bg-slate-950/90 border border-slate-800/90 rounded-2xl overflow-hidden p-2 flex items-center justify-center shadow-inner">
            <canvas
              ref={canvasRef}
              width={700}
              height={180}
              className="w-full h-full object-cover"
            />
            {!isRecording && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-[2px]">
                <Mic className="w-8 h-8 text-sky-400 mb-2 opacity-80" />
                <p className="text-xs md:text-sm font-medium text-slate-300">
                  {isBn
                    ? 'রেকর্ডিং শুরু করতে নিচের লাল বাটনে ট্যাপ করুন'
                    : 'Tap the record button below to start HD recording'}
                </p>
              </div>
            )}

            {/* Render Markers on Timeline if added */}
            {markers.length > 0 && (
              <div className="absolute bottom-2 left-3 right-3 flex items-center gap-1.5 overflow-x-auto py-1">
                {markers.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-md flex items-center gap-1"
                  >
                    <Bookmark className="w-2.5 h-2.5" />
                    {formatShortTime(m)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Main Control Panel (Mic, Pause, Stop, Marker) */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between gap-4">
            {/* Add Marker Button */}
            <button
              onClick={handleAddMarker}
              disabled={!isRecording}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-xs md:text-sm font-semibold border transition-all ${
                isRecording
                  ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white active:scale-95'
                  : 'bg-slate-900/40 text-slate-600 border-slate-800/40 cursor-not-allowed'
              }`}
            >
              <Bookmark className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">{isBn ? 'চিহ্ন যোগ করুন' : 'Add Marker'}</span>
            </button>

            {/* Center Record / Stop Main Button */}
            <div className="flex items-center gap-4">
              {!isRecording ? (
                <button
                  id="start-record-btn"
                  onClick={handleStartRecording}
                  className="relative group flex items-center justify-center w-20 h-20 rounded-full bg-rose-500/20 hover:bg-rose-500/30 transition-all active:scale-95"
                >
                  <span className="absolute inset-0 rounded-full animate-pulse-ring pointer-events-none" />
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 to-rose-500 shadow-xl shadow-rose-500/40 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                    <Mic className="w-8 h-8" />
                  </div>
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  {/* Pause / Resume Button */}
                  <button
                    id="pause-record-btn"
                    onClick={handleTogglePause}
                    className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-700 shadow-md transition-all active:scale-95"
                  >
                    {isPaused ? (
                      <Play className="w-6 h-6 text-emerald-400 fill-emerald-400" />
                    ) : (
                      <Pause className="w-6 h-6 text-amber-400" />
                    )}
                  </button>

                  {/* Stop & Save Button */}
                  <button
                    id="stop-record-btn"
                    onClick={handleStopRecording}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 shadow-xl shadow-rose-500/40 text-white flex items-center justify-center transition-all active:scale-95"
                  >
                    <Square className="w-7 h-7 fill-white" />
                  </button>
                </div>
              )}
            </div>

            {/* Quick Audio Settings Trigger */}
            <button
              onClick={() => setShowSettingsModal(!showSettingsModal)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl text-xs md:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
            >
              <Sliders className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">{isBn ? 'সাউন্ড সেটিংস' : 'Settings'}</span>
            </button>
          </div>
        </div>

        {/* Right / Side Panel: Hardware DSP & Android Service Simulation (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Preset Quality Selector Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>{isBn ? 'রেকর্ডিং কোয়ালিটি মোড' : 'Audio Quality Preset'}</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    format: 'wav',
                    sampleRate: 48000,
                    bitDepth: 24,
                  })
                }
                className={`p-3 rounded-2xl border text-left transition-all ${
                  settings.sampleRate === 48000 && settings.format === 'wav'
                    ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-xs text-sky-300">Studio Master</div>
                <div className="text-[11px] text-slate-400 mt-0.5">48 kHz • 24-bit WAV</div>
              </button>

              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    format: 'webm',
                    sampleRate: 44100,
                    bitDepth: 16,
                  })
                }
                className={`p-3 rounded-2xl border text-left transition-all ${
                  settings.sampleRate === 44100
                    ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-xs text-rose-300">Voice Memo</div>
                <div className="text-[11px] text-slate-400 mt-0.5">44.1 kHz • AAC/WebM</div>
              </button>

              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    format: 'wav',
                    sampleRate: 96000,
                    bitDepth: 24,
                  })
                }
                className={`p-3 rounded-2xl border text-left transition-all ${
                  settings.sampleRate === 96000
                    ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-xs text-indigo-300">Lossless Pro</div>
                <div className="text-[11px] text-slate-400 mt-0.5">96 kHz • Hi-Res</div>
              </button>

              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    format: 'webm',
                    sampleRate: 48000,
                    bitDepth: 16,
                  })
                }
                className={`p-3 rounded-2xl border text-left transition-all ${
                  settings.format === 'webm' && settings.sampleRate === 48000
                    ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-bold text-xs text-emerald-300">Compact Eco</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Small Size • Fast</div>
              </button>
            </div>
          </div>

          {/* Android Background Service & Notification Control Simulation */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>{isBn ? 'Android নোটিফিকেশন সার্ভিস প্রিভিউ' : 'Android Notification Service'}</span>
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Android Lockscreen Style Notification Card */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-[10px]">
                    UR
                  </div>
                  <span className="font-semibold text-slate-300">UltraRecord Service</span>
                </div>
                <span className="text-[10px] font-mono">এখন চলছে</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">
                    {isRecording ? (isPaused ? 'রেকর্ডিং সাময়িক স্থগিত' : 'অডিও রেকর্ড হচ্ছে...') : 'সার্ভিস সক্রিয় (Standby)'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {formatShortTime(recordingDuration)} • WakeLock Active
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    disabled={!isRecording}
                    onClick={handleTogglePause}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg disabled:opacity-40"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                  <button
                    disabled={!isRecording}
                    onClick={handleStopRecording}
                    className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg disabled:opacity-40"
                  >
                    <Square className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isBn ? 'স্ক্রিন অফ বা অন্য অ্যাপেও নিরবচ্ছিন্ন ব্যাকগ্রাউন্ড রেকর্ড' : 'Continuous background recording with screen locked'}</span>
            </div>
          </div>

          {/* DSP Sound Processing Toggles */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-xl space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4 text-sky-400" />
              <span>{isBn ? 'ডিজিটাল সাউন্ড ফিল্টার' : 'DSP Hardware Filters'}</span>
            </h3>

            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <div>
                <div className="text-xs font-semibold text-white">{isBn ? 'নয়েজ ক্যান্সেলেশন' : 'Noise Suppression'}</div>
                <div className="text-[10px] text-slate-400">{isBn ? 'অপ্রয়োজনীয় ব্যাকগ্রাউন্ড শব্দ দূরীকরণ' : 'Removes background room hum'}</div>
              </div>
              <input
                type="checkbox"
                checked={settings.noiseSuppression}
                onChange={(e) => setSettings({ ...settings, noiseSuppression: e.target.checked })}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <div>
                <div className="text-xs font-semibold text-white">{isBn ? 'ইকো ক্যান্সেলেশন' : 'Echo Cancellation'}</div>
                <div className="text-[10px] text-slate-400">{isBn ? 'স্পিকার ইকো ও প্রতিধ্বনি রোধ' : 'Prevents speaker feedback'}</div>
              </div>
              <input
                type="checkbox"
                checked={settings.echoCancellation}
                onChange={(e) => setSettings({ ...settings, echoCancellation: e.target.checked })}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <div>
                <div className="text-xs font-semibold text-white">{isBn ? 'অটো গেইন কন্ট্রোল' : 'Auto Gain Control (AGC)'}</div>
                <div className="text-[10px] text-slate-400">{isBn ? 'ভয়েস লেভেল সমান রাখা' : 'Normalizes voice volume'}</div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoGainControl}
                onChange={(e) => setSettings({ ...settings, autoGainControl: e.target.checked })}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
