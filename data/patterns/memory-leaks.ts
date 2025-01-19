import { Pattern } from '../index';

export const memoryLeaksPattern: Pattern = {
  id: 'memory-leaks',
  title: 'Memory Leaks 101',
  description: 'A systematic approach to identifying and fixing memory leaks through heap snapshot analysis, memory usage visualization, and common leak pattern detection.',
  category: 'PERFORMANCE',
  diagram: 'https://raw.githubusercontent.com/noah-ing/Debug-Pics/refs/heads/main/mermaid-diagram-2025-01-09-224808.svg',
  useCases: [
    'Long-running web applications',
    'Single-page applications (SPAs)',
    'Real-time data processing systems',
    'Applications with dynamic component loading'
  ],
  implementation: {
    typescript: `// Real-world example: Memory leak detection and prevention in a React-like application
interface Subscription {
  unsubscribe(): void;
}

interface CacheOptions {
  maxSize?: number;
  ttl?: number;
}

// Memory-safe cache implementation with size and TTL limits
class LRUCache<K, V> {
  private cache: Map<K, { value: V; timestamp: number }>;
  private maxSize: number;
  private ttl: number;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 3600000; // 1 hour default
    
    // Periodic cleanup to prevent memory leaks
    setInterval(() => this.cleanup(), 60000);
  }

  set(key: K, value: V): void {
    // Enforce size limit
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    
    if (!item) return undefined;

    // Check TTL
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return item.value;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Memory-safe event emitter with automatic cleanup
class EventEmitter {
  private events: Map<string, Set<WeakRef<Function>>>;
  private cleanupInterval: number;

  constructor() {
    this.events = new Map();
    
    // Periodic cleanup of dead references
    this.cleanupInterval = setInterval(() => this.cleanup(), 30000);
  }

  on(event: string, callback: Function): Subscription {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }

    const callbacks = this.events.get(event)!;
    const weakCallback = new WeakRef(callback);
    callbacks.add(weakCallback);

    return {
      unsubscribe: () => {
        callbacks.delete(weakCallback);
        if (callbacks.size === 0) {
          this.events.delete(event);
        }
      }
    };
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (!callbacks) return;

    for (const weakCallback of callbacks) {
      const callback = weakCallback.deref();
      if (callback) {
        callback(...args);
      } else {
        callbacks.delete(weakCallback);
      }
    }
  }

  private cleanup(): void {
    for (const [event, callbacks] of this.events.entries()) {
      for (const weakCallback of callbacks) {
        if (!weakCallback.deref()) {
          callbacks.delete(weakCallback);
        }
      }
      if (callbacks.size === 0) {
        this.events.delete(event);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.events.clear();
  }
}

// Memory-safe component base class
abstract class Component {
  private subscriptions: Set<Subscription>;
  private timers: Set<number>;
  private eventEmitter: EventEmitter;
  private mounted: boolean;

  constructor() {
    this.subscriptions = new Set();
    this.timers = new Set();
    this.eventEmitter = new EventEmitter();
    this.mounted = false;
  }

  protected onMount(): void {
    this.mounted = true;
  }

  protected onUnmount(): void {
    this.mounted = false;
    this.cleanup();
  }

  // Safe subscription management
  protected subscribe(subscription: Subscription): void {
    this.subscriptions.add(subscription);
  }

  // Safe timer management
  protected setTimeout(callback: () => void, delay: number): number {
    const id = window.setTimeout(() => {
      if (this.mounted) {
        callback();
      }
      this.timers.delete(id);
    }, delay);
    
    this.timers.add(id);
    return id;
  }

  protected setInterval(callback: () => void, delay: number): number {
    const id = window.setInterval(() => {
      if (!this.mounted) {
        clearInterval(id);
        this.timers.delete(id);
        return;
      }
      callback();
    }, delay);
    
    this.timers.add(id);
    return id;
  }

  // Safe event listener management
  protected addEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions
  ): void {
    target.addEventListener(type, listener, options);
    this.subscriptions.add({
      unsubscribe: () => target.removeEventListener(type, listener)
    });
  }

  private cleanup(): void {
    // Clear subscriptions
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
    this.subscriptions.clear();

    // Clear timers
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();

    // Cleanup event emitter
    this.eventEmitter.destroy();
  }
}

// Example usage
class DataGrid extends Component {
  private cache: LRUCache<string, any>;
  
  constructor() {
    super();
    this.cache = new LRUCache({ maxSize: 100, ttl: 300000 }); // 5 minutes TTL
  }

  protected onMount(): void {
    super.onMount();

    // Safe event listener
    this.addEventListener(window, 'resize', this.handleResize);

    // Safe interval
    this.setInterval(this.refreshData, 60000);

    // Safe subscription
    const subscription = dataService.subscribe(
      this.handleDataUpdate
    );
    this.subscribe(subscription);
  }

  private handleResize = () => {
    // Handle resize logic
  };

  private refreshData = () => {
    // Refresh data logic
  };

  private handleDataUpdate = (data: any) => {
    this.cache.set('latestData', data);
  };
}`,
    python: `# Real-world example: Memory leak prevention in a data processing pipeline
from typing import Dict, Set, Optional, Any, Callable
from datetime import datetime, timedelta
import weakref
import threading
import logging
from contextlib import contextmanager
from collections import OrderedDict
import gc

class LRUCache:
    """Thread-safe LRU cache with size and TTL limits."""
    
    def __init__(self, max_size: int = 1000, ttl: int = 3600):
        self._cache: OrderedDict = OrderedDict()
        self._max_size = max_size
        self._ttl = ttl  # seconds
        self._lock = threading.Lock()
        self._cleanup_thread = threading.Thread(
            target=self._cleanup_loop,
            daemon=True
        )
        self._cleanup_thread.start()
        self.logger = logging.getLogger(__name__)

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache with TTL check."""
        with self._lock:
            if key not in self._cache:
                return None
                
            value, timestamp = self._cache[key]
            if datetime.now() - timestamp > timedelta(seconds=self._ttl):
                del self._cache[key]
                return None
                
            # Move to end (most recently used)
            self._cache.move_to_end(key)
            return value

    def set(self, key: str, value: Any) -> None:
        """Set value in cache with size limit enforcement."""
        with self._lock:
            # Remove oldest if at size limit
            if len(self._cache) >= self._max_size:
                self._cache.popitem(last=False)
                
            self._cache[key] = (value, datetime.now())

    def _cleanup_loop(self) -> None:
        """Periodic cleanup of expired entries."""
        while True:
            try:
                self._cleanup()
                threading.Event().wait(60)  # Clean every minute
            except Exception as e:
                self.logger.error(f"Cache cleanup error: {e}")

    def _cleanup(self) -> None:
        """Remove expired entries."""
        now = datetime.now()
        with self._lock:
            expired = [
                key for key, (_, timestamp) in self._cache.items()
                if now - timestamp > timedelta(seconds=self._ttl)
            ]
            for key in expired:
                del self._cache[key]

class ResourceManager:
    """Safe resource management with automatic cleanup."""
    
    def __init__(self):
        self._resources: Set[Any] = set()
        self._lock = threading.Lock()
        self.logger = logging.getLogger(__name__)

    def register(self, resource: Any) -> None:
        """Register a resource for management."""
        with self._lock:
            self._resources.add(resource)

    def unregister(self, resource: Any) -> None:
        """Unregister a managed resource."""
        with self._lock:
            self._resources.discard(resource)

    def cleanup(self) -> None:
        """Clean up all managed resources."""
        with self._lock:
            for resource in self._resources:
                try:
                    if hasattr(resource, 'close'):
                        resource.close()
                    elif hasattr(resource, 'cleanup'):
                        resource.cleanup()
                except Exception as e:
                    self.logger.error(f"Resource cleanup error: {e}")
            self._resources.clear()

class WeakCallbackRegistry:
    """Registry for callbacks that doesn't prevent garbage collection."""
    
    def __init__(self):
        self._callbacks: Set[weakref.ref] = set()
        self._lock = threading.Lock()

    def register(self, callback: Callable) -> None:
        """Register a callback using weak reference."""
        def cleanup(ref: weakref.ref) -> None:
            with self._lock:
                self._callbacks.discard(ref)

        with self._lock:
            self._callbacks.add(weakref.ref(callback, cleanup))

    def notify(self, *args, **kwargs) -> None:
        """Notify all registered callbacks."""
        with self._lock:
            for ref in list(self._callbacks):
                callback = ref()
                if callback is not None:
                    try:
                        callback(*args, **kwargs)
                    except Exception as e:
                        logging.error(f"Callback error: {e}")

class DataProcessor:
    """Example data processor with memory leak prevention."""
    
    def __init__(self):
        self.cache = LRUCache(max_size=1000, ttl=300)  # 5 minutes TTL
        self.resource_manager = ResourceManager()
        self.callbacks = WeakCallbackRegistry()
        self.logger = logging.getLogger(__name__)

    @contextmanager
    def process_batch(self, batch_id: str):
        """Process a batch of data with automatic resource cleanup."""
        self.logger.info(f"Starting batch {batch_id}")
        temp_resources = set()
        
        try:
            yield self._get_batch_context(temp_resources)
            
        except Exception as e:
            self.logger.error(f"Batch {batch_id} failed: {e}")
            raise
            
        finally:
            # Cleanup temporary resources
            for resource in temp_resources:
                try:
                    resource.close()
                except Exception as e:
                    self.logger.error(f"Resource cleanup error: {e}")
            
            # Force garbage collection
            gc.collect()

    def _get_batch_context(self, temp_resources: Set[Any]) -> Dict[str, Any]:
        """Create batch processing context."""
        return {
            'cache': self.cache,
            'temp_resources': temp_resources,
            'register_callback': self.callbacks.register
        }

    def cleanup(self) -> None:
        """Clean up all resources."""
        self.resource_manager.cleanup()
        self.cache = None  # Allow cache to be garbage collected

# Example usage
def process_data_stream(stream_id: str, data: Any):
    processor = DataProcessor()
    
    try:
        with processor.process_batch(stream_id) as context:
            # Cache frequently accessed data
            cached_config = context['cache'].get('config')
            if not cached_config:
                cached_config = load_config()
                context['cache'].set('config', cached_config)
            
            # Process data with memory-safe callback
            def update_callback(result: Any):
                # Handle result
                pass
            
            context['register_callback'](update_callback)
            
            # Process data...
            
    finally:
        processor.cleanup()`
  },
  codeExamples: [
    {
      title: 'Common Memory Leak Patterns',
      language: 'typescript',
      code: `// ❌ Common memory leak patterns
class DataComponent {
  private eventHandlers = new Set();
  private cache = {};
  
  constructor() {
    // Issue 1: Unbounded cache growth
    this.cache = {};
    
    // Issue 2: Event listener not removed
    window.addEventListener('resize', this.handleResize);
    
    // Issue 3: Interval not cleared
    setInterval(this.fetchData, 5000);
    
    // Issue 4: Closure keeping reference
    const data = { value: 'test' };
    this.eventHandlers.add(() => {
      console.log(data.value);
    });
  }
  
  handleResize = () => {
    // Handle resize
  };
  
  fetchData = () => {
    // Fetch and cache data
    this.cache[Date.now()] = 'data';
  };
}`,
      explanation: 'Common memory leaks include unbounded caches, uncleared intervals, uncleaned event listeners, and closure references.'
    },
    {
      title: 'Memory-Safe Implementation',
      language: 'typescript',
      code: `// ✅ Memory-safe implementation
class DataComponent {
  private eventHandlers = new Set<() => void>();
  private cache = new LRUCache<string, any>({ maxSize: 100 });
  private intervalId?: number;
  
  constructor() {
    // Bounded LRU cache
    this.cache = new LRUCache({ maxSize: 100, ttl: 3600000 });
    
    // Tracked event listener
    this.addEventHandler(
      'resize',
      this.handleResize
    );
    
    // Tracked interval
    this.intervalId = window.setInterval(this.fetchData, 5000);
  }
  
  private addEventHandler(
    event: string,
    handler: EventListener
  ): void {
    window.addEventListener(event, handler);
    this.eventHandlers.add(
      () => window.removeEventListener(event, handler)
    );
  }
  
  handleResize = () => {
    // Handle resize
  };
  
  fetchData = () => {
    // Cache with TTL
    this.cache.set(Date.now().toString(), 'data');
  };
  
  destroy(): void {
    // Clean up event listeners
    for (const cleanup of this.eventHandlers) {
      cleanup();
    }
    this.eventHandlers.clear();
    
    // Clear interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Clear cache
    this.cache.clear();
  }
}`,
      explanation: 'This implementation uses bounded caches, tracks and cleans up event listeners, and properly manages intervals.'
    }
  ],
  bestPractices: [
    'Use WeakMap/WeakSet for caching object references',
    'Implement size limits and TTL for caches',
    'Track and clean up all event listeners',
    'Clear intervals and timeouts on component destruction',
    'Use weak references for event callbacks',
    'Implement proper cleanup methods',
    'Monitor memory usage in development'
  ],
  commonPitfalls: [
    'Unbounded caches leading to memory growth',
    'Uncleaned event listeners in SPAs',
    'Forgotten setInterval cleanup',
    'Circular references in data structures',
    'Closure variables keeping references alive',
    'Not implementing proper cleanup methods'
  ]
};
