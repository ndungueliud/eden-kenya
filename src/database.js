import fs from 'node:fs'
import path from 'node:path'

const dataDir = path.resolve('data')
const dbFile = path.join(dataDir, 'settings.json')

const defaults = {
  owners: [],
  mode: 'public',
  autoBio: false,
  autoType: false,
  autoRecording: false,
  autoReact: false,
  autoRead: false,
  autoViewStatus: false,
  antiLink: false,
  antiBadwords: false,
  welcome: false,
  goodbye: false,
  afk: {}
}

fs.mkdirSync(dataDir, { recursive: true })

let state = defaults

try {
  if (fs.existsSync(dbFile)) {
    state = { ...defaults, ...JSON.parse(fs.readFileSync(dbFile, 'utf8')) }
  }
} catch (error) {
  console.error('Could not read settings; starting with defaults:', error.message)
}

export function getState() {
  return state
}

export function saveState() {
  fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(dbFile, JSON.stringify(state, null, 2))
}

export function isOwner(number) {
  return state.owners.includes(String(number))
}

export function addOwner(number) {
  const normalized = String(number).replace(/\D/g, '')
  if (!normalized) return false
  if (!state.owners.includes(normalized)) state.owners.push(normalized)
  saveState()
  return true
}

export function removeOwner(number) {
  const normalized = String(number).replace(/\D/g, '')
  state.owners = state.owners.filter((owner) => owner !== normalized)
  saveState()
  }
