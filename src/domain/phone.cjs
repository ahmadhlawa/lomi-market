function normalizePalestinianPhone(value) {
  let digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('00970')) digits = digits.slice(5)
  else if (digits.startsWith('970')) digits = digits.slice(3)
  else if (digits.startsWith('0')) digits = digits.slice(1)
  if (!/^(56|59)\d{7}$/.test(digits)) {
    throw new Error('Enter a valid Palestinian mobile number')
  }
  return `+970${digits}`
}

module.exports = { normalizePalestinianPhone }
