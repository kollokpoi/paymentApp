class ObjectUtils {
  static get(obj, path, defaultValue = null) {
    if (!obj || typeof obj !== 'object') return defaultValue;
    
    return path.split('.').reduce((current, key) => {
      return (current && current.hasOwnProperty(key)) ? current[key] : defaultValue;
    }, obj);
  }
  
  static has(obj, path) {
    if (!obj || typeof obj !== 'object') return false;
    
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (!current.hasOwnProperty(key)) {
        return false;
      }
      current = current[key];
    }
    
    return true;
  }
  
  static set(obj, path, value) {
    if (!obj || typeof obj !== 'object') return false;
    
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = obj;
    
    for (const key of keys) {
      if (!current.hasOwnProperty(key)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
    return true;
  }
}

module.exports = ObjectUtils