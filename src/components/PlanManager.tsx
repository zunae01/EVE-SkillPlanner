import { useState, useRef } from 'react';
import { useSkillStore, SavedPlan } from '../store/useSkillStore';
import { FolderOpen, Trash2, Download, Upload, RefreshCw, Plus, X, Check, FileText } from 'lucide-react';
import { ESIService } from '../lib/esi';
import { cn } from '../lib/utils';
import { FitImportModal } from './FitImportModal';

export function PlanManager() {
  const { savedPlans, createPlan, loadPlan, deletePlan, importPlans, setAllSkills, activePlanId, exitPlan } = useSkillStore();
  const [isCreating, setIsCreating] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleCreate = () => {
    if (!newPlanName.trim()) return;
    createPlan(newPlanName);
    setNewPlanName('');
    setIsCreating(false);
  };
  
  // ... (keep existing handlers like handleUpdateDb, handleExport, handleImport)

  const handleUpdateDb = async () => {
    if (!confirm("This will crawl the EVE API to update local skill database. It may take a minute. Continue?")) return;
    
    setIsUpdating(true);
    setUpdateStatus('updating');
    try {
      const skills = await ESIService.refreshDatabase((_count, _total) => {
         // Could show progress here if we added a progress bar
      });
      setAllSkills(skills);
      setUpdateStatus('success');
      setTimeout(() => setUpdateStatus('idle'), 3000);
    } catch (e) {
      console.error(e);
      setUpdateStatus('error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(savedPlans, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eve-skill-plans-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const plans = JSON.parse(event.target?.result as string) as SavedPlan[];
        if (Array.isArray(plans)) {
          importPlans(plans);
        }
      } catch (err) {
        console.error("Failed to import plans", err);
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__scratchpad__') {
      exitPlan();
    } else {
      loadPlan(val);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 bg-card/50 backdrop-blur-md border border-white/5 rounded-lg p-2 h-12">
        {/* Plan Selector / Creator */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isCreating ? (
            <div className="flex items-center gap-2 flex-1 animate-in fade-in slide-in-from-left-2">
              <input
                type="text"
                autoFocus
                placeholder="Plan Name..."
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-primary/50 outline-none h-8"
              />
              <button
                onClick={handleCreate}
                className="p-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="relative flex-1 max-w-xs">
                  <FolderOpen className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <select
                      value={activePlanId || '__scratchpad__'}
                      onChange={handlePlanChange}
                      className="w-full bg-black/20 border border-white/10 rounded pl-9 pr-8 py-1.5 text-sm focus:ring-1 focus:ring-primary/50 outline-none appearance-none cursor-pointer hover:bg-black/30 transition-colors h-8 text-foreground"
                  >
                      <option value="__scratchpad__">Scratchpad (Unsaved)</option>
                      <optgroup label="Saved Plans">
                          {savedPlans.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                      </optgroup>
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50 text-[10px]">
                      ▼
                  </div>
              </div>
              
              <button
                onClick={() => setIsCreating(true)}
                className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded border border-primary/20 transition-colors h-8 w-8 flex items-center justify-center"
                title="Create New Plan"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        
        <div className="w-px h-6 bg-white/10 mx-1" />
        
        {/* Fit Import Button */}
        <button
          onClick={() => setIsImportModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded border border-blue-500/20 transition-colors text-xs font-bold uppercase tracking-wide"
        >
           <FileText className="w-3.5 h-3.5" /> Import Fit
        </button>

        <div className="w-px h-6 bg-white/10 mx-1" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          {activePlanId && (
              <button
                  onClick={() => {
                      if(confirm('Delete current plan?')) deletePlan(activePlanId);
                  }}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                  title="Delete Active Plan"
              >
                  <Trash2 className="w-4 h-4" />
              </button>
          )}

          <button
            onClick={handleExport}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded transition-colors"
            title="Export Plans to JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <label className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded transition-colors cursor-pointer" title="Import Plans from JSON">
              <Upload className="w-4 h-4" />
              <input type="file" accept=".json" onChange={handleImport} className="hidden" ref={fileInputRef} />
          </label>

          <button
            onClick={handleUpdateDb}
            disabled={isUpdating}
            className={cn(
              "p-1.5 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded transition-colors",
              isUpdating && "animate-spin text-primary",
              updateStatus === 'success' && "text-green-400",
              updateStatus === 'error' && "text-destructive"
            )}
            title="Update Skill Database"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <FitImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
    </>
  );
}