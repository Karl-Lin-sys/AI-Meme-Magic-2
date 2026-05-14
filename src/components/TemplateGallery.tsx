import { useState, useEffect } from 'react';
import type { MemeTemplate } from '../types';
import { Search, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface TemplateGalleryProps {
  onSelect: (template: MemeTemplate) => void;
}

export function TemplateGallery({ onSelect }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<MemeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('https://api.imgflip.com/get_memes')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTemplates(data.data.memes);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch templates:', err);
        setLoading(false);
      });
  }, []);

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden border-r border-gray-200 bg-white">
      <div className="p-4 border-bottom border-gray-200 space-y-4">
        <div className="flex items-center gap-2 text-gray-900">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          <h2 className="font-semibold text-lg">Trending Templates</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 items-center justify-center h-40">
             {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-100 animate-pulse rounded-lg" />
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-8">
            {filteredTemplates.map((template) => (
              <motion.button
                key={template.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(template)}
                className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-100 hover:border-orange-500 transition-colors"
                title={template.name}
              >
                <img
                  src={template.url}
                  alt={template.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <span className="text-white text-[10px] line-clamp-1 font-medium">{template.name}</span>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
