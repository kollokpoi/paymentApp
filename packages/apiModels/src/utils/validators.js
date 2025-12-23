const validator = require('validator');

module.exports = {
  validateEmail(email) {
    return validator.isEmail(email);
  },
  
  validateDomain(domain) {
    return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.bitrix24\.(ru|com|kz|ua|by)$/.test(domain);
  },
  
  validatePhone(phone) {
    return validator.isMobilePhone(phone, 'any', { strictMode: false });
  },
  
  validateUUID(uuid) {
    return validator.isUUID(uuid);
  },
  
  sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return validator.escape(validator.trim(input));
  },
  
  validatePassword(password) {
    return password.length >= 6 && password.length <= 255;
  }
};