import { Pattern } from '../index';

export const apiIntegrationPattern: Pattern = {
  id: 'api-integration',
  title: 'API Integration',
  description: 'A comprehensive debugging flow for API integrations, focusing on request/response cycles, error handling patterns, and timeout/retry strategies.',
  category: 'INTEGRATION',
  diagram: 'https://raw.githubusercontent.com/noah-ing/Debug-Pics/refs/heads/main/mermaid-diagram-2025-01-09-222949.svg',
  useCases: [
    'Complex API integrations',
    'Error handling strategies',
    'Request/response debugging',
    'Timeout and retry patterns'
  ],
  implementation: {
    typescript: `// Real-world example: Robust API client with retries, caching, and error handling
interface RequestConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  cacheTTL?: number;
}

interface APIResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

interface APIError extends Error {
  status?: number;
  code?: string;
  response?: any;
}

class APIClient {
  private baseURL: string;
  private timeout: number;
  private retries: number;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTTL: number;
  private logger: Console;

  constructor(config: RequestConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 5000;
    this.retries = config.retries || 3;
    this.cacheTTL = config.cacheTTL || 300000; // 5 minutes
    this.cache = new Map();
    this.logger = console;
  }

  async get<T>(path: string, options: {
    useCache?: boolean;
    headers?: Record<string, string>;
  } = {}): Promise<APIResponse<T>> {
    const cacheKey = \`GET:\${path}\`;
    
    // Check cache if enabled
    if (options.useCache) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await this.executeWithRetry<T>('GET', path, null, options.headers);
      
      // Cache successful responses
      if (options.useCache) {
        this.setInCache(cacheKey, response);
      }

      return response;
    } catch (error) {
      this.handleError(error, 'GET', path);
      throw error;
    }
  }

  async post<T>(
    path: string,
    data: any,
    headers?: Record<string, string>
  ): Promise<APIResponse<T>> {
    try {
      return await this.executeWithRetry<T>('POST', path, data, headers);
    } catch (error) {
      this.handleError(error, 'POST', path);
      throw error;
    }
  }

  private async executeWithRetry<T>(
    method: string,
    path: string,
    data?: any,
    headers?: Record<string, string>,
    attempt: number = 1
  ): Promise<APIResponse<T>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(\`\${this.baseURL}\${path}\`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw this.createAPIError(response);
      }

      const responseData = await response.json();
      
      return {
        data: responseData,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      };

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(\`Request timeout after \${this.timeout}ms\`);
      }

      if (this.shouldRetry(error) && attempt < this.retries) {
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        
        this.logger.warn(\`Retrying \${method} \${path} after \${backoffDelay}ms (attempt \${attempt})\`);
        
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return this.executeWithRetry<T>(method, path, data, headers, attempt + 1);
      }

      throw error;
    }
  }

  private shouldRetry(error: any): boolean {
    // Retry on network errors and 5xx responses
    if (error instanceof Error && error.name === 'TypeError') {
      return true;
    }
    
    return error.status ? error.status >= 500 : false;
  }

  private createAPIError(response: Response): APIError {
    const error: APIError = new Error(\`HTTP Error \${response.status}\`);
    error.status = response.status;
    error.code = response.statusText;
    return error;
  }

  private getFromCache<T>(key: string): APIResponse<T> | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setInCache(key: string, data: any): void {
    // Implement LRU if needed
    if (this.cache.size >= 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private handleError(error: any, method: string, path: string): void {
    this.logger.error('API Request Failed', {
      method,
      path,
      error: {
        message: error.message,
        status: error.status,
        code: error.code
      }
    });
  }
}

// Example usage with error handling and retries
async function fetchUserData(userId: string) {
  const api = new APIClient({
    baseURL: 'https://api.example.com',
    timeout: 5000,
    retries: 3
  });

  try {
    // GET with caching
    const user = await api.get(\`/users/\${userId}\`, { useCache: true });
    
    // POST with error handling
    const userPreferences = await api.post(\`/users/\${userId}/preferences\`, {
      theme: 'dark',
      notifications: true
    });

    return {
      user: user.data,
      preferences: userPreferences.data
    };

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        // Handle timeout
        console.error('Request timed out');
      } else if ((error as APIError).status === 404) {
        // Handle not found
        console.error('User not found');
      } else {
        // Handle other errors
        console.error('Failed to fetch user data:', error.message);
      }
    }
    throw error;
  }
}`,
    python: `# Real-world example: Robust API client with retries, caching, and error handling
from dataclasses import dataclass
from typing import Optional, Dict, Any, TypeVar, Generic
import aiohttp
import asyncio
import logging
from datetime import datetime, timedelta
import json
from abc import ABC, abstractmethod

T = TypeVar('T')

@dataclass
class APIResponse(Generic[T]):
    """Typed API response wrapper"""
    data: T
    status: int
    headers: Dict[str, str]

class APIError(Exception):
    """Custom API exception with detailed error information"""
    def __init__(
        self,
        message: str,
        status: Optional[int] = None,
        code: Optional[str] = None,
        response: Optional[Any] = None
    ):
        super().__init__(message)
        self.status = status
        self.code = code
        self.response = response

class CacheStrategy(ABC):
    """Abstract base class for cache strategies"""
    @abstractmethod
    async def get(self, key: str) -> Optional[Any]:
        pass

    @abstractmethod
    async def set(self, key: str, value: Any) -> None:
        pass

class InMemoryCache(CacheStrategy):
    """Simple in-memory cache with TTL"""
    def __init__(self, ttl_seconds: int = 300):
        self._cache: Dict[str, tuple[Any, datetime]] = {}
        self._ttl = timedelta(seconds=ttl_seconds)

    async def get(self, key: str) -> Optional[Any]:
        if key not in self._cache:
            return None

        value, timestamp = self._cache[key]
        if datetime.now() - timestamp > self._ttl:
            del self._cache[key]
            return None

        return value

    async def set(self, key: str, value: Any) -> None:
        # Simple LRU-like cleanup
        if len(self._cache) >= 100:
            oldest_key = min(
                self._cache.keys(),
                key=lambda k: self._cache[k][1]
            )
            del self._cache[oldest_key]

        self._cache[key] = (value, datetime.now())

class APIClient:
    """Robust API client with retries, caching, and error handling"""
    
    def __init__(
        self,
        base_url: str,
        timeout: float = 5.0,
        max_retries: int = 3,
        cache_strategy: Optional[CacheStrategy] = None
    ):
        self.base_url = base_url
        self.timeout = timeout
        self.max_retries = max_retries
        self.cache = cache_strategy or InMemoryCache()
        self.logger = logging.getLogger(__name__)
        
        # Session configuration
        self.session: Optional[aiohttp.ClientSession] = None
        self._closed = False

    async def __aenter__(self) -> 'APIClient':
        await self.ensure_session()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        await self.close()

    async def ensure_session(self) -> None:
        """Ensure aiohttp session is created"""
        if self.session is None or self._closed:
            timeout = aiohttp.ClientTimeout(total=self.timeout)
            self.session = aiohttp.ClientSession(
                timeout=timeout,
                raise_for_status=True
            )
            self._closed = False

    async def close(self) -> None:
        """Close the client session"""
        if self.session and not self._closed:
            await self.session.close()
            self._closed = True

    async def get(
        self,
        path: str,
        *,
        use_cache: bool = False,
        headers: Optional[Dict[str, str]] = None
    ) -> APIResponse:
        """Execute GET request with optional caching"""
        cache_key = f"GET:{path}"
        
        # Check cache if enabled
        if use_cache:
            cached = await self.cache.get(cache_key)
            if cached:
                return cached

        try:
            response = await self._execute_with_retry(
                'GET',
                path,
                headers=headers
            )
            
            # Cache successful responses
            if use_cache:
                await self.cache.set(cache_key, response)
                
            return response

        except Exception as e:
            self._handle_error(e, 'GET', path)
            raise

    async def post(
        self,
        path: str,
        data: Any,
        headers: Optional[Dict[str, str]] = None
    ) -> APIResponse:
        """Execute POST request"""
        try:
            return await self._execute_with_retry(
                'POST',
                path,
                data=data,
                headers=headers
            )
        except Exception as e:
            self._handle_error(e, 'POST', path)
            raise

    async def _execute_with_retry(
        self,
        method: str,
        path: str,
        *,
        data: Any = None,
        headers: Optional[Dict[str, str]] = None,
        attempt: int = 1
    ) -> APIResponse:
        """Execute request with retry logic"""
        await self.ensure_session()
        
        try:
            async with self.session.request(
                method,
                f"{self.base_url}{path}",
                json=data,
                headers=headers
            ) as response:
                response_data = await response.json()
                
                return APIResponse(
                    data=response_data,
                    status=response.status,
                    headers=dict(response.headers)
                )

        except asyncio.TimeoutError:
            raise APIError(
                f"Request timeout after {self.timeout} seconds"
            )

        except aiohttp.ClientError as e:
            if self._should_retry(e) and attempt < self.max_retries:
                backoff = min(1 * (2 ** (attempt - 1)), 10)
                
                self.logger.warning(
                    f"Retrying {method} {path} "
                    f"after {backoff}s (attempt {attempt})"
                )
                
                await asyncio.sleep(backoff)
                
                return await self._execute_with_retry(
                    method,
                    path,
                    data=data,
                    headers=headers,
                    attempt=attempt + 1
                )
                
            raise self._create_api_error(e)

    def _should_retry(self, error: Exception) -> bool:
        """Determine if request should be retried"""
        if isinstance(error, aiohttp.ServerTimeoutError):
            return True
            
        if isinstance(error, aiohttp.ClientResponseError):
            return error.status >= 500
            
        return isinstance(error, (
            aiohttp.ServerDisconnectedError,
            aiohttp.ClientConnectorError
        ))

    def _create_api_error(self, error: Exception) -> APIError:
        """Create appropriate API error from exception"""
        if isinstance(error, aiohttp.ClientResponseError):
            return APIError(
                str(error),
                status=error.status,
                code=str(error.code)
            )
            
        return APIError(str(error))

    def _handle_error(
        self,
        error: Exception,
        method: str,
        path: str
    ) -> None:
        """Log error details"""
        self.logger.error(
            "API Request Failed",
            extra={
                "method": method,
                "path": path,
                "error": {
                    "type": type(error).__name__,
                    "message": str(error),
                    "status": getattr(error, 'status', None),
                    "code": getattr(error, 'code', None)
                }
            }
        )

# Example usage with error handling and retries
async def fetch_user_data(user_id: str) -> Dict[str, Any]:
    async with APIClient(
        base_url="https://api.example.com",
        timeout=5.0,
        max_retries=3
    ) as api:
        try:
            # GET with caching
            user = await api.get(
                f"/users/{user_id}",
                use_cache=True
            )
            
            # POST with error handling
            preferences = await api.post(
                f"/users/{user_id}/preferences",
                data={
                    "theme": "dark",
                    "notifications": True
                }
            )

            return {
                "user": user.data,
                "preferences": preferences.data
            }

        except APIError as e:
            if e.status == 404:
                logging.error("User not found")
            elif isinstance(e, asyncio.TimeoutError):
                logging.error("Request timed out")
            else:
                logging.error(
                    f"Failed to fetch user data: {e}",
                    exc_info=True
                )
            raise

# Usage in async context
async def main():
    try:
        user_data = await fetch_user_data("123")
        print(user_data)
    except APIError as e:
        print(f"API Error: {e}")
`
  },
  codeExamples: [
    {
      title: 'Common API Integration Issues',
      language: 'typescript',
      code: `// ❌ Common API integration issues
async function fetchUserData(userId: string) {
  // Issue 1: No error handling
  const response = await fetch(\`/api/users/\${userId}\`);
  const data = await response.json();
  
  // Issue 2: No timeout handling
  const preferences = await fetch(\`/api/users/\${userId}/preferences\`);
  
  // Issue 3: No retry logic
  if (!response.ok) {
    throw new Error('Request failed');
  }
  
  // Issue 4: No request cancellation
  const longRequest = await fetch('/api/long-operation');
  
  return data;
}`,
      explanation: 'Common issues include missing error handling, no timeout handling, lack of retry logic, and no request cancellation.'
    },
    {
      title: 'Robust API Integration',
      language: 'typescript',
      code: `// ✅ Robust API integration
async function fetchUserData(userId: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    // Parallel requests with timeout
    const [userResponse, preferencesResponse] = await Promise.all([
      fetch(\`/api/users/\${userId}\`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      }),
      fetch(\`/api/users/\${userId}/preferences\`, {
        signal: controller.signal
      })
    ]);

    // Validate responses
    if (!userResponse.ok) {
      throw new Error(\`User request failed: \${userResponse.status}\`);
    }
    if (!preferencesResponse.ok) {
      throw new Error(\`Preferences request failed: \${preferencesResponse.status}\`);
    }

    // Parse responses
    const [userData, preferences] = await Promise.all([
      userResponse.json(),
      preferencesResponse.json()
    ]);

    return {
      user: userData,
      preferences
    };

  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      // Log error details
      console.error('API request failed:', {
        userId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
    throw error;
    
  } finally {
    clearTimeout(timeout);
  }
}`,
      explanation: 'This implementation includes timeout handling, parallel requests, proper error handling, and request cancellation.'
    }
  ],
  bestPractices: [
    'Implement proper error handling with specific error types',
    'Use timeouts for all requests',
    'Implement retry logic with exponential backoff',
    'Add request/response logging',
    'Use request cancellation',
    'Implement caching where appropriate',
    'Handle rate limiting and backoff'
  ],
  commonPitfalls: [
    'Missing error handling',
    'No timeout implementation',
    'Lack of retry logic',
    'Poor logging practices',
    'Missing request cancellation',
    'Not handling rate limits',
    'Inadequate response validation'
  ]
};
