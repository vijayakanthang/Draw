import { useState, useRef } from "react";
import { MicIcon } from "./Icons";
import type { Shape } from "../types/shapes";

interface AudioNoteOverlayProps {
  shape: Shape;
  onAddAudio: (shapeId: string, blobUrl: string) => void;
  isDark: boolean;
}

export default function AudioNoteOverlay({ shape, onAddAudio, isDark }: AudioNoteOverlayProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onAddAudio(shape.id, url);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div 
      className="absolute z-50 pointer-events-auto flex items-center gap-2"
      style={{ 
        left: (shape.x || 0), 
        top: (shape.y || 0) + (shape.height || 150) + 10 
      }}
    >
      <button 
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        title="Hold to Record Voice Note"
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xl ${
          isRecording ? "bg-red-500 animate-ping" : "bg-white/10 hover:bg-white/20 text-white/50 hover:text-white"
        }`}
      >
        <MicIcon />
      </button>

      {audioUrl && (
        <div className={`p-2 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-left duration-300 ${
          isDark ? "bg-slate-900 border-white/10 shadow-2xl" : "bg-white border-slate-200 shadow-lg"
        }`}>
           <audio src={audioUrl} controls className="h-8 max-w-[120px] filter invert dark:invert-0" />
           <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest px-2">Voice Note</span>
        </div>
      )}
    </div>
  );
}
