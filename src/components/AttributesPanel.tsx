import { useSkillStore } from '../store/useSkillStore';
import { CharacterAttributes } from '../types';
import { Brain, Database, MessageCircle, Eye, Zap } from 'lucide-react';

const ATTR_ICONS = {
  intelligence: Brain,
  memory: Database,
  charisma: MessageCircle,
  perception: Eye,
  willpower: Zap,
};

export function AttributesPanel() {
  const { attributes, setAttributes } = useSkillStore();

  const handleChange = (key: keyof CharacterAttributes, value: number) => {
    setAttributes({
      ...attributes,
      [key]: Math.max(0, Math.min(40, value)), // Clamp between 0 and 40
    });
  };

  return (
    <div className="bg-card/50 backdrop-blur-md border border-white/5 rounded-xl p-4 shadow-xl">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Attributes
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(Object.keys(attributes) as Array<keyof CharacterAttributes>).map((key) => {
          const Icon = ATTR_ICONS[key];
          return (
            <div key={key} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground capitalize">
                <Icon className="w-3 h-3" />
                {key}
              </div>
              <input
                type="number"
                value={attributes[key]}
                onChange={(e) => handleChange(key, parseInt(e.target.value) || 0)}
                className="bg-black/40 border border-white/10 rounded px-2 py-1 text-sm font-mono text-center focus:ring-1 focus:ring-primary/50 outline-none"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
