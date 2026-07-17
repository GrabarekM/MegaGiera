import { BOOK_KIND } from './bookDefinitions.js'
import { BOOK_STATUS } from './bookDefinitions.js'

export const BOOK_COLLECTION_CONFIG = Object.freeze({ totalCollectibleBooks: 180 })

export function recordFoundBook(character, definition, { foundDate = null, source = null } = {}) {
  if (!definition?.bookData) return { ok: false, code: 'ITEM_IS_NOT_A_BOOK' }
  character.foundBookIds ??= []
  character.bookJournal ??= []
  character.libraryRecords ??= []
  const alreadyFound = character.foundBookIds.includes(definition.id)
  if (!alreadyFound) character.foundBookIds.push(definition.id)
  if (!character.libraryRecords.some(({ bookId }) => bookId === definition.id)) character.libraryRecords.push({ bookId: definition.id, title: definition.displayName, bookType: definition.bookData.kind, category: definition.bookData.category, status: BOOK_STATUS.UNREAD, foundDate, source, protected: Boolean(definition.bookData.protected) })
  if (definition.bookData.kind === BOOK_KIND.KNOWLEDGE_BOOK && !character.bookJournal.some(({ bookId }) => bookId === definition.id)) {
    character.bookJournal.push({ bookId: definition.id, title: definition.displayName, foundDate, known: false, source })
  }
  return { ok: true, newlyFound: !alreadyFound, found: character.foundBookIds.length, total: BOOK_COLLECTION_CONFIG.totalCollectibleBooks }
}

export function markKnowledgeBookKnown(character, bookId) {
  const entry = (character.bookJournal ?? []).find((item) => item.bookId === bookId)
  if (!entry) return { ok: false, code: 'BOOK_JOURNAL_ENTRY_NOT_FOUND' }
  entry.known = true
  setLibraryBookStatus(character, bookId, BOOK_STATUS.KNOWN)
  return { ok: true, entry }
}

export function setLibraryBookStatus(character, bookId, status) { const record = (character.libraryRecords ?? []).find((item) => item.bookId === bookId); if (!record) return { ok: false, code: 'LIBRARY_RECORD_NOT_FOUND' }; record.status = status; return { ok: true, record } }

export function queryLibrary(character, { search = '', category = null, bookType = null, sort = 'name' } = {}) {
  const phrase = search.trim().toLocaleLowerCase()
  const records = (character.libraryRecords ?? []).filter((record) => !phrase || record.title.toLocaleLowerCase().includes(phrase)).filter((record) => !category || record.category === category).filter((record) => !bookType || record.bookType === bookType).map((record) => ({ ...record }))
  if (sort === 'date') records.sort((a, b) => String(b.foundDate).localeCompare(String(a.foundDate)))
  else if (sort === 'status') records.sort((a, b) => a.status.localeCompare(b.status) || a.title.localeCompare(b.title))
  else records.sort((a, b) => a.title.localeCompare(b.title))
  return records
}

export function getBookCollectionSummary(character) {
  const found = (character.foundBookIds ?? []).length
  return { found, total: BOOK_COLLECTION_CONFIG.totalCollectibleBooks, completionPercentage: Number(((found / BOOK_COLLECTION_CONFIG.totalCollectibleBooks) * 100).toFixed(1)), journal: (character.bookJournal ?? []).map((entry) => ({ ...entry })), records: queryLibrary(character) }
}
