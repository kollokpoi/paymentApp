export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const target = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000)

  if (diffInSeconds < 0) {
    return 'в будущем'
  }

  if (diffInSeconds < 60) {
    return 'только что'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return pluralizeTime(diffInMinutes, 'минуту', 'минуты', 'минут')
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return pluralizeTime(diffInHours, 'час', 'часа', 'часов')
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) {
    return 'вчера'
  }
  if (diffInDays < 7) {
    return `${diffInDays} дня назад`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return pluralizeTime(diffInWeeks, 'неделю', 'недели', 'недель')
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return pluralizeTime(diffInMonths, 'месяц', 'месяца', 'месяцев')
  }
  const diffInYears = Math.floor(diffInDays / 365)
  return pluralizeTime(diffInYears, 'год', 'года', 'лет')
}

function pluralizeTime(value: number, one: string, few: string, many: string): string {
  if (value === 1) {
    return `${value} ${one} назад`
  }

  if (value >= 2 && value <= 4) {
    return `${value} ${few} назад`
  }

  if (value >= 5 && value <= 20) {
    return `${value} ${many} назад`
  }

  const lastDigit = value % 10
  if (lastDigit === 1) {
    return `${value} ${one} назад`
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${value} ${few} назад`
  }

  return `${value} ${many} назад`
}
