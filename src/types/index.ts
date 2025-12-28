export interface Skill {
  id: number;
  name: string;
  group_id: number;
  description: string;
  rank: number;
  primary_attribute: 'intelligence' | 'memory' | 'charisma' | 'perception' | 'willpower';
  secondary_attribute: 'intelligence' | 'memory' | 'charisma' | 'perception' | 'willpower';
}

export interface SkillGroup {
  id: number;
  name: string;
}

export interface QueueItem {
  id: string; // unique instance id for the queue
  skill_id: number;
  level: 1 | 2 | 3 | 4 | 5;
  skill: Skill;
}

export interface CharacterAttributes {
  intelligence: number;
  memory: number;
  charisma: number;
  perception: number;
  willpower: number;
}
