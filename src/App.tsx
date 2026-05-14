import { useState } from 'react';
import { TemplateGallery } from './components/TemplateGallery';
import { MemeEditor } from './components/MemeEditor';
import type { MemeTemplate } from './types';
import { Sparkles, Layout } from 'lucide-react';

export default function App() {
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(null);

  return (
    <div className="flex h-screen w-full bg-white font-sans text-gray-900">
      {/* Sidebar: Navigation & Identity */}
      <div className="w-16 flex flex-col items-center py-6 bg-gray-900 text-white gap-8 shrink-0">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 rotate-3">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col gap-6">
          <button className="p-2 text-white/50 hover:text-white transition-colors bg-white/10 rounded-lg">
            <Layout className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Template Browser */}
      <div className="w-80 shrink-0 border-r border-gray-200 h-full">
        <TemplateGallery onSelect={setSelectedTemplate} />
      </div>

      {/* Editor Main Surface */}
      <main className="flex-1 h-full overflow-hidden">
        <MemeEditor selectedTemplate={selectedTemplate} />
      </main>
    </div>
  );
}

