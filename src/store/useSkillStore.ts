import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { QueueItem, Skill, CharacterAttributes } from '../types';

export interface SavedPlan {
  id: string;
  name: string;
  created_at: number;
  queue: QueueItem[];
}

export interface UserSession {
  characterId: number;
  characterName: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface SkillStore {
  // Auth State
  user: UserSession | null;
  trainedSkills: Record<number, number>; // skill_id -> level (0-5)

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
  
  // Auth Actions
  login: (session: UserSession) => void;
  logout: () => void;
  setTrainedSkills: (skills: Record<number, number>) => void;

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
      user: null,
      trainedSkills: {},
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
      
      login: (session) => set({ user: session }),
      logout: () => set({ user: null, trainedSkills: {} }),
      setTrainedSkills: (trainedSkills) => set({ trainedSkills }),

      setAllSkills: (skills) => set({ allSkills: skills }),

      addToQueue: (skill, level) =>
        set((state) => {
          // Check if already trained to this level or higher
          // If so, we might want to warn or skip, but per requirements: "indicate it is Already Trained"
          // Logic for queueing is to add it, but display logic handles the visual.
          
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
        const newActiveId = state.activePlanId === planId ? null : state.activePlanId;
        return {
          savedPlans: remaining,
          activePlanId: newActiveId,
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
        activePlanId: state.activePlanId,
        user: state.user,
        trainedSkills: state.trainedSkills
      }),
    }
  )
);