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

// Альтернативный вариант без Intl (на случай если нужна поддержка старых браузеров):
export const formatCurrencySimple = (amount: number, currency: string = 'RUB'): string => {
  if (isNaN(amount)) return '0 ₽'

  const formattedAmount = amount.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })

  const currencySymbols: Record<string, string> = {
    'RUB': '₽',
    'USD': '$',
    'EUR': '€',
    'KZT': '₸'
  }

  const symbol = currencySymbols[currency] || currency

  return `${formattedAmount} ${symbol}`
}
