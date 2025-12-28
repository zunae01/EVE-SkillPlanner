import axios from 'axios';

const ESI_BASE = 'https://esi.evetech.net/latest';

interface EFTLine {
  original: string;
  itemName: string;
  isShip: boolean;
  quantity: number;
}

interface Requirement {
  skillId: number;
  level: number;
  type: 'direct' | 'prerequisite'; // Direct requirement of the fit, or prereq of a skill
  sourceName: string; // "Caldari Frigate" or "Small Hybrid Turret"
}

// Map attribute IDs to requirement slots
// 182 = Required Skill 1, 277 = Level 1
// 183 = Required Skill 2, 278 = Level 2
// 184 = Required Skill 3, 279 = Level 3
// 1285 = Required Skill 4, 1286 = Level 4
// 1289 = Required Skill 5, 1290 = Level 5
// 1287 = Required Skill 6, 1288 = Level 6
const REQ_MAP = [
  { skill: 182, level: 277 },
  { skill: 183, level: 278 },
  { skill: 184, level: 279 },
  { skill: 1285, level: 1286 },
  { skill: 1289, level: 1290 },
  { skill: 1287, level: 1288 },
];

export const EFTParser = {
  parse(text: string): EFTLine[] {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return [];

    const result: EFTLine[] = [];

    // First line: [Ship Name, Fit Name]
    const firstLine = lines[0];
    if (firstLine.startsWith('[') && firstLine.endsWith(']')) {
      const content = firstLine.slice(1, -1);
      const [shipName] = content.split(',');
      result.push({
        original: firstLine,
        itemName: shipName.trim(),
        isShip: true,
        quantity: 1
      });
    }

    // Rest
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('[Empty') || line.includes('[Empty')) continue; // Skip empty slots

      // Remove ammo/charge info: "Module Name, Ammo Name" -> "Module Name"
      let cleanName = line.split(',')[0].trim();
      
      // Handle multiplier: "Drone Name x5" (But be careful of names ending in x5? Unlikely in EVE)
      // Actually standard EFT is "Drone x5" at end of line usually
      // Regex looking for " x\d+$"
      const qtyMatch = cleanName.match(/ x(\d+)$/);
      let quantity = 1;
      if (qtyMatch) {
          quantity = parseInt(qtyMatch[1]);
          cleanName = cleanName.replace(/ x\d+$/, '').trim();
      }

      result.push({
        original: line,
        itemName: cleanName,
        isShip: false,
        quantity
      });
    }

    return result;
  },

  async resolveItemIds(names: string[]): Promise<Record<string, number>> {
    // POST /universe/ids/
    // Max 1000 names (we fit comfortably)
    const uniqueNames = [...new Set(names)];
    if (uniqueNames.length === 0) return {};

    try {
      const res = await axios.post(`${ESI_BASE}/universe/ids/`, uniqueNames);
      const mapping: Record<string, number> = {};
      
      if (res.data.inventory_types) {
        res.data.inventory_types.forEach((item: any) => {
          mapping[item.name] = item.id;
        });
      }
      // Ships might be in "inventory_types" too? Yes.
      
      return mapping;
    } catch (e) {
      console.error("Failed to resolve IDs", e);
      return {};
    }
  },

  async getRequirements(typeId: number): Promise<Requirement[]> {
    try {
      // We need dogma attributes. 
      // We can use the cached fetch from ESIService if we exposed it, but we need raw dogma here.
      // Let's verify if ESIService.fetchAllSkills fetches dogma? It does for *Skills*.
      // But we need it for *Items* (Modules/Ships).
      
      const res = await axios.get(`${ESI_BASE}/universe/types/${typeId}/`);
      const dogma = res.data.dogma_attributes || [];
      
      const reqs: Requirement[] = [];

      REQ_MAP.forEach(pair => {
        const skillAttr = dogma.find((d: any) => d.attribute_id === pair.skill);
        const levelAttr = dogma.find((d: any) => d.attribute_id === pair.level);

        if (skillAttr && levelAttr) {
           reqs.push({
             skillId: Math.round(skillAttr.value),
             level: Math.round(levelAttr.value),
             type: 'direct',
             sourceName: res.data.name
           });
        }
      });
      
      return reqs;

    } catch (e) {
      console.warn(`Failed requirements for ${typeId}`);
      return [];
    }
  },

  async analyzeFit(text: string, trainedSkills: Record<number, number>): Promise<{ missing: Requirement[], allReqs: Requirement[] }> {
    const lines = this.parse(text);
    const names = lines.map(l => l.itemName);
    const idMap = await this.resolveItemIds(names);
    
    // 1. Get Direct Requirements
    // Use Promise.all but maybe limit concurrency if fit is huge? 
    // Browsers handle ~6 concurrent. 20 items = fast enough.
    const directReqs: Requirement[] = [];
    
    // We only check unique type IDs to save requests
    const uniqueIds = [...new Set(Object.values(idMap))];
    
    await Promise.all(uniqueIds.map(async (id) => {
       const reqs = await this.getRequirements(id);
       directReqs.push(...reqs);
    }));

    // 2. Resolve Prerequisites Recursively
    // We need a loop that keeps finding prerequisites until no new ones are found.
    const allReqsMap = new Map<string, Requirement>(); // Key: "skillId-level"
    
    // Helper to add
    const addReq = (r: Requirement) => {
        const key = `${r.skillId}-${r.level}`;
        if (!allReqsMap.has(key)) {
            allReqsMap.set(key, r);
            return true; // Added new
        }
        // If existing is lower level, update? 
        // Actually we want distinct entries for "Skill IV" vs "Skill V" usually in calculation?
        // But for "Do I have this?", checking Skill V covers Skill IV.
        return false;
    };

    const toProcess = [...directReqs];
    const processedSkillIds = new Set<number>();

    while (toProcess.length > 0) {
        const req = toProcess.shift()!;
        addReq(req);

        // If we haven't checked this skill's prerequisites yet...
        if (!processedSkillIds.has(req.skillId)) {
            processedSkillIds.add(req.skillId);
            const skillPrereqs = await this.getRequirements(req.skillId);
            
            // Mark these as "prerequisite" type
            const subReqs = skillPrereqs.map(sr => ({
                ...sr,
                type: 'prerequisite' as const,
                sourceName: `Prerequisite for Skill ${req.skillId}` // Ideally resolve name
            }));
            
            toProcess.push(...subReqs);
        }
    }

    // 3. Compare with Trained
    const missing: Requirement[] = [];
    
    // Sort logic: 
    // We want to list missing levels.
    // If I need Gunner IV, and I have Gunner I. I am missing II, III, IV.
    // The allReqsMap contains "Gunnery 1", "Gunnery 5" etc.
    // We iterate all requirements found.
    
    for (const req of allReqsMap.values()) {
        const current = trainedSkills[req.skillId] || 0;
        if (current < req.level) {
            missing.push(req);
        }
    }

    // 4. Clean up / Expand Missing Levels
    // If "Gunnery 5" is missing, and "Gunnery 4" is missing.
    // We should ensure we list them.
    // The recursive fetcher gets requirements. "Gunnery 5" might NOT explicitly require "Gunnery 4" in dogma.
    // Usually Skill Level X requires Skill Level X-1? No, EVE dogma usually defines *other* skills.
    // Implicitly, to get to L5 you need L4.
    // So for every missing Requirement (Skill S, Level L), if we have Level C.
    // We need to add (C+1)...L. 
    
    const finalMissing: Requirement[] = [];
    const missingKeys = new Set<string>();

    for (const req of missing) {
        const current = trainedSkills[req.skillId] || 0;
        // Add all intermediate steps
        for (let l = current + 1; l <= req.level; l++) {
             const key = `${req.skillId}-${l}`;
             if (!missingKeys.has(key)) {
                 finalMissing.push({
                     ...req,
                     level: l,
                     // If it was a deep prereq, keep that. If direct, keep that.
                 });
                 missingKeys.add(key);
             }
        }
    }

    // Finally sort them: Prereqs first? Low levels first?
    // We'll let the UI or the Store sorter handle strict topological sort?
    // For now, simple sort: Skill ID then Level.
    finalMissing.sort((a, b) => {
        if (a.skillId !== b.skillId) return a.skillId - b.skillId;
        return a.level - b.level;
    });

    return {
        missing: finalMissing,
        allReqs: Array.from(allReqsMap.values())
    };
  }
};
