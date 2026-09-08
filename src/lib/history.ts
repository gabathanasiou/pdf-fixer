export type RepairKind = 'fixed' | 'clean' | 'error'

export interface RepairRecord {
  id: string
  name: string
  kind: RepairKind
  blob?: Blob
  pages?: number
  issues?: number
  notPdf?: boolean
  message?: string
  createdAt: number
}

const DB_NAME = 'pdf-fixer'
const STORE = 'repairs'
const FIXED_LIMIT = 5
const OTHER_LIMIT = 20
const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' }).createIndex('createdAt', 'createdAt')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadHistory(): Promise<RepairRecord[]> {
  const db = await openDb()
  const records = await new Promise<RepairRecord[]>((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll()
    request.onsuccess = () => resolve(request.result as RepairRecord[])
    request.onerror = () => reject(request.error)
  })

  const now = Date.now()
  const expired = records.filter((record) => record.blob && now - record.createdAt > EXPIRY_MS)
  if (expired.length > 0) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      for (const record of expired) {
        delete record.blob
        tx.objectStore(STORE).put(record)
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  for (const record of records) {
    if (!record.kind) record.kind = record.blob ? 'fixed' : 'clean'
  }
  records.sort((a, b) => b.createdAt - a.createdAt)
  return records
}

export async function addHistory(record: RepairRecord): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(record)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })

  const all = await loadHistory()
  const withBlob = all.filter((item) => item.blob)
  const withoutBlob = all.filter((item) => !item.blob)
  const excess = [...withBlob.slice(FIXED_LIMIT), ...withoutBlob.slice(OTHER_LIMIT)]
  if (excess.length === 0) return

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    for (const item of excess) tx.objectStore(STORE).delete(item.id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function deleteHistory(id: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function clearHistory(): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
