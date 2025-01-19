import { Pattern } from '../index';

export const stateManagementPattern: Pattern = {
  id: 'state-management',
  title: 'State Management',
  description: 'A visual approach to debugging state management issues, tracking component re-renders, state mutations, and cache invalidation patterns.',
  category: 'STATE',
  diagram: 'https://raw.githubusercontent.com/noah-ing/Debug-Pics/refs/heads/main/mermaid-diagram-2025-01-09-222959.svg',
  useCases: [
    'Complex state flows',
    'Component re-renders',
    'Cache invalidation',
    'State mutation tracking'
  ],
  implementation: {
    typescript: `// Real-world example: Type-safe state management with debugging and performance optimization
import { createContext, useContext, useCallback, useRef, useEffect } from 'react';

// Type definitions for state store
type Listener<T> = (state: T) => void;
type Selector<T, R> = (state: T) => R;
type Action<T> = (state: T) => Partial<T>;
type Middleware<T> = (action: Action<T>, state: T) => Promise<void> | void;

interface StoreConfig<T> {
  initialState: T;
  middleware?: Middleware<T>[];
  persist?: boolean;
  debug?: boolean;
}

class Store<T extends object> {
  private state: T;
  private listeners: Set<Listener<T>>;
  private middleware: Middleware<T>[];
  private debug: boolean;
  private persist: boolean;
  private updateCount: number;
  private lastUpdate: number;

  constructor(config: StoreConfig<T>) {
    this.state = this.loadInitialState(config);
    this.listeners = new Set();
    this.middleware = config.middleware || [];
    this.debug = config.debug || false;
    this.persist = config.persist || false;
    this.updateCount = 0;
    this.lastUpdate = Date.now();
  }

  private loadInitialState(config: StoreConfig<T>): T {
    if (config.persist && typeof window !== 'undefined') {
      const stored = localStorage.getItem('app_state');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('Failed to load persisted state:', e);
        }
      }
    }
    return config.initialState;
  }

  getState(): T {
    return this.state;
  }

  async dispatch(action: Action<T>): Promise<void> {
    const startTime = performance.now();
    const prevState = { ...this.state };
    
    try {
      // Run middleware before state update
      for (const middleware of this.middleware) {
        await middleware(action, prevState);
      }

      // Update state
      const update = action(prevState);
      const nextState = { ...prevState, ...update };
      
      // Validate state changes
      this.validateStateUpdate(prevState, nextState);
      
      this.state = nextState;
      this.updateCount++;
      this.lastUpdate = Date.now();

      // Persist if enabled
      if (this.persist) {
        this.persistState();
      }

      // Notify listeners
      this.notifyListeners();

      // Debug logging
      if (this.debug) {
        this.logStateUpdate(prevState, nextState, startTime);
      }

    } catch (error) {
      console.error('State update failed:', error);
      throw error;
    }
  }

  private validateStateUpdate(prev: T, next: T): void {
    // Detect accidental mutations
    if (Object.keys(next).some(key => prev[key] === next[key] && typeof prev[key] === 'object')) {
      console.warn('Possible state mutation detected. State updates should be immutable.');
    }

    // Check for undefined values
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined) {
        console.warn(\`State key "\${key}" was set to undefined. This may cause issues.\`);
      }
    });
  }

  private persistState(): void {
    try {
      localStorage.setItem('app_state', JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to persist state:', e);
    }
  }

  private logStateUpdate(prev: T, next: T, startTime: number): void {
    const duration = performance.now() - startTime;
    const changes = Object.keys(next).filter(key => prev[key] !== next[key]);
    
    console.group('State Update');
    console.log('Previous:', prev);
    console.log('Next:', next);
    console.log('Changed keys:', changes);
    console.log(\`Update took \${duration.toFixed(2)}ms\`);
    console.log(\`Total updates: \${this.updateCount}\`);
    console.groupEnd();
  }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  // Debug utilities
  getDebugInfo() {
    return {
      updateCount: this.updateCount,
      lastUpdate: new Date(this.lastUpdate).toISOString(),
      listenerCount: this.listeners.size,
      stateSize: JSON.stringify(this.state).length,
    };
  }
}

// React integration
const StoreContext = createContext<Store<any> | null>(null);

export function useStore<T extends object, R>(
  selector: Selector<T, R>,
  equalityFn: (a: R, b: R) => boolean = Object.is
): R {
  const store = useContext(StoreContext);
  if (!store) throw new Error('Store not found in context');

  const [state, setState] = useState(selector(store.getState()));
  const prevValue = useRef(state);

  useEffect(() => {
    return store.subscribe((newState) => {
      const newValue = selector(newState);
      if (!equalityFn(prevValue.current, newValue)) {
        prevValue.current = newValue;
        setState(newValue);
      }
    });
  }, [store, selector, equalityFn]);

  return state;
}

// Example usage with TypeScript
interface AppState {
  user: {
    id: string;
    name: string;
    preferences: {
      theme: 'light' | 'dark';
      notifications: boolean;
    };
  } | null;
  todos: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
  ui: {
    sidebarOpen: boolean;
    activeModal: string | null;
  };
}

// Middleware example: Logger
const loggerMiddleware: Middleware<AppState> = async (action, state) => {
  console.group('Action');
  console.log('Previous State:', state);
  console.log('Action:', action.name);
  console.groupEnd();
};

// Middleware example: Analytics
const analyticsMiddleware: Middleware<AppState> = async (action, state) => {
  if (action.name === 'updateUser') {
    analytics.track('user_updated', {
      userId: state.user?.id,
      timestamp: new Date().toISOString()
    });
  }
};

// Create store instance
const store = new Store<AppState>({
  initialState: {
    user: null,
    todos: [],
    ui: {
      sidebarOpen: false,
      activeModal: null
    }
  },
  middleware: [loggerMiddleware, analyticsMiddleware],
  persist: true,
  debug: process.env.NODE_ENV === 'development'
});

// Component example
function UserProfile() {
  const user = useStore((state: AppState) => state.user);
  const updateUser = useCallback((name: string) => {
    store.dispatch((state) => ({
      user: state.user ? { ...state.user, name } : null
    }));
  }, []);

  if (!user) return <div>Please log in</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={() => updateUser('New Name')}>
        Update Name
      </button>
    </div>
  );
}`,
    python: `# Real-world example: Type-safe state management with debugging and performance optimization
from typing import TypeVar, Generic, Callable, Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import json
import asyncio
import logging
from abc import ABC, abstractmethod

T = TypeVar('T')
State = TypeVar('State', bound=Dict[str, Any])
Selector = Callable[[State], Any]
Action = Callable[[State], Dict[str, Any]]
Middleware = Callable[[Action, State], None]

class StateError(Exception):
    """Base exception for state management errors"""
    pass

class StateMutationError(StateError):
    """Raised when illegal state mutation is detected"""
    pass

@dataclass
class StoreConfig(Generic[State]):
    """Configuration for state store"""
    initial_state: State
    middleware: Optional[List[Middleware]] = None
    persist: bool = False
    debug: bool = False

class StateObserver(ABC):
    """Abstract base class for state observers"""
    @abstractmethod
    async def on_state_change(self, state: State) -> None:
        pass

class Store(Generic[State]):
    """Type-safe state management store with debugging capabilities"""
    
    def __init__(self, config: StoreConfig[State]):
        self._state = self._load_initial_state(config)
        self._observers: List[StateObserver] = []
        self._middleware = config.middleware or []
        self._debug = config.debug
        self._persist = config.persist
        self._update_count = 0
        self._last_update = datetime.now()
        self._logger = logging.getLogger(__name__)

    def _load_initial_state(self, config: StoreConfig[State]) -> State:
        """Load initial state with persistence support"""
        if config.persist:
            try:
                with open('app_state.json', 'r') as f:
                    return json.load(f)
            except (FileNotFoundError, json.JSONDecodeError) as e:
                self._logger.warning(f"Failed to load persisted state: {e}")
        
        return config.initial_state

    def get_state(self) -> State:
        """Get current state"""
        return self._state.copy()

    async def dispatch(self, action: Action) -> None:
        """Dispatch an action to update state"""
        start_time = datetime.now()
        prev_state = self._state.copy()

        try:
            # Run middleware
            for middleware in self._middleware:
                await asyncio.create_task(
                    self._run_middleware(middleware, action, prev_state)
                )

            # Update state
            update = action(prev_state)
            next_state = {**prev_state, **update}

            # Validate state changes
            self._validate_state_update(prev_state, next_state)

            self._state = next_state
            self._update_count += 1
            self._last_update = datetime.now()

            # Persist if enabled
            if self._persist:
                await self._persist_state()

            # Notify observers
            await self._notify_observers()

            # Debug logging
            if self._debug:
                self._log_state_update(prev_state, next_state, start_time)

        except Exception as e:
            self._logger.error("State update failed", exc_info=True)
            raise StateError(f"State update failed: {str(e)}") from e

    async def _run_middleware(
        self,
        middleware: Middleware,
        action: Action,
        state: State
    ) -> None:
        """Run middleware with error handling"""
        try:
            await asyncio.create_task(middleware(action, state))
        except Exception as e:
            self._logger.error(
                f"Middleware {middleware.__name__} failed",
                exc_info=True
            )
            raise

    def _validate_state_update(
        self,
        prev: State,
        next_state: State
    ) -> None:
        """Validate state updates for common issues"""
        # Check for direct mutations
        for key in next_state:
            if (
                key in prev and
                isinstance(prev[key], dict) and
                prev[key] is next_state[key]
            ):
                raise StateMutationError(
                    f"Direct state mutation detected for key: {key}"
                )

        # Check for undefined values
        for key, value in next_state.items():
            if value is None and key in prev and prev[key] is not None:
                self._logger.warning(
                    f"State key '{key}' was set to None. "
                    "This may cause issues."
                )

    async def _persist_state(self) -> None:
        """Persist state to storage"""
        try:
            with open('app_state.json', 'w') as f:
                json.dump(self._state, f)
        except Exception as e:
            self._logger.error(f"Failed to persist state: {e}")

    def _log_state_update(
        self,
        prev: State,
        next_state: State,
        start_time: datetime
    ) -> None:
        """Log detailed state update information"""
        duration = (datetime.now() - start_time).total_seconds() * 1000
        changes = [
            key for key in next_state
            if key in prev and prev[key] != next_state[key]
        ]

        self._logger.debug(
            "State Update",
            extra={
                "previous_state": prev,
                "next_state": next_state,
                "changed_keys": changes,
                "duration_ms": duration,
                "update_count": self._update_count
            }
        )

    def add_observer(self, observer: StateObserver) -> None:
        """Add state observer"""
        self._observers.append(observer)

    def remove_observer(self, observer: StateObserver) -> None:
        """Remove state observer"""
        self._observers.remove(observer)

    async def _notify_observers(self) -> None:
        """Notify all observers of state change"""
        tasks = [
            asyncio.create_task(observer.on_state_change(self._state))
            for observer in self._observers
        ]
        await asyncio.gather(*tasks)

    def get_debug_info(self) -> Dict[str, Any]:
        """Get debug information about store"""
        return {
            "update_count": self._update_count,
            "last_update": self._last_update.isoformat(),
            "observer_count": len(self._observers),
            "state_size": len(json.dumps(self._state))
        }

# Example usage
from dataclasses import dataclass
from typing import Optional, List
from enum import Enum

class Theme(Enum):
    LIGHT = "light"
    DARK = "dark"

@dataclass
class UserPreferences:
    theme: Theme
    notifications: bool

@dataclass
class User:
    id: str
    name: str
    preferences: UserPreferences

@dataclass
class Todo:
    id: str
    text: str
    completed: bool

@dataclass
class UIState:
    sidebar_open: bool
    active_modal: Optional[str]

class AppState(TypedDict):
    user: Optional[User]
    todos: List[Todo]
    ui: UIState

# Middleware example: Logger
async def logger_middleware(action: Action, state: AppState) -> None:
    logging.debug(
        "Action dispatched",
        extra={
            "action_name": action.__name__,
            "previous_state": state
        }
    )

# Middleware example: Analytics
async def analytics_middleware(action: Action, state: AppState) -> None:
    if action.__name__ == "update_user":
        # Send to analytics service
        analytics.track(
            "user_updated",
            {
                "user_id": state.get("user", {}).get("id"),
                "timestamp": datetime.now().isoformat()
            }
        )

# Create store instance
store = Store(StoreConfig(
    initial_state={
        "user": None,
        "todos": [],
        "ui": {
            "sidebar_open": False,
            "active_modal": None
        }
    },
    middleware=[logger_middleware, analytics_middleware],
    persist=True,
    debug=True
))

# Example component observer
class UserProfileObserver(StateObserver):
    async def on_state_change(self, state: AppState) -> None:
        user = state.get("user")
        if user:
            # Update UI with user data
            await self.render_user_profile(user)

    async def render_user_profile(self, user: User) -> None:
        # Render user profile
        pass

# Example usage
async def update_user_name(name: str) -> None:
    async def update_action(state: AppState) -> Dict[str, Any]:
        if not state["user"]:
            raise StateError("No user logged in")
            
        return {
            "user": {
                **state["user"],
                "name": name
            }
        }

    await store.dispatch(update_action)

# Error handling example
async def main():
    try:
        await update_user_name("New Name")
    except StateError as e:
        logging.error(f"Failed to update user: {e}")
    except Exception as e:
        logging.error("Unexpected error", exc_info=True)`
  },
  codeExamples: [
    {
      title: 'Common State Management Issues',
      language: 'typescript',
      code: `// ❌ Common state management issues
class Component {
  // Issue 1: Direct state mutation
  updateUser(name: string) {
    this.state.user.name = name;
  }
  
  // Issue 2: No state immutability
  addTodo(todo: Todo) {
    this.state.todos.push(todo);
  }
  
  // Issue 3: Inconsistent updates
  async fetchUser() {
    const user = await api.getUser();
    this.state.user = user;
    // Preferences might be out of sync
  }
  
  // Issue 4: No cleanup
  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
  }
}`,
      explanation: 'Common issues include direct state mutations, lack of immutability, inconsistent updates, and missing cleanup.'
    },
    {
      title: 'Robust State Management',
      language: 'typescript',
      code: `// ✅ Robust state management
class Component {
  // Immutable state updates
  updateUser(name: string) {
    this.setState(state => ({
      user: state.user
        ? { ...state.user, name }
        : null
    }));
  }
  
  // Batch related updates
  async fetchUserWithPreferences() {
    const [user, preferences] = await Promise.all([
      api.getUser(),
      api.getUserPreferences()
    ]);
    
    this.setState({
      user: { ...user, preferences }
    });
  }
  
  // Proper cleanup
  componentDidMount() {
    const handler = this.handleResize.bind(this);
    window.addEventListener('resize', handler);
    
    return () => {
      window.removeEventListener('resize', handler);
    };
  }
  
  // Optimized re-renders
  shouldComponentUpdate(nextProps, nextState) {
    return !isEqual(this.state, nextState) ||
           !isEqual(this.props, nextProps);
  }
}`,
      explanation: 'This implementation uses immutable updates, batches related changes, includes proper cleanup, and optimizes re-renders.'
    }
  ],
  bestPractices: [
    'Use immutable state updates',
    'Implement proper type safety',
    'Batch related state changes',
    'Add debugging capabilities',
    'Include state persistence',
    'Optimize component re-renders',
    'Handle cleanup properly'
  ],
  commonPitfalls: [
    'Direct state mutations',
    'Missing type safety',
    'Inconsistent state updates',
    'No performance optimization',
    'Memory leaks from missing cleanup',
    'Poor error handling',
    'Lack of debugging tools'
  ]
};
