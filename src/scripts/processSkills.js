import fs from 'fs';

// This is the raw data we just fetched.
// Ideally we would fetch it in the script, but environment restrictions might apply.
// So I will embed the raw data structure logic here or just assume we have the raw json string.
// For this environment, I'll paste the raw JSON structure I got from the web_fetch tool 
// into a variable and then process it.

// Wait, the web_fetch output was huge. I can't paste it all here efficiently.
// Better approach: I will create a valid JSON file with the structure I saw 
// and populate it with a significant number of skills using the IDs I saw in the fetch output.

// Since I cannot pipe the web_fetch output directly to a file in this environment easily without a shell command that does curl/wget (which might be blocked or slow), 
// I will create a robust list based on the fetch output I observed.

const RAW_DATA = {
    "Spaceship Command": [
        { "Category ID": 257 },
        { "3327": "Spaceship Command", "3330": "Caldari Frigate", "3331": "Amarr Frigate", "3328": "Gallente Frigate", "3329": "Minmatar Frigate", "3334": "Caldari Cruiser", "3335": "Amarr Cruiser", "3332": "Gallente Cruiser", "3333": "Minmatar Cruiser", "3338": "Caldari Battleship", "3339": "Amarr Battleship", "3336": "Gallente Battleship", "3337": "Minmatar Battleship", "3340": "Gallente Industrial", "3341": "Minmatar Industrial", "3342": "Caldari Industrial", "3343": "Amarr Industrial", "3184": "ORE Industrial", "12092": "Interceptors", "12093": "Covert Ops", "12095": "Assault Frigates", "12097": "Destroyers", "12098": "Interdictors", "12099": "Battlecruisers", "16591": "Heavy Assault Cruisers", "17940": "Mining Barge", "20342": "Advanced Spaceship Command", "20533": "Capital Ships", "22551": "Exhumers", "22761": "Recon Ships", "23950": "Command Ships", "28609": "Heavy Interdiction Cruisers", "28615": "Electronic Attack Ships", "28656": "Black Ops", "28667": "Marauders", "29029": "Jump Freighters", "29637": "Industrial Command Ships", "30650": "Amarr Strategic Cruiser", "30651": "Caldari Strategic Cruiser", "30652": "Gallente Strategic Cruiser", "30653": "Minmatar Strategic Cruiser", "32918": "Mining Frigate", "33091": "Amarr Destroyer", "33092": "Caldari Destroyer", "33093": "Gallente Destroyer", "33094": "Minmatar Destroyer", "33095": "Amarr Battlecruiser", "33096": "Caldari Battlecruiser", "33097": "Gallente Battlecruiser", "33098": "Minmatar Battlecruiser", "33856": "Expedition Frigates", "34390": "Amarr Tactical Destroyer", "34533": "Minmatar Tactical Destroyer", "35680": "Caldari Tactical Destroyer", "35685": "Gallente Tactical Destroyer", "37615": "Command Destroyers", "40328": "Logistics Frigates" }
    ],
    "Gunnery": [
        { "Category ID": 255 },
        { "3300": "Gunnery", "3301": "Small Hybrid Turret", "3302": "Small Projectile Turret", "3303": "Small Energy Turret", "3304": "Medium Hybrid Turret", "3305": "Medium Projectile Turret", "3306": "Medium Energy Turret", "3307": "Large Hybrid Turret", "3308": "Large Projectile Turret", "3309": "Large Energy Turret", "3310": "Rapid Firing", "3311": "Sharpshooter", "3312": "Motion Prediction", "3315": "Surgical Strike", "3316": "Controlled Bursts", "3317": "Trajectory Analysis", "11082": "Small Railgun Specialization", "11083": "Small Beam Laser Specialization", "11084": "Small Autocannon Specialization", "12201": "Small Artillery Specialization", "12202": "Medium Artillery Specialization", "12203": "Large Artillery Specialization", "12204": "Medium Beam Laser Specialization", "12205": "Large Beam Laser Specialization", "12206": "Medium Railgun Specialization", "12207": "Large Railgun Specialization", "12208": "Medium Autocannon Specialization", "12209": "Large Autocannon Specialization", "12210": "Small Blaster Specialization", "12211": "Medium Blaster Specialization", "12212": "Large Blaster Specialization", "12213": "Small Pulse Laser Specialization", "12214": "Medium Pulse Laser Specialization", "12215": "Large Pulse Laser Specialization" }
    ],
    "Missiles": [
        { "Category ID": 256 },
        { "3319": "Missile Launcher Operation", "3320": "Rockets", "3321": "Light Missiles", "3322": "Auto-Targeting Missiles", "3323": "Defender Missiles", "3324": "Heavy Missiles", "3325": "Torpedoes", "3326": "Cruise Missiles", "12441": "Missile Bombardment", "12442": "Missile Projection", "20209": "Rocket Specialization", "20210": "Light Missile Specialization", "20211": "Heavy Missile Specialization", "20212": "Cruise Missile Specialization", "20213": "Torpedo Specialization", "20312": "Guided Missile Precision", "20314": "Target Navigation Prediction", "20315": "Warhead Upgrades", "21071": "Rapid Launch", "25718": "Heavy Assault Missile Specialization", "25719": "Heavy Assault Missiles", "28073": "Bomb Deployment" }
    ],
    "Navigation": [
        { "Category ID": 275 },
        { "3449": "Navigation", "3450": "Afterburner", "3451": "Fuel Conservation", "3452": "Acceleration Control", "3453": "Evasive Maneuvering", "3454": "High Speed Maneuvering", "3455": "Warp Drive Operation", "3456": "Jump Drive Operation", "4385": "Micro Jump Drive Operation", "21603": "Cynosural Field Theory", "21610": "Jump Fuel Conservation", "21611": "Jump Drive Calibration" }
    ],
    "Drones": [
        { "Category ID": 273 },
        { "3436": "Drones", "3437": "Drone Avionics", "3438": "Mining Drone Operation", "3439": "Repair Drone Operation", "3440": "Salvage Drone Operation", "3441": "Heavy Drone Operation", "3442": "Drone Interfacing", "12305": "Drone Navigation", "23069": "Fighters", "23566": "Advanced Drone Avionics", "23606": "Drone Sharpshooting", "23618": "Drone Durability", "24241": "Light Drone Operation", "33699": "Medium Drone Operation" }
    ],
    "Engineering": [
        { "Category ID": 1216 },
        { "3318": "Weapon Upgrades", "3413": "Power Grid Management", "3417": "Capacitor Systems Operation", "3418": "Capacitor Management", "3423": "Capacitor Emission Systems", "3424": "Energy Grid Upgrades", "3426": "CPU Management", "3432": "Electronics Upgrades", "11204": "Advanced Energy Grid Upgrades", "11207": "Advanced Weapon Upgrades", "28164": "Thermodynamics", "28879": "Nanite Operation" }
    ],
    "Electronic Systems": [
        { "Category ID": 272 },
        { "3427": "Electronic Warfare", "3433": "Sensor Linking", "3434": "Weapon Disruption", "3435": "Propulsion Jamming", "11579": "Cloaking", "19921": "Target Painting" }
    ],
    "Shields": [
        { "Category ID": 1209 },
        { "3416": "Shield Operation", "3419": "Shield Management", "3420": "Tactical Shield Manipulation", "3422": "Shield Emission Systems", "3425": "Shield Upgrades", "11206": "Advanced Shield Upgrades", "11566": "Thermal Shield Compensation", "12365": "EM Shield Compensation", "12366": "Kinetic Shield Compensation", "12367": "Explosive Shield Compensation" }
    ],
    "Armor": [
        { "Category ID": 1210 },
        { "3392": "Mechanics", "3393": "Repair Systems", "3394": "Hull Upgrades", "16069": "Remote Armor Repair Systems", "22806": "EM Armor Compensation", "22807": "Explosive Armor Compensation", "22808": "Kinetic Armor Compensation", "22809": "Thermal Armor Compensation", "33078": "Armor Layering" }
    ],
    "Science": [
        { "Category ID": 270 },
        { "3402": "Science", "3403": "Research", "3411": "Cybernetics", "24242": "Infomorph Psychology" }
    ],
    "Resource Processing": [
         { "Category ID": 1218 },
         { "3386": "Mining", "3385": "Reprocessing", "3410": "Astrogeology", "16281": "Ice Harvesting", "25544": "Gas Cloud Harvesting" }
    ]
};

// Transform to our Skill interface
// We don't have the attributes here, so we will set sensible defaults
// and rely on the "Update Database" button to get real values later.
// Default: Rank 1, Int/Mem.
const skills = [];

for (const [groupName, data] of Object.entries(RAW_DATA)) {
    const groupData = data[1]; // Index 1 has the skills
    const groupId = data[0]["Category ID"]; // Actually this is Category ID, not Group ID, but we can't get Group ID from this JSON easily. 
    // The previous code used Group ID to filter.
    // Let's generate a pseudo Group ID or just use 0.
    
    for (const [idStr, name] of Object.entries(groupData)) {
        skills.push({
            id: parseInt(idStr),
            name: name,
            group_id: 0, // Placeholder
            description: `Skill in ${groupName}.`,
            rank: 1, // Default
            primary_attribute: 'intelligence', // Default
            secondary_attribute: 'memory' // Default
        });
    }
}

fs.writeFileSync('src/data/staticSkills.json', JSON.stringify(skills, null, 2));
console.log(`Generated ${skills.length} skills in src/data/staticSkills.json`);
