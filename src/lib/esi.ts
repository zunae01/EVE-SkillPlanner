import axios from 'axios';
import { Skill } from '../types';
import staticSkills from '../data/staticSkills.json';

const ESI_BASE = 'https://esi.evetech.net/latest';
const CACHE_KEY = 'eve_skills_cache_v1';
const CACHE_TIME = 1000 * 60 * 60 * 24 * 7; // 7 days

// Dogma Attribute IDs
const ATTR_MAP: Record<number, Skill['primary_attribute']> = {
  164: 'charisma',
  165: 'intelligence',
  166: 'memory',
  167: 'perception',
  168: 'willpower',
};

const RANK_ATTR_ID = 275;
const PRIMARY_ATTR_ID = 180;
const SECONDARY_ATTR_ID = 181;

export const ESIService = {
  async fetchAllSkills(onProgress?: (count: number, total: number) => void): Promise<Skill[]> {
    // 1. Check LocalStorage Cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { timestamp, data } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TIME) {
        return data;
      }
    }

    // 2. Return Static Data (Instant)
    // We treat the static JSON as the "base" database.
    // If the user wants to update, they must call refreshDatabase().
    // We cast the imported JSON to Skill[] because we know the structure matches
    return staticSkills as unknown as Skill[];
  },

  async refreshDatabase(onProgress?: (count: number, total: number) => void): Promise<Skill[]> {
      try {
      // 1. Fetch Category 16 (Skills)
      const catRes = await axios.get(`${ESI_BASE}/universe/categories/16/`);
      const groupIds: number[] = catRes.data.groups;

      const skills: Skill[] = [];
      
      // 2. Fetch all Groups
      const groups = await Promise.all(
        groupIds.map(id => axios.get(`${ESI_BASE}/universe/groups/${id}/`).then(r => r.data))
      );

      // Collect all type IDs that are published
      const allTypeIds: { id: number; groupId: number }[] = [];
      groups.forEach((group: any) => {
        if (group.types && group.published) {
          group.types.forEach((typeId: number) => {
            allTypeIds.push({ id: typeId, groupId: group.group_id });
          });
        }
      });

      // 3. Fetch Type Details
      const BATCH_SIZE = 20;
      let processed = 0;
      const total = allTypeIds.length;

      for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = allTypeIds.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
          batch.map(async ({ id, groupId }) => {
            try {
              const res = await axios.get(`${ESI_BASE}/universe/types/${id}/`);
              const data = res.data;
              if (!data.published) return null;

              // Extract attributes
              const dogma = data.dogma_attributes || [];
              const rankAttr = dogma.find((d: any) => d.attribute_id === RANK_ATTR_ID);
              const primAttr = dogma.find((d: any) => d.attribute_id === PRIMARY_ATTR_ID);
              const secAttr = dogma.find((d: any) => d.attribute_id === SECONDARY_ATTR_ID);

              if (!rankAttr || !primAttr || !secAttr) return null; // Not a trainable skill?

              return {
                id: data.type_id,
                name: data.name,
                group_id: groupId,
                description: data.description,
                rank: rankAttr.value,
                primary_attribute: ATTR_MAP[primAttr.value as number] || 'intelligence',
                secondary_attribute: ATTR_MAP[secAttr.value as number] || 'memory',
              } as Skill;
            } catch (e) {
              console.warn(`Failed to fetch skill ${id}`, e);
              return null;
            }
          })
        );

        const validSkills = results.filter((s): s is Skill => s !== null);
        skills.push(...validSkills);
        
        processed += batch.length;
        if (onProgress) onProgress(processed, total);
      }

      // 4. Cache Result
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: skills
      }));

      return skills;

    } catch (error) {
      console.error("Critical ESI Error:", error);
      throw error;
    }
  }
};

