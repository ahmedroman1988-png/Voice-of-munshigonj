import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  Download,
  Trash2,
  Edit2,
  Tag,
  Scissors,
  Bookmark,
  Volume2,
  Repeat,
  Sparkles,
  FileAudio,
  Check,
  Clock,
  HardDrive,
  Share2,
} from 'lucide-react';
import { Language, RecordingItem } from '../types';
import { formatBytes, formatSeconds, formatShortTime } from '../utils/audioEncoder';

interface RecordingsListProps {
  recordings: RecordingItem[];
  language: Language;
  onDeleteRecording: (id: string) => void;
  onUpdateRecording: (updated: RecordingItem) => void;
  onSwitchToRecorder: () => void;
}

export const RecordingsList: React.FC<RecordingsListProps> = ({
  recordings,
  language,
  onDeleteRecording,
  onUpdateRecording,
  onSwitchToRecorder,
}) => {
  const isBn = language === 'bn';

  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [activeTagModalId, setActiveTagModalId] = useState<string | null>(null);
  const [trimmingId, setTrimmingId] = useState<string | null>(null);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(10);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayToggle = (recording: RecordingItem) => {
    if (activePlayingId === recording.id) {
      if (isPlaying) {
        audioPlayerRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioPlayerRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setActivePlayingId(recording.id);
      setCurrentTime(0);
      setIsPlaying(true);

      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = recording.url;
        audioPlayerRef.current.playbackRate = playbackSpeed;
        audioPlayerRef.current.loop = isLooping;
        audioPlayerRef.current.play().catch(() => {});
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = val;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.playbackRate = speed;
    }
  };

  const handleSaveTitle = (recording: RecordingItem) => {
    if (editTitle.trim()) {
      onUpdateRecording({ ...recording, title: editTitle.trim() });
    }
    setEditingId(null);
  };

  const handleAddTag = (recording: RecordingItem) => {
    if (newTagInput.trim() && !recording.tags.includes(newTagInput.trim())) {
      onUpdateRecording({
        ...recording,
        tags: [...recording.tags, newTagInput.trim()],
      });
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (recording: RecordingItem, tagToRemove: string) => {
    onUpdateRecording({
      ...recording,
      tags: recording.tags.filter((t) => t !== tagToRemove),
    });
  };

  const downloadFile = (recording: RecordingItem) => {
    const link = document.createElement('a');
    link.href = recording.url;
    link.download = `${recording.title}.${recording.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Hidden Global Audio Element for Playback */}
      <audio
        ref={audioPlayerRef}
        onTimeUpdate={() => {
          if (audioPlayerRef.current) {
            setCurrentTime(audioPlayerRef.current.currentTime);
          }
        }}
        onEnded={() => {
          if (!isLooping) {
            setIsPlaying(false);
            setCurrentTime(0);
          }
        }}
      />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileAudio className="w-5 h-5 text-sky-400" />
            <span>{isBn ? 'সংরক্ষিত অডিও রেকর্ডসমূহ' : 'Saved Audio Recordings'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isBn
              ? `মোট ${recordings.length}টি রেকর্ড সংরক্ষিত আছে • ক্রপ, ফিল্টার ও এক্সপোর্ট করুন`
              : `${recordings.length} total recordings saved • Trim, filter & export`}
          </p>
        </div>

        <button
          onClick={onSwitchToRecorder}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs md:text-sm font-bold rounded-xl shadow-lg shadow-sky-500/25 transition-all flex items-center gap-2 self-start sm:self-auto active:scale-95"
        >
          <Play className="w-4 h-4" />
          <span>{isBn ? 'নতুন অডিও রেকর্ড করুন' : 'Record New Audio'}</span>
        </button>
      </div>

      {/* Recordings List */}
      {recordings.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
            <FileAudio className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isBn ? 'কোনো অডিও রেকর্ড পাওয়া যায়নি' : 'No Recordings Yet'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {isBn
                ? 'লাইভ রেকর্ডার ট্যাব থেকে আপনার প্রথম উচ্চমানের 48kHz অডিও রেকর্ড করুন।'
                : 'Start your first HD 48kHz recording from the live recorder studio.'}
            </p>
          </div>
          <button
            onClick={onSwitchToRecorder}
            className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            {isBn ? 'রেকর্ডার চালু করুন' : 'Open Recorder'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {recordings.map((rec) => {
            const isThisPlaying = activePlayingId === rec.id && isPlaying;
            const isThisSelected = activePlayingId === rec.id;

            return (
              <div
                key={rec.id}
                className={`bg-slate-900/90 border rounded-3xl p-5 md:p-6 transition-all shadow-xl backdrop-blur-xl ${
                  isThisSelected
                    ? 'border-sky-500/60 ring-1 ring-sky-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Title, Format Tag, Date & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handlePlayToggle(rec)}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg shrink-0 ${
                        isThisPlaying
                          ? 'bg-rose-500 text-white shadow-rose-500/30 scale-105'
                          : 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30'
                      }`}
                    >
                      {isThisPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1">
                      {editingId === rec.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="bg-slate-950 border border-sky-500 rounded-lg px-2.5 py-1 text-sm text-white font-medium focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveTitle(rec)}
                            className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm md:text-base text-white tracking-tight">
                            {rec.title}
                          </h3>
                          <button
                            onClick={() => {
                              setEditingId(rec.id);
                              setEditTitle(rec.title);
                            }}
                            className="text-slate-500 hover:text-slate-300 p-1"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatShortTime(rec.duration)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <HardDrive className="w-3 h-3 text-slate-500" />
                          {formatBytes(rec.size)}
                        </span>
                        <span>•</span>
                        <span className="uppercase text-[11px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.2 rounded-md border border-sky-500/20">
                          {rec.format} {rec.sampleRate / 1000}kHz
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Download, Tags, Delete) */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={() => downloadFile(rec)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all active:scale-95"
                      title="Download Audio File"
                    >
                      <Download className="w-3.5 h-3.5 text-sky-400" />
                      <span>{isBn ? 'ডাউনলোড' : 'Download'}</span>
                    </button>

                    <button
                      onClick={() => setActiveTagModalId(activeTagModalId === rec.id ? null : rec.id)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all"
                      title="Manage Tags"
                    >
                      <Tag className="w-4 h-4 text-amber-400" />
                    </button>

                    <button
                      onClick={() => onDeleteRecording(rec.id)}
                      className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/20 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Player Timeline & Controls if Selected */}
                {isThisSelected && (
                  <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
                    {/* Scrubbing Bar */}
                    <div className="space-y-1">
                      <input
                        type="range"
                        min={0}
                        max={rec.duration}
                        step={0.1}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                      />
                      <div className="flex justify-between text-[11px] font-mono text-slate-400">
                        <span>{formatSeconds(currentTime)}</span>
                        <span>{formatSeconds(rec.duration)}</span>
                      </div>
                    </div>

                    {/* Speed & Loop options */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
                          <button
                            key={spd}
                            onClick={() => handleSpeedChange(spd)}
                            className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-all ${
                              playbackSpeed === spd
                                ? 'bg-sky-500 text-white'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {spd}x
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setIsLooping(!isLooping);
                            if (audioPlayerRef.current) {
                              audioPlayerRef.current.loop = !isLooping;
                            }
                          }}
                          className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-xl border transition-all ${
                            isLooping
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          <Repeat className="w-3.5 h-3.5" />
                          <span>Loop</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tag Chips */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {rec.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700 rounded-lg flex items-center gap-1"
                    >
                      <span>#{t}</span>
                      {activeTagModalId === rec.id && (
                        <button
                          onClick={() => handleRemoveTag(rec, t)}
                          className="hover:text-rose-400 ml-0.5"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}

                  {/* Add Tag Inline Input */}
                  {activeTagModalId === rec.id && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <input
                        type="text"
                        placeholder={isBn ? 'নতুন ট্যাগ...' : 'New tag...'}
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTag(rec);
                        }}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-0.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
                      />
                      <button
                        onClick={() => handleAddTag(rec)}
                        className="px-2 py-0.5 bg-sky-500 text-white rounded-lg text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
