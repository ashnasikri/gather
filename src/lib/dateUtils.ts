export function formatRelativeDate(dateStr: string): string {
  // Parse YYYY-MM-DD as local date (avoid UTC midnight shifting to previous day)
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
  const date = isDateOnly
    ? new Date(dateStr + 'T00:00:00')
    : new Date(dateStr)
  const now = new Date()

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (dateStart.getTime() === todayStart.getTime()) return 'Today'
  if (dateStart.getTime() === yesterdayStart.getTime()) return 'Yesterday'

  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
