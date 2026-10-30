import { config } from '../config.js'

export function makeMenu() {
  return `╭─── *${config.botName}* ───
│ Prefix: ${config.prefix}
│
├─ *BOT*
│ ${config.prefix}menu
│ ${config.prefix}ping
│ ${config.prefix}uptime
│ ${config.prefix}info
│ ${config.prefix}mode public|private|self|group
│ ${config.prefix}afk [reason]
│
├─ *OWNER*
│ ${config.prefix}addowner <number>
│ ${config.prefix}delowner <number>
│ ${config.prefix}autobio on|off
│ ${config.prefix}autotype on|off
│ ${config.prefix}autorecord on|off
│ ${config.prefix}autoreact on|off
│ ${config.prefix}autoread on|off
│
├─ *GROUP* (bot must be admin)
│ ${config.prefix}groupinfo
│ ${config.prefix}members
│ ${config.prefix}tagall
│ ${config.prefix}hidetag [text]
│ ${config.prefix}promote @user
│ ${config.prefix}demote @user
│ ${config.prefix}kick @user
│ ${config.prefix}invite
│
├─ *TOOLS / GAMES / DOWNLOADS*
│ ${config.prefix}tools
│ ${config.prefix}games
│ ${config.prefix}downloads
│
├─ *MEDIA MENUS*
│ ${config.prefix}imagemenu
│ ${config.prefix}videomenu
│ ${config.prefix}documentmenu
│ ${config.prefix}buttonsmenu
│ ${config.prefix}templates
╰────────────────────`
}
