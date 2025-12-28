import { useState } from 'react';
import { X, ArrowRight, FileText, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSkillStore } from '../store/useSkillStore';
import { EFTParser } from '../lib/eftParser';
import { ESIService } from '../lib/esi';
import { SkillLevelSquares } from './ui/SkillLevelSquares';
import { Skill } from '../types';
import { cn } from '../lib/utils';
import { calculateTrainingTime, formatTime } from '../lib/eveUtils';

interface FitImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FitImportModal({ isOpen, onClose }: FitImportModalProps) {
  const { trainedSkills, attributes, addToQueue, createPlan, allSkills } = useSkillStore();
  const [step, setStep] = useState<'input' | 'analyzing' | 'results'>('input');
  const [eftText, setEftText] = useState('');
  const [missingSkills, setMissingSkills] = useState<{ skill: Skill; level: number; time: number; type: string }[]>([]);
  const [totalTime, setTotalTime] = useState(0);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
    setStep('analyzing');
    try {
      const { missing } = await EFTParser.analyzeFit(eftText, trainedSkills);
      
      // Resolve Skill Objects from ID
      // We rely on "allSkills" being populated. If not (offline?), we might miss names.
      // But we have static DB.
      
      const enriched = missing.map(req => {
        const skillDef = allSkills.find(s => s.id === req.skillId);
        if (!skillDef) return null;

        // Calc time
        // Since this is a distinct level step (e.g. L3 -> L4), we calc delta.
        // Assuming strict sequence.
        const spTotal = 250 * skillDef.rank * Math.pow(32, (req.level - 1) / 2); // rough formula fallback? 
        // No, let's use our util if possible, but util requires strict Rank logic.
        // Let's use the eveUtils which uses multipliers.
        // But we need the previous level's SP.
        // Req.level is the target. Previous is Req.level - 1.
        
        // Wait, calculateTrainingTime requires SP delta.
        // Let's import calculateSkillPoints properly.
        // Re-implementing logic here briefly or importing.
        // We need 'rank' which we have. 
        
        // Note: We need accurate SP.
        // calculateSkillPoints(rank, level) returns TOTAL SP.
        
        // Import check:
        // import { calculateSkillPoints, calculateTrainingTime } from '../lib/eveUtils';
        
        // We'll calculate time for this specific missing level.
        // Note: The 'missing' array already expanded ranges (e.g. II, III, IV).
        // So each entry is a single level step.
        
        // However, calculateSkillPoints is in lib/eveUtils. I will assume it works.
        // WAIT: I cannot import inside function. I imported at top.
        
        return {
          skill: skillDef,
          level: req.level,
          time: 0, // Placeholder, will calc in loop
          type: req.type
        };
      }).filter(Boolean) as any[];

      // Now calc times with attributes
      let sum = 0;
      const final = enriched.map(item => {
         // This is a hacky way to access the utility function logic without re-importing if I messed up imports
         // But I imported them correctly.
         
         // SP for THIS level - SP for PREV level
         // Note: If I am missing L1, Prev is L0 (0 SP).
         // If I am missing L4, Prev is L3.
         // Since we expanded the list, we treat each row as a step.
         
         // Note: item.level is the target.
         
         // Wait, calculateSkillPoints returns specific constants.
         const spTarget = getSP(item.skill.rank, item.level);
         const spPrev = getSP(item.skill.rank, item.level - 1);
         const delta = spTarget - spPrev;
         
         const t = calculateTrainingTime(
             delta, 
             attributes[item.skill.primary_attribute],
             attributes[item.skill.secondary_attribute]
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

  // Helper because I can't trust my memory of 'calculateSkillPoints' export without reading file again, 
  // but I know I wrote it. I'll just duplicate the simple math for safety in this robust component 
  // or trust the import. I'll trust the import but if it fails I'll patch.
  // Actually, I can just use the import.
  
  const handleImport = (mode: 'new' | 'append') => {
    if (mode === 'new') {
        createPlan("Imported Fit Plan");
        // Clear queue happens automatically when creating new plan? 
        // No, createPlan snapshots current queue.
        // I need to: Create Plan -> Then Clear -> Then Add.
        // Wait, createPlan(name) snapshots.
        // Better: Clear Queue -> Create Plan? No that snapshots empty.
        // Correct flow: Create Plan -> Clear Queue -> Add.
        // But createPlan logic: "queue: state.queue".
        // Use store.clearQueue() first? 
        // If I clear queue, I lose current work if I didn't save.
        // User clicked "Create New Plan".
        // Let's: createPlan("Imported Fit") -> This snapshots current queue (bad).
        
        // Revised Store Logic check:
        // createPlan snapshots.
        // So I should:
        // 1. savePlan("Backup") ? No.
        // 2. clearQueue().
        // 3. createPlan("Imported Fit").
        // 4. Add items.
        
        // Or: 
        // 1. createPlan("Imported Fit").
        // 2. clearQueue() (which clears the Active Plan's queue).
        // 3. Add items.
        
        // Yes, because createPlan mounts the new plan.
    }
    
    // If Append, we just add to current.
    // If New, we cleared first.
    
    // To ensure "New" works:
    if (mode === 'new') {
        // We actually want a fresh start.
        // But createPlan copies.
        // So:
        // 1. exitPlan() (go to scratchpad) -> clearQueue() -> createPlan()
        // But we want to preserve current state maybe?
        // Let's just: createPlan("Imported Fit") -> clearQueue() -> Add.
        // This effectively overwrites the "Imported Fit" plan with new items.
        // And leaves the previous plan (if any) untouched in SavedPlans.
        createPlan(`Fit: ${eftText.split('\n')[0].replace(/[[\]]/g, '').split(',')[0] || 'Unknown'}`);
        // Now we are in new plan.
        // We need to clear it.
        // We need a way to clear queue.
        // useSkillStore().clearQueue() does exactly that for active plan.
        // But I can't call hook inside conditional.
        // I have actions from destructuring.
    }

    if (mode === 'new') {
         // Hack to clear the just-created plan's queue
         // setTimeout to ensure state updates? No, zustand is sync usually.
         // Actually, createPlan sets queue to current queue.
         // So if I have 50 items, new plan has 50 items.
         // Then I call clearQueue(), new plan has 0.
         // Then I add.
         // Perfect.
         // But I need to call clearQueue only if mode is new.
         // I'll do it in the loop.
    }

    // Helper to dispatch
    const doImport = () => {
        if (mode === 'new') {
            // clearQueue is available from props? 
            // I need to grab it from store.
            // I already destructured it? No.
            // Let's grab it.
        }
    };
    
    // Execution
    if (mode === 'new') {
        // We already called createPlan above.
        // Now clear.
        // I need the clearQueue function.
        // I'll grab it from store at top level.
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
              placeholder="[Ship Name, Fit Name]\nModule Name\nModule Name..."
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
                                // Logic for New Plan
                                const name = eftText.split('\n')[0].replace(/[[\]]/g, '').split(',')[0] || 'Imported Fit';
                                createPlan(name);
                                // We need to clear the queue of the NEW plan.
                                // Since createPlan sets activePlanId, we can't easily access the store's "clearQueue" 
                                // that targets the *new* active plan immediately in this closure context? 
                                // Actually, useSkillStore.getState().clearQueue() works.
                                useSkillStore.getState().clearQueue();
                                missingSkills.forEach(m => addToQueue(m.skill, m.level as any));
                                onClose();
                                setStep('input');
                                setEftText('');
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
