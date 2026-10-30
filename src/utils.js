export function getSenderNumber(jid = '') {
  const user = jid.split('@')[0] || ''
  return user.split(':')[0].replace(/\D/g, '')
}

export function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  return `${days}d ${hours}h ${minutes}m ${secs}s`
}

export function getMentionedNumbers(message) {
  const context =
    message?.message?.extendedTextMessage?.contextInfo ??
    message?.message?.imageMessage?.contextInfo ??
    message?.message?.videoMessage?.contextInfo ??
    {}

  return (context.mentionedJid || []).map((jid) =>
    (jid.split('@')[0] || '').split(':')[0]
  )
}
