import { X, Brain, Database, MessageCircle, Eye, Zap } from 'lucide-react';
import { useSkillStore } from '../store/useSkillStore';
import { CharacterAttributes } from '../types';

interface AttributesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ATTR_ICONS = {
  intelligence: Brain,
  memory: Database,
  charisma: MessageCircle,
  perception: Eye,
  willpower: Zap,
};

export function AttributesModal({ isOpen, onClose }: AttributesModalProps) {
  const { attributes, setAttributes, user } = useSkillStore();

  if (!isOpen) return null;

  const handleChange = (key: keyof CharacterAttributes, value: number) => {
    // If logged in, maybe warn or disable editing? EVE attributes are fixed unless implants/remap.
    // For now, we allow editing as "Simulation Mode" even if logged in, but note it might reset on re-fetch.
    setAttributes({
      ...attributes,
      [key]: Math.max(0, Math.min(45, value)),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-white/10 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Character Attributes
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {user && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">
              Attributes synced from EVE Online. Adjusting them here acts as a simulation.
            </div>
          )}

          <div className="space-y-4">
            {(Object.keys(attributes) as Array<keyof CharacterAttributes>).map((key) => {
              const Icon = ATTR_ICONS[key];
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-lg text-primary">
                        <Icon className="w-5 h-5" />
                    </div>
                    <span className="capitalize font-medium">{key}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min="15"
                        max="45"
                        value={attributes[key]}
                        onChange={(e) => handleChange(key, parseInt(e.target.value))}
                        className="w-32 accent-primary"
                    />
                    <input
                        type="number"
                        value={attributes[key]}
                        onChange={(e) => handleChange(key, parseInt(e.target.value) || 0)}
                        className="w-12 bg-black/40 border border-white/10 rounded px-2 py-1 text-center font-mono text-sm focus:ring-1 focus:ring-primary/50 outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
