export const formatDate = (dateInput: Date | string): string => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}