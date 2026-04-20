import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, Maximize, RotateCcw, Download } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/utils';

interface ImageOverlayProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ZoomableImage({ src, alt, className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!src) return null;

  return (
    <>
      <img 
        src={src} 
        alt={alt} 
        {...props} 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }} 
        className={cn(className, "cursor-zoom-in transition-all active:scale-95")}
        referrerPolicy="no-referrer"
      />
      {isOpen && <ImageOverlay src={src} alt={alt} onClose={() => setIsOpen(false)} />}
    </>
  );
}

export default function ImageOverlay({ src, alt, onClose }: ImageOverlayProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleZoom = useCallback((delta: number) => {
    setScale(prev => Math.min(Math.max(prev + delta, 1), 5));
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    handleZoom(delta);
  };

  const reset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Prevent scroll on body when open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-hidden"
        onWheel={handleWheel}
        onClick={onClose}
      >
        {/* Controls Overlay */}
        <div 
          className="absolute top-6 right-6 flex items-center gap-2 z-10"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex bg-white/10 rounded-full border border-white/20 p-1 backdrop-blur-md">
            <button 
              onClick={() => handleZoom(0.5)}
              className="p-2 text-white/70 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>
            <button 
              onClick={() => handleZoom(-0.5)}
              className="p-2 text-white/70 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            <div className="w-[1px] h-4 bg-white/20 self-center mx-1" />
            <button 
              onClick={reset}
              className="p-2 text-white/70 hover:text-white transition-colors"
              title="Reset View"
            >
              <RotateCcw size={18} />
            </button>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 backdrop-blur-md transition-all hover:scale-105"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info Label */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md text-[10px] text-white/60 font-mono flex items-center gap-4">
          <span className="uppercase tracking-[0.2em]">Scale: {Math.round(scale * 100)}%</span>
          <span className="w-1 h-1 bg-white/20 rounded-full" />
          <span className="uppercase tracking-[0.2em]">{alt || 'Source Image'}</span>
        </div>

        {/* Image Container */}
        <motion.div
          drag={scale > 1}
          dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          style={{ 
            x: position.x, 
            y: position.y,
            scale: scale,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          className="relative max-w-full max-h-full"
          onClick={e => e.stopPropagation()}
        >
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={src}
            alt={alt}
            referrerPolicy="no-referrer"
            className="block w-auto h-auto max-w-[90vw] max-h-[85vh] object-contain shadow-2xl pointer-events-none select-none"
          />
        </motion.div>

        {/* Instructions */}
        <div className="absolute top-6 left-6 pointer-events-none">
          <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 italic">
            Visual Inspection Active // 001
          </p>
          <p className="text-[9px] uppercase tracking-widest text-white/20 font-mono mt-1">
            Scroll to zoom // Drag to pan
          </p>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
