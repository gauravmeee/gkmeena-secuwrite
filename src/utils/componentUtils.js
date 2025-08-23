import dynamic from 'next/dynamic';

// Lazy load components that are not immediately needed
export const LazyAuthModal = dynamic(() => import('../components/AuthModal'), {
  ssr: false,
  loading: () => <div className="w-6 h-6 animate-pulse bg-gray-600 rounded" />
});

export const LazyEncryptionMigration = dynamic(() => import('../components/EncryptionMigration'), {
  ssr: false,
  loading: () => null
});

export const LazyJoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-100 animate-pulse rounded" />
});

// Cache utility for frequently accessed data
export class SimpleCache {
  constructor(maxAge = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.maxAge = maxAge;
  }


  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }
}

// Debounce utility for performance optimization
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility for performance optimization
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
