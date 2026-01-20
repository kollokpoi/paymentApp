const validator = require('validator');

module.exports = {
  validateEmail(email) {
    return validator.isEmail(email);
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