import { EquipmentManager } from '../equipment/equipmentManager.js'
import { ITEM_EFFECT_TYPE } from '../items/itemConstants.js'
import { PROFICIENCY_NAMES } from '../data/characterCreation.js'
import { calculateProficiency } from '../skills/proficiencySystem.js'

const resistanceKeys = Object.freeze(['fire', 'cold', 'poison', 'magic', 'blunt', 'piercing', 'slashing'])
const emptyResistances = () => Object.fromEntries(resistanceKeys.map((key) => [key, 0]))
const combatWeapon = (item) => item ? { id: item.id, displayName: item.displayName, baseDamage: item.weaponStats.baseDamage, damageType: item.weaponStats.damageType, weaponCategory: item.weaponStats.weaponCategory, handsRequired: item.weaponStats.handsRequired, requiredAttribute: 'strength', requiredAttributeValue: item.requirements.find(({ attribute }) => attribute === 'strength')?.minimum ?? 0, requiredProficiency: item.proficiency, combatSkills: [] } : null

export function calculateCharacterStats(character, { passiveModifiers = [], temporaryEffects = [], worldEffects = [] } = {}) {
  const equipmentManager = new EquipmentManager(character)
  const equippedItems = equipmentManager.getEquippedItems()
  const finalStats = { ...character.stats }
  const resistances = emptyResistances()
  let armorRating = 0; let maximumHpBonus = 0
  const equipmentEffects = equippedItems.flatMap(({ item }) => item.effects)
  for (const { item } of equippedItems) if (item.armorStats) {
    armorRating += item.armorStats.armorRating ?? 0; maximumHpBonus += item.armorStats.maximumHpBonus ?? 0
    for (const key of resistanceKeys) resistances[key] += item.armorStats.resistances?.[key] ?? 0
  }
  const modifierPipeline = [equipmentEffects, passiveModifiers, temporaryEffects, worldEffects]
  for (const effects of modifierPipeline) for (const effect of effects) {
    if (effect.type === ITEM_EFFECT_TYPE.MODIFY_ATTRIBUTE && effect.attribute in finalStats) finalStats[effect.attribute] += effect.amount ?? 0
    if (effect.type === ITEM_EFFECT_TYPE.MODIFY_ARMOR_RATING) armorRating += effect.amount ?? 0
    if (effect.type === ITEM_EFFECT_TYPE.MODIFY_RESISTANCE && effect.resistance in resistances) resistances[effect.resistance] += effect.amount ?? 0
    if (effect.type === ITEM_EFFECT_TYPE.MODIFY_MAXIMUM_HP) maximumHpBonus += effect.amount ?? 0
  }
  const weaponEntry = equipmentManager.getEquippedWeapon()
  const legacyWeapon = character.startingWeapon ? { ...character.startingWeapon } : null
  const equippedWeapon = weaponEntry ? combatWeapon(weaponEntry.item) : legacyWeapon
  const proficiencyValues = Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, calculateProficiency(character, name, { equipmentEffects, temporaryEffects })]))
  return { baseStats: { ...character.stats }, finalStats, proficiencyValues, armorRating, resistances, maximumHealth: character.health.max + maximumHpBonus, equipmentEffects, equippedItems, equippedWeapon, weaponCategory: weaponEntry?.item.weaponStats.weaponCategory ?? legacyWeapon?.weaponType ?? null, activeLightSource: equipmentEffects.find(({ type }) => type === ITEM_EFFECT_TYPE.GRANT_LIGHT_SOURCE)?.lightSourceId ?? null }
}
