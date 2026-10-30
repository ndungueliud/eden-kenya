import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from '@whiskeysockets/baileys'
import pino from 'pino'
import { config } from './config.js'
import { addOwner, getState } from './src/database.js'
import { handleMessage } from './src/commands.js'

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info')

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    browser: ['Eden Kenya', 'Chrome', '1.0.0']
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'connecting') {
      console.log('Connecting to WhatsApp...')
    }

    if (connection === 'open') {
      console.log(`✅ ${config.botName} connected.`)
      if (sock.user?.id) {
        const connectedNumber = sock.user.id.split('@')[0].split(':')[0]
        if (connectedNumber) addOwner(connectedNumber)
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode
      const loggedOut = statusCode === DisconnectReason.loggedOut

      if (loggedOut) {
        console.error('Logged out. Remove auth_info and pair again.')
        return
      }

      console.log('Connection closed; reconnecting...')
      setTimeout(startBot, 3000)
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const message of messages) {
      try {
        await handleMessage(sock, message)
      } catch (error) {
        console.error('Command error:', error)
        const chat = message?.key?.remoteJid
        if (chat) {
          await sock.sendMessage(chat, {
            text: 'Something went wrong while running that command.'
          }).catch(() => {})
        }
      }
    }
  })

  // Ask for a pairing code when this account has no saved session.
  if (!state.creds.registered) {
    if (!config.pairingNumber) {
      console.error('Set PAIRING_NUMBER in .env first.')
      process.exit(1)
    }

    const code = await sock.requestPairingCode(config.pairingNumber)
    console.log(`\nPairing code: ${code}`)
    console.log('Enter it in WhatsApp → Linked devices → Link a device.\n')
  }

  // Ensure configured owners are available to owner commands.
  for (const number of config.ownerNumbers) addOwner(number)
}

startBot().catch((error) => {
  console.error('Fatal startup error:', error)
  process.exit(1)
})
