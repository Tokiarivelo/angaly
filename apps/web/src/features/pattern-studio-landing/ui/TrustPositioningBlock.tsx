import React from 'react';
import { Sparkles, ShieldCheck, Download } from 'lucide-react';

interface TrustPoint {
  title: string;
  description: string;
  icon: string;
}

interface TrustPositioningBlockProps {
  content: {
    manifesto: string;
    points: TrustPoint[];
  };
}

export const TrustPositioningBlock: React.FC<TrustPositioningBlockProps> = ({ content }) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-[#C5B190]" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-[#C5B190]" />;
      case 'Download':
        return <Download className="w-5 h-5 text-[#C5B190]" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#C5B190]" />;
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#041329] border-t border-b border-[#C5B190]/15">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left: Manifesto */}
        <div className="lg:col-span-5">
          <span className="text-xs uppercase tracking-widest text-[#C5B190] font-semibold block mb-4">
            Notre philosophie
          </span>
          <blockquote className="font-serif italic text-2xl sm:text-3xl text-white font-light leading-relaxed border-l-2 border-[#C5B190] pl-6 py-2">
            {content.manifesto}
          </blockquote>
        </div>

        {/* Right: Trust Points */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {content.points.map((point) => (
            <div
              key={point.title}
              className="bg-[#0C2650] border border-[#C5B190]/20 rounded-xl p-6 hover:border-[#C5B190]/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-[#041329] border border-[#C5B190]/30 flex items-center justify-center mb-4">
                {getIcon(point.icon)}
              </div>
              <h3 className="font-medium text-white text-base mb-2">
                {point.title}
              </h3>
              <p className="text-[#D8D3C8] text-xs font-light leading-relaxed">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
