// Returns today's date (YYYY-MM-DD) in São Paulo, whatever the server time zone is.
// The 'en-CA' format writes dates as YYYY-MM-DD.
export function todayInSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
  }).format(new Date())
}
