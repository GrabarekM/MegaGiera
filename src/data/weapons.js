const createWeapon = ({ id, displayName, weaponType, requiredAttribute, requiredAttributeValue, requiredProficiency, combatSkills, description }) => Object.freeze({
  id, displayName, weaponType, requiredAttribute, requiredAttributeValue, requiredProficiency,
  baseDamage: 0, combatSkills: Object.freeze(combatSkills), description, rarity: 'Common', value: 2,
})

export const WEAPON_LIST = Object.freeze([
  createWeapon({ id: 'wooden_club', displayName: 'Wooden Club', weaponType: 'Club', requiredAttribute: 'might', requiredAttributeValue: 2, requiredProficiency: 'Mace Fighting', combatSkills: ['player_strike', 'player_heavy_strike'], description: 'A crude but dependable wooden bludgeon.' }),
  createWeapon({ id: 'broken_axe', displayName: 'Broken Axe', weaponType: 'Axe', requiredAttribute: 'might', requiredAttributeValue: 3, requiredProficiency: 'Mace Fighting', combatSkills: ['player_strike', 'player_heavy_strike'], description: 'A damaged axe that still carries considerable weight.' }),
  createWeapon({ id: 'wooden_shield', displayName: 'Wooden Shield', weaponType: 'Shield', requiredAttribute: 'defense', requiredAttributeValue: 2, requiredProficiency: 'Parry', combatSkills: ['player_strike', 'player_guard'], description: 'A light shield suitable for basic defensive fighting.' }),
  createWeapon({ id: 'rusty_shield', displayName: 'Rusty Shield', weaponType: 'Shield', requiredAttribute: 'defense', requiredAttributeValue: 3, requiredProficiency: 'Parry', combatSkills: ['player_strike', 'player_guard'], description: 'A battered metal shield with a reinforced rim.' }),
  createWeapon({ id: 'walking_staff', displayName: 'Walking Staff', weaponType: 'Staff', requiredAttribute: 'vitality', requiredAttributeValue: 2, requiredProficiency: 'Mace Fighting', combatSkills: ['player_strike', 'player_guard'], description: 'A balanced staff useful both on the road and in a fight.' }),
  createWeapon({ id: 'quarterstaff', displayName: 'Quarterstaff', weaponType: 'Staff', requiredAttribute: 'vitality', requiredAttributeValue: 3, requiredProficiency: 'Mace Fighting', combatSkills: ['player_strike', 'player_guard'], description: 'A sturdy two-handed fighting staff.' }),
  createWeapon({ id: 'rusty_dagger', displayName: 'Rusty Dagger', weaponType: 'Dagger', requiredAttribute: 'agility', requiredAttributeValue: 2, requiredProficiency: 'Fencing', combatSkills: ['player_quick_strike', 'player_strike'], description: 'A quick blade with a badly weathered edge.' }),
  createWeapon({ id: 'short_knife', displayName: 'Short Knife', weaponType: 'Knife', requiredAttribute: 'agility', requiredAttributeValue: 2, requiredProficiency: 'Swordsmanship', combatSkills: ['player_quick_strike', 'player_strike'], description: 'A small practical knife adapted for close combat.' }),
  createWeapon({ id: 'cracked_wand', displayName: 'Cracked Wand', weaponType: 'Wand', requiredAttribute: 'magicPower', requiredAttributeValue: 2, requiredProficiency: 'Magery', combatSkills: ['player_quick_strike', 'player_strike'], description: 'A damaged focus that can still channel simple magic.' }),
  createWeapon({ id: 'old_spellbook', displayName: 'Old Spellbook', weaponType: 'Spellbook', requiredAttribute: 'magicPower', requiredAttributeValue: 3, requiredProficiency: 'Magery', combatSkills: ['player_strike', 'player_guard'], description: 'A worn collection of basic combat incantations.' }),
  createWeapon({ id: 'pilgrim_staff', displayName: 'Pilgrim Staff', weaponType: 'Mystic Staff', requiredAttribute: 'wisdom', requiredAttributeValue: 2, requiredProficiency: 'Mysticism', combatSkills: ['player_strike', 'player_guard'], description: 'A simple staff marked with old pilgrim symbols.' }),
  createWeapon({ id: 'wooden_totem', displayName: 'Wooden Totem', weaponType: 'Totem', requiredAttribute: 'wisdom', requiredAttributeValue: 2, requiredProficiency: 'Mysticism', combatSkills: ['player_quick_strike', 'player_guard'], description: 'A carved focus carrying faint spiritual power.' }),
])

export const WEAPONS = Object.freeze(Object.fromEntries(WEAPON_LIST.map((weapon) => [weapon.id, weapon])))
