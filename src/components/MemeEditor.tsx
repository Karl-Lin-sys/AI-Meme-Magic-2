import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { 
  Upload, 
  Download, 
  Type as TypeIcon, 
  Sparkles, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Palette,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateMagicCaptions } from '../services/gemini';
import { cn } from '../lib/utils';
import type { MemeTemplate } from '../types';

interface MemeEditorProps {
  selectedTemplate: MemeTemplate | null;
}

export function MemeEditor({ selectedTemplate }: MemeEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 600,
      height: 600,
      backgroundColor: '#f3f4f6',
    });

    fabricCanvas.on('selection:created', (e) => {
      setSelectedObjectId((e.selected?.[0] as any)?.data?.id || null);
    });
    fabricCanvas.on('selection:cleared', () => {
      setSelectedObjectId(null);
    });
    fabricCanvas.on('selection:updated', (e) => {
      setSelectedObjectId((e.selected?.[0] as any)?.data?.id || null);
    });

    setCanvas(fabricCanvas);

    return () => {
      fabricCanvas.dispose();
    };
  }, []);

  // Handle Resize
  useEffect(() => {
    if (!canvas || !containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const size = Math.min(width - 40, 600);
      canvas.setDimensions({ width: size, height: size });
      
      // Scale content if needed
      const backgroundImage = canvas.backgroundImage;
      if (backgroundImage && backgroundImage instanceof fabric.FabricImage) {
        const scale = Math.min(size / backgroundImage.width!, size / backgroundImage.height!);
        backgroundImage.set({
          scaleX: scale,
          scaleY: scale,
          left: size / 2,
          top: size / 2,
          originX: 'center',
          originY: 'center',
        });
        canvas.renderAll();
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [canvas]);

  // Load Template
  useEffect(() => {
    if (!canvas || !selectedTemplate) return;
    loadImageToCanvas(selectedTemplate.url);
  }, [canvas, selectedTemplate]);

  const loadImageToCanvas = async (url: string) => {
    if (!canvas) return;

    const img = await fabric.FabricImage.fromURL(url, {
      crossOrigin: 'anonymous'
    });

    const canvasWidth = canvas.width!;
    const canvasHeight = canvas.height!;
    const scale = Math.min(canvasWidth / img.width!, canvasHeight / img.height!);

    canvas.clear();
    canvas.backgroundColor = '#f3f4f6';
    
    img.set({
      scaleX: scale,
      scaleY: scale,
      left: canvasWidth / 2,
      top: canvasHeight / 2,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    });

    canvas.backgroundImage = img;
    canvas.renderAll();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (f) => {
        const data = f.target?.result;
        if (typeof data === 'string') {
          loadImageToCanvas(data);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addText = (content: string = 'DOUBLE CLICK TO EDIT') => {
    if (!canvas) return;

    const text = new fabric.Textbox(content, {
      left: canvas.width! / 2,
      top: canvas.height! / 2,
      originX: 'center',
      originY: 'center',
      width: 400,
      fontSize: 40,
      fontFamily: 'Impact, sans-serif',
      fontWeight: 'bold',
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 2,
      textAlign: 'center',
      selectable: true,
      data: { id: Math.random().toString(36).substr(2, 9) }
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const handleMagicCaption = async () => {
    if (!canvas) return;
    
    setIsGenerating(true);
    setSuggestions([]);

    try {
      // Get base64 of the image only (background) or full canvas? 
      // Usually users want captions for the image context.
      const dataUrl = canvas.toDataURL({
        format: 'jpeg',
        quality: 0.8,
      });

      const captions = await generateMagicCaptions(dataUrl);
      setSuggestions(captions);
    } catch (error) {
      console.error('Magic Caption failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteSelected = () => {
    if (!canvas) return;
    const activeObjects = canvas.getActiveObjects();
    canvas.remove(...activeObjects);
    canvas.discardActiveObject();
    canvas.renderAll();
  };

  const downloadMeme = () => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({
      format: 'png',
      multiplier: 2 // High res
    });
    const link = document.createElement('a');
    link.download = `meme-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-gray-50 overflow-hidden">
      {/* Header Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <div className="h-6 w-px bg-gray-200 mx-1" />
          <button
            onClick={() => addText()}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-sm font-medium transition-colors"
          >
            <TypeIcon className="w-4 h-4" />
            Add Text
          </button>
        </div>

        <div className="flex items-center gap-3">
           {selectedObjectId && (
             <button
               onClick={deleteSelected}
               className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
               title="Delete Selected"
             >
               <Trash2 className="w-5 h-5" />
             </button>
           )}
           <button
            onClick={downloadMeme}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-orange-600/20"
          >
            <Download className="w-4 h-4" />
            Export Meme
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto">
          <div className="relative bg-white shadow-2xl rounded-lg p-2 border border-gray-200">
             <canvas ref={canvasRef} />
             
             {/* Bottom Overlay Label */}
             <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 font-mono tracking-widest uppercase">
               600x600 · FabricJS Renderer
             </div>
          </div>
        </div>

        {/* Right Sidebar: AI & Controls */}
        <div className="w-80 border-l border-gray-200 bg-white flex flex-col shadow-inner">
          {/* Magic Caption Section */}
          <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-orange-50/50 to-white">
            <button
              onClick={handleMagicCaption}
              disabled={isGenerating}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95",
                isGenerating 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                  : "bg-orange-500 text-white hover:bg-orange-600 hover:shadow-orange-500/30"
              )}
            >
              <Sparkles className={cn("w-5 h-5", isGenerating && "animate-spin")} />
              {isGenerating ? "Analyzing Image..." : "Magic Caption ✨"}
            </button>

            <AnimatePresence>
              {suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mt-4 space-y-2"
                >
                  <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-2">AI Suggestions</p>
                  {suggestions.map((suggestion, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ x: 5 }}
                      onClick={() => addText(suggestion)}
                      className="w-full text-left p-3 text-xs text-gray-700 bg-white border border-gray-100 rounded-lg hover:border-orange-200 hover:bg-orange-50 transition-all line-clamp-2"
                    >
                      "{suggestion}"
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-6 flex-1 text-center flex flex-col items-center justify-center text-gray-400 space-y-4">
               {!selectedObjectId && (
                 <>
                   <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                     <TypeIcon className="w-6 h-6" />
                   </div>
                   <div>
                     <p className="text-sm font-medium text-gray-600">Select text to edit</p>
                     <p className="text-[11px]">Control color, size, and fonts here</p>
                   </div>
                 </>
               )}
               {selectedObjectId && (
                 <div className="w-full space-y-6">
                    <div className="flex flex-col items-start gap-2">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Text Style</label>
                       <div className="grid grid-cols-4 gap-2 w-full">
                          {['#ffffff', '#000000', '#ff0000', '#00ff00'].map(color => (
                            <button
                              key={color}
                              onClick={() => {
                                const active = canvas?.getActiveObject();
                                if (active) {
                                  active.set('fill', color);
                                  canvas?.renderAll();
                                }
                              }}
                              className="aspect-square rounded-md border border-gray-100 shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                       </div>
                    </div>

                    <div className="flex flex-col items-start gap-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Font Size</label>
                        <div className="flex items-center gap-2 w-full">
                           <button 
                             onClick={() => {
                               const active = canvas?.getActiveObject();
                               if (active && active instanceof fabric.Textbox) {
                                 active.set('fontSize', (active.fontSize || 40) - 5);
                                 canvas?.renderAll();
                               }
                             }}
                             className="p-1 hover:bg-gray-100 rounded"
                           >
                             <Minimize2 className="w-4 h-4" />
                           </button>
                           <div className="flex-1 h-1 bg-gray-100 rounded-full" />
                           <button 
                             onClick={() => {
                               const active = canvas?.getActiveObject();
                               if (active && active instanceof fabric.Textbox) {
                                 active.set('fontSize', (active.fontSize || 40) + 5);
                                 canvas?.renderAll();
                               }
                             }}
                             className="p-1 hover:bg-gray-100 rounded"
                           >
                             <Maximize2 className="w-4 h-4" />
                           </button>
                        </div>
                    </div>
                 </div>
               )}
          </div>
          
          <div className="p-4 border-t border-gray-100 text-[10px] text-gray-400 text-center uppercase tracking-widest">
            AI Meme Engine v1.0
          </div>
        </div>
      </div>
    </div>
  );
}
