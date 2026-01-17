import { useState } from 'react';
import { X, ArrowRight, FileText, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSkillStore } from '../store/useSkillStore';
import { EFTParser } from '../lib/eftParser';
import { SkillLevelSquares } from './ui/SkillLevelSquares';
import { Skill, CharacterAttributes } from '../types';
import { cn } from '../lib/utils';
import { calculateTrainingTime, formatTime } from '../lib/eveUtils';
import { ESIService } from '../lib/esi';

interface FitImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FitImportModal({ isOpen, onClose }: FitImportModalProps) {
  const { trainedSkills, attributes, addToQueue, createPlan, allSkills, setAllSkills } = useSkillStore();
  const [step, setStep] = useState<'input' | 'analyzing' | 'results'>('input');
  const [eftText, setEftText] = useState('');
  const [missingSkills, setMissingSkills] = useState<{ skill: Skill; level: number; time: number; type: string }[]>([]);
  const [totalTime, setTotalTime] = useState(0);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    setStep('analyzing');
    try {
      const { missing } = await EFTParser.analyzeFit(eftText, trainedSkills);

      const missingSkillIds = [...new Set(missing.map(req => req.skillId))]
        .filter(id => !allSkills.some(s => s.id === id));
      let skillsForLookup = allSkills;
      if (missingSkillIds.length > 0) {
        const fetched = await ESIService.fetchSkillsByIds(missingSkillIds);
        if (fetched.length > 0) {
          const merged = [...allSkills];
          fetched.forEach(skill => {
            if (!merged.some(s => s.id === skill.id)) merged.push(skill);
          });
          setAllSkills(merged);
          skillsForLookup = merged;
        }
      }
      
      const enriched = missing.map(req => {
        const skillDef = skillsForLookup.find(s => s.id === req.skillId);
        if (!skillDef) return null;
        
        return {
          skill: skillDef,
          level: req.level,
          time: 0, 
          type: req.type
        };
      }).filter(Boolean) as any[];

      // Now calc times with attributes
      let sum = 0;
      const final = enriched.map(item => {
         const spTarget = getSP(item.skill.rank, item.level);
         const spPrev = getSP(item.skill.rank, item.level - 1);
         const delta = spTarget - spPrev;
         
         const t = calculateTrainingTime(
             delta, 
             attributes[item.skill.primary_attribute as keyof CharacterAttributes], 
             attributes[item.skill.secondary_attribute as keyof CharacterAttributes]
         );
         sum += t;
         return { ...item, time: t };
      });

      setMissingSkills(final);
      setTotalTime(sum);
      setStep('results');

    } catch (e) {
      console.error(e);
      alert("Failed to parse fit. Check format.");
      setStep('input');
    }
  };

  const handleImport = (mode: 'new' | 'append') => {
    if (mode === 'new') {
        createPlan(`Fit: ${eftText.split('\n')[0].replace(/[[\]]/g, '').split(',')[0] || 'Unknown'}`);
        // Clear the new plan's queue
        useSkillStore.getState().clearQueue();
    }

    // Adding items
    missingSkills.forEach(m => {
        addToQueue(m.skill, m.level as any);
    });
    
    onClose();
    setStep('input');
    setEftText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-card border border-white/10 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Import EFT Fit
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-0">
          {step === 'input' && (
            <textarea
              className="w-full h-96 bg-black/40 p-4 font-mono text-sm focus:outline-none resize-none"
              placeholder="[Ship Name, Fit Name]&#10;Module Name&#10;Module Name..."
              value={eftText}
              onChange={(e) => setEftText(e.target.value)}
              autoFocus
            />
          )}

          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
              <p>Analyzing Hull & Modules...</p>
            </div>
          )}

          {step === 'results' && (
            <div className="flex flex-col h-full">
              <div className="p-4 bg-primary/5 border-b border-primary/10 flex justify-between items-center">
                 <div>
                    <h3 className="font-bold text-primary flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Gap Analysis Complete
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        Found {missingSkills.length} missing skill levels.
                    </p>
                 </div>
                 <div className="text-right">
                    <div className="text-lg font-mono font-bold">{formatTime(totalTime)}</div>
                    <div className="text-[10px] uppercase tracking-wider opacity-50">Total Training</div>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                 {missingSkills.map((m, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-1 h-8 rounded-full",
                                m.type === 'prerequisite' ? "bg-orange-500" : "bg-blue-500"
                            )} />
                            <div>
                                <div className="font-medium text-sm">{m.skill.name}</div>
                                <div className="text-[10px] text-muted-foreground flex gap-2">
                                    <span className={m.type === 'prerequisite' ? "text-orange-400" : "text-blue-400"}>
                                        {m.type === 'prerequisite' ? "Deep Prerequisite" : "Direct Requirement"}
                                    </span>
                                    <span>•</span>
                                    <span>Rank {m.skill.rank}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="text-xs font-mono text-muted-foreground">{formatTime(m.time)}</div>
                             <SkillLevelSquares targetLevel={m.level} className="opacity-80" />
                        </div>
                    </div>
                 ))}
                 {missingSkills.length === 0 && (
                     <div className="p-8 text-center text-green-400 flex flex-col items-center">
                         <CheckCircle2 className="w-12 h-12 mb-4" />
                         <p>You have all required skills for this fit!</p>
                     </div>
                 )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-card">
          {step === 'input' ? (
             <button 
                onClick={handleAnalyze}
                disabled={!eftText.trim()}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded font-bold hover:bg-primary/90 disabled:opacity-50"
             >
                Analyze Fit <ArrowRight className="w-4 h-4" />
             </button>
          ) : step === 'results' ? (
             <>
                <button 
                    onClick={() => setStep('input')}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                    Back
                </button>
                {missingSkills.length > 0 && (
                    <>
                        <button 
                            onClick={() => {
                                handleImport('new');
                            }}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded hover:bg-white/10 text-sm"
                        >
                            Create New Plan
                        </button>
                        <button 
                            onClick={() => handleImport('append')}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded font-bold hover:bg-primary/90"
                        >
                            <Plus className="w-4 h-4" /> Append to Current
                        </button>
                    </>
                )}
             </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Helper duplication to avoid import issues if I cannot read eveUtils
function getSP(rank: number, level: number) {
    const multipliers = [0, 250, 1414, 8000, 45255, 256000];
    if (level >= 1 && level <= 5) return multipliers[level] * rank;
    return 0;
}
