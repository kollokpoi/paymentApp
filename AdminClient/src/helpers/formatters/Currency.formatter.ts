export const formatCurrency = (amount: number, currency: string = 'RUB'): string => {
  if (isNaN(amount)) return '0 ₽'

  const formatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    currencyDisplay: 'symbol'
  })

  return formatter.format(amount)
}
