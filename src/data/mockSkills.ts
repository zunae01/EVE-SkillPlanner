import { Skill, SkillGroup } from '../types';

export const SKILL_GROUPS: SkillGroup[] = [
  { id: 255, name: 'Gunnery' },
  { id: 256, name: 'Missiles' },
  { id: 257, name: 'Spaceship Command' },
  { id: 258, name: 'Navigation' },
  { id: 266, name: 'Corporation Management' },
  { id: 268, name: 'Production' },
  { id: 269, name: 'Rigging' },
  { id: 270, name: 'Science' },
  { id: 272, name: 'Electronic Systems' },
  { id: 273, name: 'Drones' },
  { id: 274, name: 'Trade' },
  { id: 275, name: 'Navigation' },
  { id: 278, name: 'Social' },
];

export const MOCK_SKILLS: Skill[] = [
  // Spaceship Command
  { id: 3330, name: 'Caldari Frigate', group_id: 257, rank: 2, description: 'Operation of Caldari Frigates.', primary_attribute: 'perception', secondary_attribute: 'willpower' },
  { id: 3331, name: 'Minmatar Frigate', group_id: 257, rank: 2, description: 'Operation of Minmatar Frigates.', primary_attribute: 'perception', secondary_attribute: 'willpower' },
  { id: 3328, name: 'Gallente Frigate', group_id: 257, rank: 2, description: 'Operation of Gallente Frigates.', primary_attribute: 'perception', secondary_attribute: 'willpower' },
  { id: 3329, name: 'Amarr Frigate', group_id: 257, rank: 2, description: 'Operation of Amarr Frigates.', primary_attribute: 'perception', secondary_attribute: 'willpower' },
  { id: 3334, name: 'Caldari Cruiser', group_id: 257, rank: 5, description: 'Operation of Caldari Cruisers.', primary_attribute: 'perception', secondary_attribute: 'willpower' },
  { id: 3335, name: 'Amarr Cruiser', group_id: 257, rank: 5, description: 'Operation of Amarr Cruisers.', primary_attribute: 'perception', secondary_attribute: 'willpower' },
  { id: 3338, name: 'Caldari Battleship', group_id: 257, rank: 8, description: 'Operation of Caldari Battleships.', primary_attribute: 'perception', secondary_attribute: 'willpower' },
  
  // Navigation
  { id: 3436, name: 'Drones', group_id: 273, rank: 1, description: 'Operation of drones.', primary_attribute: 'memory', secondary_attribute: 'perception' },
  { id: 3437, name: 'Light Drone Operation', group_id: 273, rank: 1, description: 'Operation of light drones.', primary_attribute: 'memory', secondary_attribute: 'perception' },
  { id: 3439, name: 'Heavy Drone Operation', group_id: 273, rank: 5, description: 'Operation of heavy drones.', primary_attribute: 'memory', secondary_attribute: 'perception' },

  // Gunnery
  { id: 3300, name: 'Gunnery', group_id: 255, rank: 1, description: 'Basic operation of turrets.', primary_attribute: 'perception', secondary_attribute: 'willpower' },
  { id: 3301, name: 'Small Hybrid Turret', group_id: 255, rank: 1, description: 'Operation of small hybrid turrets.', primary_attribute: 'perception', secondary_attribute: 'willpower' },
  { id: 3302, name: 'Small Projectile Turret', group_id: 255, rank: 1, description: 'Operation of small projectile turrets.', primary_attribute: 'perception', secondary_attribute: 'willpower' },
  { id: 3303, name: 'Small Energy Turret', group_id: 255, rank: 1, description: 'Operation of small energy turrets.', primary_attribute: 'perception', secondary_attribute: 'willpower' },
  { id: 3304, name: 'Medium Hybrid Turret', group_id: 255, rank: 3, description: 'Operation of medium hybrid turrets.', primary_attribute: 'perception', secondary_attribute: 'willpower' },

  // Missiles
  { id: 3320, name: 'Missile Launcher Operation', group_id: 256, rank: 1, description: 'Basic operation of missile launchers.', primary_attribute: 'perception', secondary_attribute: 'willpower' },
  { id: 3321, name: 'Light Missiles', group_id: 256, rank: 2, description: 'Operation of light missile launchers.', primary_attribute: 'perception', secondary_attribute: 'willpower' },
  { id: 3324, name: 'Heavy Missiles', group_id: 256, rank: 3, description: 'Operation of heavy missile launchers.', primary_attribute: 'perception', secondary_attribute: 'willpower' },

  // Science
  { id: 3402, name: 'Science', group_id: 270, rank: 1, description: 'Basic understanding of scientific principles.', primary_attribute: 'intelligence', secondary_attribute: 'memory' },
  { id: 3411, name: 'Cybernetics', group_id: 270, rank: 3, description: 'Use of cybernetic implants.', primary_attribute: 'intelligence', secondary_attribute: 'memory' },
  { id: 24311, name: 'Multitasking', group_id: 272, rank: 3, description: 'Allows targeting of multiple opponents.', primary_attribute: 'intelligence', secondary_attribute: 'memory' },
];
