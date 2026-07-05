export function isRequired(value, fieldName) {
  if (!value || !String(value).trim()) {
    return `${fieldName} is required`;
  }
  return null;
}

export function isEmail(value) {
  if (!value) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return 'Invalid email address';
  return null;
}

export function isPositiveNumber(value, fieldName) {
  const num = Number(value);
  if (Number.isNaN(num) || num < 0) {
    return `${fieldName} must be a positive number`;
  }
  return null;
}

export function validateProduct(data) {
  const errors = {};
  const nameErr = isRequired(data.name, 'Name');
  if (nameErr) errors.name = nameErr;
  const costErr = isPositiveNumber(data.cost_price, 'Cost price');
  if (costErr) errors.cost_price = costErr;
  const sellErr = isPositiveNumber(data.selling_price, 'Selling price');
  if (sellErr) errors.selling_price = sellErr;
  return errors;
}

export function validateLogin(data) {
  const errors = {};
  const emailErr = isEmail(data.email);
  if (emailErr) errors.email = emailErr;
  const passErr = isRequired(data.password, 'Password');
  if (passErr) errors.password = passErr;
  return errors;
}
