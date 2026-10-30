import os from 'node:os'
import { performance } from 'node:perf_hooks'
import { config } from '../config.js'
import {
  addOwner,
  getState,
  isOwner,
  removeOwner,
  saveState
} from './database.js'
import { makeMenu } from './menu.js'
import {
  formatUptime,
  getMentionedNumbers,
  getSenderNumber
} from './utils.js'

const startedAt = Date.now()

const settingNames = {
  autobio: 'autoBio',
  autotype: 'autoType',
  autorecord: 'autoRecording',
  autoreact: 'autoReact',
  autoread: 'autoRead',
  antilink: 'antiLink',
  antibadwords: 'antiBadwords',
  welcome: 'welcome',
  goodbye: 'goodbye'
}

function getText(message) {
  const msg = message?.message
  return (
    msg?.conversation ||
    msg?.extendedTextMessage?.text ||
    msg?.imageMessage?.caption ||
    msg?.videoMessage?.caption ||
    ''
  ).trim()
}

function groupOnlyText() {
  return 'This command only works in a group.'
}

export async function handleMessage(sock, message) {
  if (!message?.message || message.key.fromMe) return

  const chat = message.key.remoteJid
  if (!chat) return

  const text = getText(message)
  if (!text.startsWith(config.prefix)) return

  const [rawCommand, ...args] = text.slice(config.prefix.length).trim().split(/\s+/)
  const command = (rawCommand || '').toLowerCase()
  const argument = args.join(' ')
  const state = getState()

  const senderJid =
    message.key.participant ||
    message.key.remoteJid ||
    ''
  const sender = getSenderNumber(senderJid)
  const owner = isOwner(sender)
  const isGroup = chat.endsWith('@g.us')

  if (state.mode === 'private' && isGroup && !owner) return
  if (state.mode === 'group' && !isGroup && !owner) return
  if (state.mode === 'self' && !owner) return

  // Read-only, low-risk basics
  if (command === 'menu' || command === 'help') {
    return sock.sendMessage(chat, { text: makeMenu() }, { quoted: message })
  }

  if (command === 'ping') {
    const start = performance.now()
    await sock.sendMessage(chat, { text: 'Pong!' }, { quoted: message })
    const elapsed = Math.round(performance.now() - start)
    return sock.sendMessage(chat, { text: `Response: ${elapsed} ms` })
  }

  if (command === 'uptime') {
    const seconds = Math.floor((Date.now() - startedAt) / 1000)
    return sock.sendMessage(chat, {
      text: `⏱️ Uptime: ${formatUptime(seconds)}`
    })
  }

  if (command === 'info') {
    return sock.sendMessage(chat, {
      text: `🤖 ${config.botName}\nNode: ${process.version}\nHost: ${os.platform()}`
    })
  }

  if (command === 'mode') {
    if (!owner) return sock.sendMessage(chat, { text: 'Owner only.' })
    const mode = (args[0] || '').toLowerCase()
    const validModes = ['public', 'private', 'self', 'group']
    if (!validModes.includes(mode)) {
      return sock.sendMessage(chat, {
        text: `Usage: ${config.prefix}mode ${validModes.join('|')}`
      })
    }
    state.mode = mode
    saveState()
    return sock.sendMessage(chat, { text: `Mode set to ${mode}.` })
  }

  if (command === 'afk') {
    state.afk[sender] = {
      reason: argument || 'No reason provided',
      since: Date.now()
    }
    saveState()
    return sock.sendMessage(chat, {
      text: `AFK enabled${argument ? `: ${argument}` : '.'}`
    })
  }

  if (command === 'addowner' || command === 'delowner') {
    if (!owner) return sock.sendMessage(chat, { text: 'Owner only.' })
    const number = (args[0] || '').replace(/\D/g, '')
    if (!number) {
      return sock.sendMessage(chat, {
        text: `Usage: ${config.prefix}${command} 2547XXXXXXXX`
      })
    }
    if (command === 'addowner') addOwner(number)
    else removeOwner(number)
    return sock.sendMessage(chat, {
      text: command === 'addowner' ? `Added ${number}.` : `Removed ${number}.`
    })
  }

  if (Object.hasOwn(settingNames, command)) {
    if (!owner) return sock.sendMessage(chat, { text: 'Owner only.' })
    const value = (args[0] || '').toLowerCase()
    if (!['on', 'off'].includes(value)) {
      return sock.sendMessage(chat, {
        text: `Usage: ${config.prefix}${command} on|off`
      })
    }
    state[settingNames[command]] = value === 'on'
    saveState()
    return sock.sendMessage(chat, {
      text: `${command} is now ${value}.`
    })
  }

  if (['tools', 'games', 'downloads'].includes(command)) {
    const content = {
      tools: 'Tools planned: text-to-audio, fonts, stickers, translation.',
      games: 'Games planned: quiz, tic-tac-toe, color guess, and more.',
      downloads: 'Download commands are placeholders; only use lawful, permitted sources.'
    }
    return sock.sendMessage(chat, { text: content[command] })
  }

  const mediaMenus = {
    imagemenu: 'Image menu: image-to-sticker, sticker-to-image.',
    videomenu: 'Video menu: video-to-sticker (planned).',
    documentmenu: 'Document menu: document processing (planned).',
    buttonsmenu: 'Button-style menu: interactive buttons depend on supported WhatsApp features.',
    templates: 'Template styles: classic, compact, boxed (text-only starter).'
  }
  if (Object.hasOwn(mediaMenus, command)) {
    return sock.sendMessage(chat, { text: mediaMenus[command] })
  }

  if (command === 'groupinfo' || command === 'members' || command === 'tagall' ||
      command === 'hidetag' || command === 'promote' || command === 'demote' ||
      command === 'kick' || command === 'invite') {
    if (!isGroup) {
      return sock.sendMessage(chat, { text: groupOnlyText() })
    }

    const metadata = await sock.groupMetadata(chat)
    const botNumber = getSenderNumber(sock.user?.id || '')
    const botParticipant = metadata.participants.find((p) =>
      getSenderNumber(p.id) === botNumber
    )
    const botIsAdmin =
      botParticipant?.admin === 'admin' ||
      botParticipant?.admin === 'superadmin'

    if (command === 'groupinfo') {
      return sock.sendMessage(chat, {
        text: `👥 ${metadata.subject}\nMembers: ${metadata.participants.length}`
      })
    }

    if (command === 'invite') {
      if (!botIsAdmin) return sock.sendMessage(chat, { text: 'I need admin privileges.' })
      const code = await sock.groupInviteCode(chat)
      return sock.sendMessage(chat, { text: `Invite link: https://chat.whatsapp.com/${code}` })
    }

    if (command === 'members') {
      const names = metadata.participants
        .map((p) => `• @${getSenderNumber(p.id)}`)
        .join('\n')
      return sock.sendMessage(chat, {
        text: names || 'No members found.',
        mentions: metadata.participants.map((p) => p.id)
      })
    }

    if (!owner && !botIsAdmin) {
      return sock.sendMessage(chat, {
        text: 'The bot must be a group admin for this command.'
      })
    }

    if (command === 'tagall' || command === 'hidetag') {
      const mentions = metadata.participants.map((p) => p.id)
      const body = argument || ' '
      return sock.sendMessage(chat, {
        text: `${command === 'tagall' ? '📢 Tag all' : ''}\n${body}`,
        mentions
      })
    }

    const targets = getMentionedNumbers(message)
    const targetJids = metadata.participants
      .filter((p) => targets.includes(getSenderNumber(p.id)))
      .map((p) => p.id)

    if (!targetJids.length) {
      return sock.sendMessage(chat, {
        text: `Mention a group member. Example: ${config.prefix}${command} @user`
      })
    }

    if (!owner && !botIsAdmin) {
      return sock.sendMessage(chat, { text: 'Admin permission required.' })
    }

    const action = {
      promote: 'promote',
      demote: 'demote',
      kick: 'remove'
    }[command]

    if (!action) return

    await sock.groupParticipantsUpdate(chat, targetJids, action)
    return sock.sendMessage(chat, { text: `${command} complete.` })
  }
      }
