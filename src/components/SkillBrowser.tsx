import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useSkillStore } from '../store/useSkillStore';
import { motion } from 'framer-motion';
import { Skill } from '../types';
import { SkillLevelSquares } from './ui/SkillLevelSquares';

export function SkillBrowser() {
  const [query, setQuery] = useState('');
  const { allSkills, addToQueue, trainedSkills } = useSkillStore();
  
  // Pagination / Limit for performance
  const LIMIT = 50;

  const filteredSkills = useMemo(() => {
    if (!allSkills || allSkills.length === 0) return [];
    if (!query) return allSkills.slice(0, LIMIT);
    
    const lower = query.toLowerCase();
    return allSkills.filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        (s.description && s.description.toLowerCase().includes(lower))
    ).slice(0, LIMIT);
  }, [query, allSkills]);

  const handleAdd = (skill: Skill, level: 1 | 2 | 3 | 4 | 5) => {
    addToQueue(skill, level);
  };

  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-white/10 bg-white/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={allSkills.length ? `Search ${allSkills.length} skills...` : "Loading skills database..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={allSkills.length === 0}
            className="w-full bg-black/40 border border-white/10 rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50 transition-all disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {allSkills.length === 0 && (
           <div className="p-8 text-center text-muted-foreground animate-pulse">
             <p>Initializing Universe Database...</p>
             <p className="text-xs mt-2 opacity-50">Fetching from ESI (First run may take 30s)</p>
           </div>
        )}

        {filteredSkills.map((skill, i) => (
          <motion.div
            key={skill.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02, duration: 0.2 }}
            className="group flex flex-col p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {skill.name}
                </h3>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                  <span className="bg-black/40 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
                    x{skill.rank}
                  </span>
                  <span>{skill.primary_attribute} / {skill.secondary_attribute}</span>
                </div>
              </div>
              
              <SkillLevelSquares 
                interactive 
                trainedLevel={trainedSkills[skill.id] || 0}
                onClick={(lvl) => handleAdd(skill, lvl)}
                className="opacity-50 group-hover:opacity-100 transition-opacity"
              />
            </div>
            {/* Description tooltip or expandable could go here, keeping it minimal for high signal-to-noise */}
          </motion.div>
        ))}
        
        {allSkills.length > 0 && filteredSkills.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No skills found matching "{query}"
          </div>
        )}
      </div>
    </div>
  );
}
