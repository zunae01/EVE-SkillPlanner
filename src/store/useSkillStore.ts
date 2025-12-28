import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { QueueItem, Skill, CharacterAttributes } from '../types';

export interface SavedPlan {
  id: string;
  name: string;
  created_at: number;
  queue: QueueItem[];
}

interface SkillStore {
  // Active State
  queue: QueueItem[];
  attributes: CharacterAttributes;
  allSkills: Skill[]; // The full DB
  activePlanId: string | null; // Currently mounted plan
  
  // Persistence
  savedPlans: SavedPlan[];

  // Actions
  setAllSkills: (skills: Skill[]) => void;
  addToQueue: (skill: Skill, level: 1 | 2 | 3 | 4 | 5) => void;
  removeFromQueue: (id: string) => void;
  reorderQueue: (newQueue: QueueItem[]) => void;
  setAttributes: (attrs: CharacterAttributes) => void;
  clearQueue: () => void;
  
  // Plan Manager Actions
  createPlan: (name: string) => void;
  loadPlan: (planId: string) => void;
  deletePlan: (planId: string) => void;
  importPlans: (plans: SavedPlan[]) => void;
  exitPlan: () => void; // Go back to scratchpad
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useSkillStore = create<SkillStore>()(
  persist(
    (set, get) => ({
      queue: [],
      savedPlans: [],
      allSkills: [], 
      attributes: {
        intelligence: 20,
        memory: 20,
        charisma: 20,
        perception: 20,
        willpower: 20,
      },
      activePlanId: null,
      
      setAllSkills: (skills) => set({ allSkills: skills }),

      addToQueue: (skill, level) =>
        set((state) => {
          const newQueue = [
            ...state.queue,
            {
              id: generateId(),
              skill_id: skill.id,
              skill,
              level,
            },
          ];
          
          // Auto-persist if active plan
          let newSavedPlans = state.savedPlans;
          if (state.activePlanId) {
            newSavedPlans = state.savedPlans.map(p => 
              p.id === state.activePlanId ? { ...p, queue: newQueue } : p
            );
          }

          return { queue: newQueue, savedPlans: newSavedPlans };
        }),

      removeFromQueue: (id) =>
        set((state) => {
          const newQueue = state.queue.filter((item) => item.id !== id);
          
          // Auto-persist
          let newSavedPlans = state.savedPlans;
          if (state.activePlanId) {
            newSavedPlans = state.savedPlans.map(p => 
              p.id === state.activePlanId ? { ...p, queue: newQueue } : p
            );
          }

          return { queue: newQueue, savedPlans: newSavedPlans };
        }),

      reorderQueue: (newQueue) => 
        set((state) => {
           // Auto-persist
           let newSavedPlans = state.savedPlans;
           if (state.activePlanId) {
             newSavedPlans = state.savedPlans.map(p => 
               p.id === state.activePlanId ? { ...p, queue: newQueue } : p
             );
           }
           return { queue: newQueue, savedPlans: newSavedPlans };
        }),

      setAttributes: (attributes) => set({ attributes }),
      
      clearQueue: () => 
        set((state) => {
           // Auto-persist
           let newSavedPlans = state.savedPlans;
           if (state.activePlanId) {
             newSavedPlans = state.savedPlans.map(p => 
               p.id === state.activePlanId ? { ...p, queue: [] } : p
             );
           }
           return { queue: [], savedPlans: newSavedPlans };
        }),

      createPlan: (name) => set((state) => {
        const newId = generateId();
        const newPlan: SavedPlan = {
          id: newId,
          name,
          created_at: Date.now(),
          queue: state.queue, // Snapshot current queue into new plan
        };
        
        return {
          savedPlans: [...state.savedPlans, newPlan],
          activePlanId: newId // Mount immediately
        };
      }),

      loadPlan: (planId) => {
        const plan = get().savedPlans.find(p => p.id === planId);
        if (plan) {
          set({ queue: plan.queue, activePlanId: planId });
        }
      },

      deletePlan: (planId) => set((state) => {
        const remaining = state.savedPlans.filter(p => p.id !== planId);
        // If we deleted the active plan, unmount it
        const newActiveId = state.activePlanId === planId ? null : state.activePlanId;
        return {
          savedPlans: remaining,
          activePlanId: newActiveId,
          // If we unmounted, should we clear queue? 
          // Usually safer to keep it as "Scratchpad" content or clear it. 
          // Let's keep it to avoid data loss, user is now in "Scratchpad" mode with that data.
        };
      }),

      importPlans: (plans) => set((state) => ({
        savedPlans: [...state.savedPlans, ...plans]
      })),

      exitPlan: () => set({ activePlanId: null }),
    }),
    {
      name: 'eve-skill-planner-storage',
      partialize: (state) => ({ 
        queue: state.queue, 
        attributes: state.attributes,
        savedPlans: state.savedPlans,
        activePlanId: state.activePlanId
      }),
    }
  )
);