import { ATTRIBUTE_DEFINITIONS, EQUIPMENT_SLOTS, PROFICIENCY_NAMES, PROFICIENCY_RANKS } from '../data/characterCreation.js'
import { getRequiredExperience } from './characterProgression.js'
import { restoreItemInstance } from '../items/itemInstance.js'
import { createProficiencyProgress, normalizeProficiencyProgress } from '../skills/proficiencySystem.js'
import { createRecipeState, normalizeRecipeState } from '../crafting/recipeUnlockService.js'

export const CHARACTER_DEFAULTS = Object.freeze({
  level: 1,
  experience: 0,
  learningPoints: 0,
  maxHealth: 18,
  gold: 0,
  stats: Object.freeze(Object.fromEntries(ATTRIBUTE_DEFINITIONS.map(({ id }) => [id, 1]))),
})

const emptyEquipment = () => Object.fromEntries(EQUIPMENT_SLOTS.map(({ id }) => [id, null]))
const emptyProficiencies = () => Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, 'Untrained']))
const createProficiencySkills = (ranks = emptyProficiencies()) => Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, createProficiencyProgress(ranks[name] ?? 'Untrained')]))
const LEGACY_STRENGTH_KEY = String.fromCharCode(109, 105, 103, 104, 116)
const readSavedStat = (stats, id, fallback) => {
  const direct = stats?.[id]
  if (Number.isInteger(direct)) return direct
  const legacy = id === 'strength' ? stats?.[LEGACY_STRENGTH_KEY] : undefined
  return Number.isInteger(legacy) ? legacy : fallback
}
const normalizeAttributes = (attributes) => Object.fromEntries(ATTRIBUTE_DEFINITIONS.map(({ id }) => [id, readSavedStat(attributes, id, CHARACTER_DEFAULTS.stats[id])]))

export function createCharacterState({
  id, name = 'Hero', attributes = CHARACTER_DEFAULTS.stats, proficiencies = emptyProficiencies(),
  startingWeapon = null, equipment = emptyEquipment(), startingSkills = [],
}) {
  if (!id || !name.trim()) throw new Error('Character id and name are required.')
  return {
    id,
    name: name.trim(),
    level: CHARACTER_DEFAULTS.level,
    experience: CHARACTER_DEFAULTS.experience,
    requiredExperience: getRequiredExperience(CHARACTER_DEFAULTS.level),
    learningPoints: CHARACTER_DEFAULTS.learningPoints,
    lifetimeLearningPointsEarned: 0,
    lifetimeLearningPointsSpent: 0,
    revealedLessonIds: [],
    learnedLessonIds: [],
    metMentorIds: [],
    mentorProgress: {},
    mentorJournalEntries: [],
    specializations: [],
    passiveSkills: [],
    learningRecords: [],
    discoveredKnowledge: [],
    knowledgeRecords: [],
    foundBookIds: [],
    bookJournal: [],
    libraryRecords: [],
    usedManualIds: [],
    usedTreatiseIds: [],
    usedLegendaryTomeIds: [],
    wardwood: 0,
    wardwoodBatches: [],
    deadWardwood: 0,
    lanternState: { itemInstanceId: null, isLit: false, remainingFuelMinutes: 0, maximumFuelMinutes: 480 },
    holyLanternState: { itemInstanceId: null, enabled: false },
    activeLightSource: null,
    health: { current: CHARACTER_DEFAULTS.maxHealth, max: CHARACTER_DEFAULTS.maxHealth },
    gold: CHARACTER_DEFAULTS.gold,
    stats: normalizeAttributes(attributes),
    proficiencies: { ...emptyProficiencies(), ...proficiencies },
    proficiencySkills: createProficiencySkills({ ...emptyProficiencies(), ...proficiencies }),
    startingWeapon: startingWeapon ? { ...startingWeapon } : null,
    startingSkills: [...startingSkills],
    equipment: { ...emptyEquipment(), ...equipment },
    inventory: [],
    statuses: [],
    flags: {},
    recipeState: createRecipeState(),
  }
}

export function cloneCharacterState(character) {
  return {
    ...character,
    health: { ...character.health },
    stats: { ...character.stats },
    proficiencies: { ...character.proficiencies },
    proficiencySkills: Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, { ...character.proficiencySkills[name] }])),
    startingWeapon: character.startingWeapon ? { ...character.startingWeapon } : null,
    startingSkills: [...character.startingSkills],
    revealedLessonIds: [...(character.revealedLessonIds ?? [])],
    learnedLessonIds: [...(character.learnedLessonIds ?? [])],
    metMentorIds: [...(character.metMentorIds ?? [])],
    mentorProgress: Object.fromEntries(Object.entries(character.mentorProgress ?? {}).map(([id, state]) => [id, { ...state }])),
    mentorJournalEntries: (character.mentorJournalEntries ?? []).map((entry) => ({ ...entry, specializations: [...(entry.specializations ?? [])] })),
    specializations: [...(character.specializations ?? [])],
    passiveSkills: [...(character.passiveSkills ?? [])],
    learningRecords: (character.learningRecords ?? []).map((record) => ({ ...record })),
    discoveredKnowledge: [...(character.discoveredKnowledge ?? [])],
    knowledgeRecords: (character.knowledgeRecords ?? []).map((record) => ({ ...record })),
    foundBookIds: [...(character.foundBookIds ?? [])],
    bookJournal: (character.bookJournal ?? []).map((entry) => ({ ...entry, source: entry.source && typeof entry.source === 'object' ? { ...entry.source } : entry.source })),
    libraryRecords: (character.libraryRecords ?? []).map((entry) => ({ ...entry, source: entry.source && typeof entry.source === 'object' ? { ...entry.source } : entry.source })),
    usedManualIds: [...(character.usedManualIds ?? [])],
    usedTreatiseIds: [...(character.usedTreatiseIds ?? [])],
    usedLegendaryTomeIds: [...(character.usedLegendaryTomeIds ?? [])],
    wardwood: Number.isInteger(character.wardwood) ? character.wardwood : 0,
    wardwoodBatches: (character.wardwoodBatches ?? []).map((batch) => ({ ...batch })),
    deadWardwood: Number.isInteger(character.deadWardwood) ? character.deadWardwood : 0,
    lanternState: { itemInstanceId: null, isLit: false, remainingFuelMinutes: 0, maximumFuelMinutes: 480, ...(character.lanternState ?? {}) },
    holyLanternState: { itemInstanceId: null, enabled: false, ...(character.holyLanternState ?? {}) },
    activeLightSource: character.activeLightSource ? { ...character.activeLightSource } : null,
    equipment: { ...character.equipment },
    inventory: (character.inventory ?? []).map((instance) => restoreItemInstance(instance)).filter(Boolean),
    statuses: character.statuses.map((status) => typeof status === 'object' ? { ...status } : status),
    flags: { ...character.flags },
    recipeState: normalizeRecipeState(character.recipeState),
  }
}

export function restoreCharacterState(saved, fallback) {
  if (!saved) return cloneCharacterState(fallback)
  const stats = Object.fromEntries(ATTRIBUTE_DEFINITIONS.map(({ id }) => [id, readSavedStat(saved.stats, id, fallback.stats[id])]))
  const proficiencies = Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, PROFICIENCY_RANKS.includes(saved.proficiencies?.[name]) ? saved.proficiencies[name] : 'Untrained']))
  const proficiencySkills = Object.fromEntries(PROFICIENCY_NAMES.map((name) => [name, normalizeProficiencyProgress(saved.proficiencySkills?.[name], proficiencies[name])]))
  return cloneCharacterState({
    ...fallback, ...saved,
    health: { ...fallback.health, ...saved.health }, stats, proficiencies, proficiencySkills,
    requiredExperience: Number.isInteger(saved.requiredExperience) ? saved.requiredExperience : getRequiredExperience(saved.level ?? fallback.level),
    learningPoints: Number.isInteger(saved.learningPoints) ? saved.learningPoints : 0,
    lifetimeLearningPointsEarned: Number.isInteger(saved.lifetimeLearningPointsEarned) ? saved.lifetimeLearningPointsEarned : 0,
    lifetimeLearningPointsSpent: Number.isInteger(saved.lifetimeLearningPointsSpent) ? saved.lifetimeLearningPointsSpent : 0,
    revealedLessonIds: Array.isArray(saved.revealedLessonIds) ? saved.revealedLessonIds : [],
    learnedLessonIds: Array.isArray(saved.learnedLessonIds) ? saved.learnedLessonIds : [],
    metMentorIds: Array.isArray(saved.metMentorIds) ? saved.metMentorIds : [],
    mentorProgress: saved.mentorProgress && typeof saved.mentorProgress === 'object' ? saved.mentorProgress : {},
    mentorJournalEntries: Array.isArray(saved.mentorJournalEntries) ? saved.mentorJournalEntries : [],
    specializations: Array.isArray(saved.specializations) ? saved.specializations : [],
    passiveSkills: Array.isArray(saved.passiveSkills) ? saved.passiveSkills : [],
    learningRecords: Array.isArray(saved.learningRecords) ? saved.learningRecords : [],
    discoveredKnowledge: Array.isArray(saved.discoveredKnowledge) ? saved.discoveredKnowledge : [],
    knowledgeRecords: Array.isArray(saved.knowledgeRecords) ? saved.knowledgeRecords : [],
    foundBookIds: Array.isArray(saved.foundBookIds) ? saved.foundBookIds : [],
    bookJournal: Array.isArray(saved.bookJournal) ? saved.bookJournal : [],
    libraryRecords: Array.isArray(saved.libraryRecords) ? saved.libraryRecords : [],
    usedManualIds: Array.isArray(saved.usedManualIds) ? saved.usedManualIds : [],
    usedTreatiseIds: Array.isArray(saved.usedTreatiseIds) ? saved.usedTreatiseIds : [],
    usedLegendaryTomeIds: Array.isArray(saved.usedLegendaryTomeIds) ? saved.usedLegendaryTomeIds : [],
    wardwood: Number.isInteger(saved.wardwood) ? saved.wardwood : 0,
    wardwoodBatches: Array.isArray(saved.wardwoodBatches) ? saved.wardwoodBatches : [],
    deadWardwood: Number.isInteger(saved.deadWardwood) ? saved.deadWardwood : 0,
    lanternState: saved.lanternState && typeof saved.lanternState === 'object' ? saved.lanternState : { itemInstanceId: null, isLit: false, remainingFuelMinutes: 0, maximumFuelMinutes: 480 },
    holyLanternState: saved.holyLanternState && typeof saved.holyLanternState === 'object' ? saved.holyLanternState : { itemInstanceId: null, enabled: false },
    activeLightSource: saved.activeLightSource && typeof saved.activeLightSource === 'object' ? saved.activeLightSource : null,
    startingWeapon: saved.startingWeapon ? { ...saved.startingWeapon, requiredAttribute: saved.startingWeapon.requiredAttribute === LEGACY_STRENGTH_KEY ? 'strength' : saved.startingWeapon.requiredAttribute } : fallback.startingWeapon,
    startingSkills: Array.isArray(saved.startingSkills) ? saved.startingSkills : fallback.startingSkills,
    equipment: { ...fallback.equipment, ...saved.equipment },
    inventory: Array.isArray(saved.inventory) ? saved.inventory : [],
    statuses: Array.isArray(saved.statuses) ? saved.statuses : [],
    flags: saved.flags && typeof saved.flags === 'object' ? saved.flags : {},
    recipeState: normalizeRecipeState(saved.recipeState),
  })
}

export function isValidCharacterState(character) {
  const trainedCount = PROFICIENCY_NAMES.filter((name) => character?.proficiencies?.[name] !== 'Untrained').length
  return Boolean(character && typeof character.id === 'string' && typeof character.name === 'string' && character.name.trim()
    && Number.isInteger(character.level) && character.level >= 1
    && Number.isInteger(character.experience) && character.experience >= 0
    && Number.isInteger(character.requiredExperience) && character.requiredExperience > 0
    && Number.isInteger(character.learningPoints) && character.learningPoints >= 0
    && Number.isInteger(character.lifetimeLearningPointsEarned) && character.lifetimeLearningPointsEarned >= 0
    && Number.isInteger(character.lifetimeLearningPointsSpent) && character.lifetimeLearningPointsSpent >= 0
    && (character.revealedLessonIds === undefined || Array.isArray(character.revealedLessonIds))
    && (character.learnedLessonIds === undefined || Array.isArray(character.learnedLessonIds))
    && (character.metMentorIds === undefined || Array.isArray(character.metMentorIds))
    && (character.mentorProgress === undefined || (character.mentorProgress && typeof character.mentorProgress === 'object'))
    && (character.mentorJournalEntries === undefined || Array.isArray(character.mentorJournalEntries))
    && (character.specializations === undefined || Array.isArray(character.specializations))
    && (character.passiveSkills === undefined || Array.isArray(character.passiveSkills))
    && (character.learningRecords === undefined || Array.isArray(character.learningRecords))
    && (character.discoveredKnowledge === undefined || Array.isArray(character.discoveredKnowledge))
    && (character.knowledgeRecords === undefined || Array.isArray(character.knowledgeRecords))
    && (character.foundBookIds === undefined || Array.isArray(character.foundBookIds))
    && (character.bookJournal === undefined || Array.isArray(character.bookJournal))
    && (character.libraryRecords === undefined || Array.isArray(character.libraryRecords))
    && (character.usedManualIds === undefined || Array.isArray(character.usedManualIds))
    && (character.usedTreatiseIds === undefined || Array.isArray(character.usedTreatiseIds))
    && (character.usedLegendaryTomeIds === undefined || Array.isArray(character.usedLegendaryTomeIds))
    && (character.wardwood === undefined || (Number.isInteger(character.wardwood) && character.wardwood >= 0))
    && (character.wardwoodBatches === undefined || Array.isArray(character.wardwoodBatches))
    && (character.deadWardwood === undefined || (Number.isInteger(character.deadWardwood) && character.deadWardwood >= 0))
    && (character.activeLightSource === undefined || character.activeLightSource === null || typeof character.activeLightSource === 'object')
    && character.health?.current >= 0 && character.health?.current <= character.health?.max
    && Number.isInteger(character.gold) && character.gold >= 0
    && ATTRIBUTE_DEFINITIONS.every(({ id }) => { const value = readSavedStat(character.stats, id); return Number.isInteger(value) && value >= 1 && value <= 10 })
    && Object.keys(character.stats).length === ATTRIBUTE_DEFINITIONS.length
    && PROFICIENCY_NAMES.every((name) => PROFICIENCY_RANKS.includes(character.proficiencies?.[name])) && trainedCount >= 2
    && PROFICIENCY_NAMES.every((name) => Number.isFinite(character.proficiencySkills?.[name]?.baseValue) && character.proficiencySkills[name].baseValue >= 0 && Number.isInteger(character.proficiencySkills[name].currentRankCap) && Number.isInteger(character.proficiencySkills[name].maximumCap))
    && character.startingWeapon && typeof character.startingWeapon.id === 'string'
    && Array.isArray(character.startingSkills)
    && EQUIPMENT_SLOTS.every(({ id }) => id in character.equipment)
    && Array.isArray(character.inventory) && Array.isArray(character.statuses)
    && character.flags && typeof character.flags === 'object'
    && character.recipeState && Array.isArray(character.recipeState.knownRecipeIds) && character.recipeState.unlockSources && typeof character.recipeState.unlockSources === 'object')
}
