import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Cpu, ShieldAlert, Sparkles, Smartphone } from 'lucide-react';

interface SplashProps {
  onFinish: () => void;
}

export default function Splash({ onFinish }: SplashProps) {
  // Auto-redirect to clinical dashboard after 2.8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center text-white z-50 p-6 overflow-hidden select-none">
      {/* Cinematic ambient background effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
      
      {/* Decorative vertical grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#022c22_1px,transparent_1px),linear-gradient(to_bottom,#022c22_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />

      <div className="text-center max-w-md w-full flex flex-col items-center relative z-10">
        {/* Futuristic Hexagonal/Octagonal Outer Shell & Scan Lines */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.9, 1.05, 1], opacity: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="relative w-36 h-36 mb-8 bg-gradient-to-tr from-teal-900/60 via-slate-900 to-emerald-950/60 rounded-3xl flex items-center justify-center shadow-2xl shadow-teal-500/10 border border-teal-500/30 overflow-hidden"
        >
          {/* Moving Laser scan line */}
          <motion.div 
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_12px_#2dd4bf] z-10"
          />
          
          <div className="absolute inset-2 border border-teal-500/20 rounded-2xl bg-slate-950/40" />
          
          {/* Schematic medical jaw structure vector/svg */}
          <svg className="w-20 h-20 text-teal-400 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
          </svg>
          
          <Activity className="absolute bottom-4 right-4 text-emerald-400 w-5 h-5 animate-pulse" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="space-y-1.5"
        >
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-teal-400 text-[10px] font-semibold uppercase tracking-widest font-mono">
            <Cpu className="w-3.5 h-3.5" />
            <span>AI-Driven Diagnostic Core</span>
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent font-display">
            OCI ANALYZER
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-slate-400 mt-2 font-mono text-[10px] uppercase tracking-[0.25em]"
        >
          Orthodontic Compensation Index
        </motion.p>

        {/* Clinical Summary */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="text-xs text-slate-300 mt-5 px-8 leading-relaxed font-medium"
        >
          Expert-mode cephalometric index calculator and patient diagnostic archiver.
        </motion.p>

        {/* Loading Indicator */}
        <div className="w-48 bg-slate-900 h-1.5 rounded-full overflow-hidden mt-10 relative border border-slate-800">
          <motion.div
            initial={{ left: '-100%' }}
            animate={{ left: '100%' }}
            transition={{ duration: 2.5, ease: 'easeInOut' }}
            className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full"
          />
        </div>

        {/* Fast Action Skip */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          onClick={onFinish}
          className="mt-10 px-8 py-3 bg-teal-500/15 hover:bg-teal-500/25 active:bg-teal-500/35 text-teal-300 hover:text-white border border-teal-500/30 rounded-2xl text-xs font-bold tracking-wider transition-all duration-300 shadow-lg cursor-pointer flex items-center space-x-2"
        >
          <span>Skip Diagnostics</span>
          <Activity className="w-4 h-4 text-teal-400 animate-spin" />
        </motion.button>

        <div className="mt-12 flex flex-col items-center space-y-2">
          <div className="flex items-center space-x-4 text-slate-500 font-mono text-[9px] uppercase tracking-wider">
            <span>v1.2.0</span>
            <span>•</span>
            <span className="flex items-center text-teal-500/80">
              <Smartphone className="w-3.5 h-3.5 mr-1" /> Standalone Mobile
            </span>
            <span>•</span>
            <span>100% Offline Safe</span>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 1 }}
            className="text-[10px] text-teal-400/60 font-mono tracking-wide"
          >
            Developed by Dr. Salman MDS Orthodontist
          </motion.p>
        </div>
      </div>
    </div>
  );
}

