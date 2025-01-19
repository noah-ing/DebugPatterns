import { Pattern } from '../index';

export const stackTracePattern: Pattern = {
  id: 'stack-trace',
  title: 'Stack Trace Analyzer',
  description: 'A structured approach to runtime error debugging, helping developers navigate complex stack traces, identify error sources, and implement error boundaries.',
  category: 'RUNTIME',
  diagram: 'https://raw.githubusercontent.com/noah-ing/Debug-Pics/refs/heads/main/mermaid-diagram-2025-01-09-223035.svg',
  useCases: [
    'Error tracking',
    'Stack trace analysis',
    'Error boundaries',
    'Runtime debugging'
  ],
  implementation: {
    typescript: `// Real-world example: Error tracking and analysis system
interface StackFrame {
  fileName: string;
  lineNumber: number;
  columnNumber: number;
  functionName: string;
  source?: string;
}

interface ErrorReport {
  id: string;
  timestamp: Date;
  error: {
    name: string;
    message: string;
    stack: StackFrame[];
  };
  context: {
    url: string;
    userAgent: string;
    [key: string]: any;
  };
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private reports: ErrorReport[] = [];
  private contextProviders: Map<string, () => any> = new Map();
  private errorListeners: Set<(report: ErrorReport) => void> = new Set();
  private logger: Console;

  private constructor() {
    this.logger = console;
    this.setupGlobalHandlers();
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  private setupGlobalHandlers(): void {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error);
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason);
    });

    // Override console.error
    const originalError = console.error;
    console.error = (...args) => {
      const error = args[0];
      if (error instanceof Error) {
        this.handleError(error);
      }
      originalError.apply(console, args);
    };
  }

  addContextProvider(name: string, provider: () => any): void {
    this.contextProviders.set(name, provider);
  }

  addEventListener(listener: (report: ErrorReport) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  async handleError(error: Error): Promise<void> {
    try {
      const stackFrames = this.parseStackTrace(error);
      const context = this.gatherContext();

      const report: ErrorReport = {
        id: this.generateErrorId(),
        timestamp: new Date(),
        error: {
          name: error.name,
          message: error.message,
          stack: stackFrames
        },
        context
      };

      this.reports.push(report);
      this.notifyListeners(report);
      await this.sendToServer(report);

      this.logger.debug('Error report generated:', report);

    } catch (e) {
      this.logger.error('Failed to handle error:', e);
    }
  }

  private parseStackTrace(error: Error): StackFrame[] {
    const stackLines = error.stack?.split('\\n') || [];
    const frames: StackFrame[] = [];

    for (const line of stackLines) {
      const frame = this.parseStackFrame(line);
      if (frame) frames.push(frame);
    }

    return frames;
  }

  private parseStackFrame(line: string): StackFrame | null {
    // Chrome-style stack frame
    const chromeMatch = line.match(
      /at (?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+))\)?/
    );
    if (chromeMatch) {
      const [, fnName, fileName, lineNo, colNo] = chromeMatch;
      return {
        functionName: fnName || '<anonymous>',
        fileName,
        lineNumber: parseInt(lineNo, 10),
        columnNumber: parseInt(colNo, 10),
        source: line.trim()
      };
    }

    // Firefox-style stack frame
    const firefoxMatch = line.match(
      /(.*)@(.+):(\d+):(\d+)/
    );
    if (firefoxMatch) {
      const [, fnName, fileName, lineNo, colNo] = firefoxMatch;
      return {
        functionName: fnName || '<anonymous>',
        fileName,
        lineNumber: parseInt(lineNo, 10),
        columnNumber: parseInt(colNo, 10),
        source: line.trim()
      };
    }

    return null;
  }

  private gatherContext(): any {
    const context: any = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    // Add custom context from providers
    for (const [name, provider] of this.contextProviders) {
      try {
        context[name] = provider();
      } catch (e) {
        this.logger.warn(\`Context provider "\${name}" failed:\`, e);
      }
    }

    return context;
  }

  private generateErrorId(): string {
    return \`\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
  }

  private notifyListeners(report: ErrorReport): void {
    for (const listener of this.errorListeners) {
      try {
        listener(report);
      } catch (e) {
        this.logger.error('Error listener failed:', e);
      }
    }
  }

  private async sendToServer(report: ErrorReport): Promise<void> {
    try {
      const response = await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(report)
      });

      if (!response.ok) {
        throw new Error(\`Server responded with \${response.status}\`);
      }
    } catch (e) {
      this.logger.error('Failed to send error report:', e);
    }
  }

  getErrorSummary(): {
    total: number;
    recent: ErrorReport[];
    topErrors: Array<{
      name: string;
      count: number;
    }>;
  } {
    const recent = this.reports
      .slice(-10)
      .reverse();

    const errorCounts = this.reports.reduce((acc, report) => {
      const name = report.error.name;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topErrors = Object.entries(errorCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total: this.reports.length,
      recent,
      topErrors
    };
  }
}

// React Error Boundary implementation
import React from 'react';

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const { onError } = this.props;
    
    // Track error
    ErrorTracker.getInstance().handleError(error);
    
    // Call custom error handler
    if (onError) {
      onError(error, info);
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Example usage
// Initialize error tracker
const errorTracker = ErrorTracker.getInstance();

// Add context providers
errorTracker.addContextProvider('user', () => ({
  id: getCurrentUser()?.id,
  role: getCurrentUser()?.role
}));

errorTracker.addContextProvider('app', () => ({
  version: process.env.VERSION,
  environment: process.env.NODE_ENV
}));

// Add error listener
errorTracker.addEventListener((report) => {
  // Send to monitoring service
  monitoring.trackError(report);
});

// Use in React application
function App() {
  return (
    <ErrorBoundary
      fallback={<ErrorPage />}
      onError={(error, info) => {
        // Custom error handling
        notifySupport(error);
      }}
    >
      <MainContent />
    </ErrorBoundary>
  );
}

// Example error handling in async function
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(\`API error: \${response.status}\`);
    }
    return await response.json();
  } catch (error) {
    errorTracker.handleError(error);
    throw error;
  }
}`,
    python: `# Real-world example: Error tracking and analysis system
from dataclasses import dataclass
from typing import Dict, List, Optional, Any, Callable
import traceback
import sys
import logging
import asyncio
import json
from datetime import datetime
import inspect
from contextlib import contextmanager
import functools

@dataclass
class StackFrame:
    """Stack frame information"""
    filename: str
    lineno: int
    name: str
    line: Optional[str] = None
    locals: Optional[Dict[str, str]] = None

@dataclass
class ErrorReport:
    """Detailed error report"""
    id: str
    timestamp: datetime
    error_type: str
    message: str
    stack_frames: List[StackFrame]
    context: Dict[str, Any]

class ErrorTracker:
    """Error tracking and analysis system"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.reports: List[ErrorReport] = []
            self.context_providers: Dict[str, Callable[[], Any]] = {}
            self.error_handlers: List[Callable[[ErrorReport], None]] = []
            self.logger = logging.getLogger(__name__)
            self.setup_global_handlers()
            self.initialized = True

    def setup_global_handlers(self) -> None:
        """Setup global exception handlers"""
        # Override sys.excepthook
        self._original_excepthook = sys.excepthook
        sys.excepthook = self._global_exception_handler

        # Override asyncio exception handler
        loop = asyncio.get_event_loop()
        loop.set_exception_handler(self._asyncio_exception_handler)

    def _global_exception_handler(
        self,
        exc_type: type,
        exc_value: Exception,
        exc_tb: traceback.TracebackType
    ) -> None:
        """Handle uncaught exceptions"""
        self.handle_error(exc_value)
        self._original_excepthook(exc_type, exc_value, exc_tb)

    def _asyncio_exception_handler(
        self,
        loop: asyncio.AbstractEventLoop,
        context: Dict[str, Any]
    ) -> None:
        """Handle asyncio exceptions"""
        exception = context.get('exception')
        if exception:
            self.handle_error(exception)

    def add_context_provider(
        self,
        name: str,
        provider: Callable[[], Any]
    ) -> None:
        """Add a context provider"""
        self.context_providers[name] = provider

    def add_error_handler(
        self,
        handler: Callable[[ErrorReport], None]
    ) -> None:
        """Add an error handler"""
        self.error_handlers.append(handler)

    def handle_error(self, error: Exception) -> ErrorReport:
        """Process and track an error"""
        try:
            stack_frames = self._parse_traceback(error)
            context = self._gather_context()

            report = ErrorReport(
                id=self._generate_error_id(),
                timestamp=datetime.now(),
                error_type=error.__class__.__name__,
                message=str(error),
                stack_frames=stack_frames,
                context=context
            )

            self.reports.append(report)
            self._notify_handlers(report)
            
            self.logger.debug(
                'Error report generated',
                extra={'report': self._serialize_report(report)}
            )

            return report

        except Exception as e:
            self.logger.error(
                'Failed to handle error',
                exc_info=e
            )
            raise

    def _parse_traceback(self, error: Exception) -> List[StackFrame]:
        """Parse exception traceback into structured data"""
        frames = []
        tb = traceback.extract_tb(error.__traceback__)

        for frame_info in tb:
            # Get local variables if available
            locals_dict = None
            try:
                frame = sys._getframe(len(tb) - len(frames))
                locals_dict = {
                    name: repr(value)
                    for name, value in frame.f_locals.items()
                }
            except Exception:
                pass

            frames.append(StackFrame(
                filename=frame_info.filename,
                lineno=frame_info.lineno,
                name=frame_info.name,
                line=frame_info.line,
                locals=locals_dict
            ))

        return frames

    def _gather_context(self) -> Dict[str, Any]:
        """Gather context from all providers"""
        context = {
            'timestamp': datetime.now().isoformat(),
            'python_version': sys.version,
            'platform': sys.platform
        }

        # Add custom context
        for name, provider in self.context_providers.items():
            try:
                context[name] = provider()
            except Exception as e:
                self.logger.warning(
                    f'Context provider "{name}" failed',
                    exc_info=e
                )

        return context

    def _generate_error_id(self) -> str:
        """Generate unique error ID"""
        import uuid
        return str(uuid.uuid4())

    def _notify_handlers(self, report: ErrorReport) -> None:
        """Notify all error handlers"""
        for handler in self.error_handlers:
            try:
                handler(report)
            except Exception as e:
                self.logger.error(
                    'Error handler failed',
                    exc_info=e
                )

    def _serialize_report(self, report: ErrorReport) -> Dict[str, Any]:
        """Serialize error report for logging"""
        return {
            'id': report.id,
            'timestamp': report.timestamp.isoformat(),
            'error_type': report.error_type,
            'message': report.message,
            'stack_frames': [
                {
                    'filename': frame.filename,
                    'lineno': frame.lineno,
                    'name': frame.name,
                    'line': frame.line
                }
                for frame in report.stack_frames
            ],
            'context': report.context
        }

    def get_error_summary(self) -> Dict[str, Any]:
        """Generate error summary"""
        error_counts = {}
        for report in self.reports:
            error_type = report.error_type
            error_counts[error_type] = error_counts.get(error_type, 0) + 1

        return {
            'total_errors': len(self.reports),
            'recent_errors': [
                self._serialize_report(report)
                for report in self.reports[-10:]
            ],
            'error_types': [
                {'type': error_type, 'count': count}
                for error_type, count in sorted(
                    error_counts.items(),
                    key=lambda x: x[1],
                    reverse=True
                )
            ]
        }

# Error handling decorators and context managers
def track_errors(func):
    """Decorator to track function errors"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            ErrorTracker().handle_error(e)
            raise
    return wrapper

@contextmanager
def error_boundary(context: Dict[str, Any] = None):
    """Context manager for error handling"""
    tracker = ErrorTracker()
    if context:
        tracker.add_context_provider(
            'boundary_context',
            lambda: context
        )
    
    try:
        yield
    except Exception as e:
        tracker.handle_error(e)
        raise

# Example usage
# Initialize error tracker
tracker = ErrorTracker()

# Add context providers
def get_user_context():
    return {
        'user_id': current_user.id,
        'role': current_user.role
    }

def get_app_context():
    return {
        'version': APP_VERSION,
        'environment': APP_ENV
    }

tracker.add_context_provider('user', get_user_context)
tracker.add_context_provider('app', get_app_context)

# Add error handler
def send_to_monitoring(report: ErrorReport):
    monitoring_service.track_error(
        error_id=report.id,
        error_type=report.error_type,
        message=report.message,
        stack_trace=report.stack_frames,
        metadata=report.context
    )

tracker.add_error_handler(send_to_monitoring)

# Example usage with decorator
@track_errors
def process_data(data: Dict[str, Any]) -> None:
    # Process data
    result = complex_operation(data)
    save_result(result)

# Example usage with context manager
async def handle_request(request):
    with error_boundary({
        'request_id': request.id,
        'path': request.path
    }):
        # Handle request
        data = await process_request(request)
        return create_response(data)

# Example error handling in async function
async def fetch_data():
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get('/api/data') as response:
                if response.status >= 400:
                    raise ValueError(
                        f'API error: {response.status}'
                    )
                return await response.json()
    except Exception as e:
        ErrorTracker().handle_error(e)
        raise`
  },
  codeExamples: [
    {
      title: 'Common Error Handling Issues',
      language: 'typescript',
      code: `// ❌ Common error handling issues
class Service {
  // Issue 1: Generic error handling
  async fetchData() {
    try {
      const response = await fetch('/api/data');
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  // Issue 2: Swallowing errors
  processItem(item: any) {
    try {
      return this.transform(item);
    } catch {
      return null;
    }
  }
  
  // Issue 3: No error boundaries
  render() {
    return <Component />;
  }
  
  // Issue 4: Poor error information
  async saveData(data: any) {
    if (!this.validate(data)) {
      throw new Error('Invalid data');
    }
  }
}`,
      explanation: 'Common issues include generic error handling, swallowing errors, missing error boundaries, and poor error information.'
    },
    {
      title: 'Robust Error Handling',
      language: 'typescript',
      code: `// ✅ Robust error handling
class Service {
  // Specific error types
  class APIError extends Error {
    constructor(
      message: string,
      public status: number,
      public code: string
    ) {
      super(message);
      this.name = 'APIError';
    }
  }

  // Proper error handling with context
  async fetchData() {
    try {
      const response = await fetch('/api/data');
      
      if (!response.ok) {
        throw new APIError(
          'API request failed',
          response.status,
          await response.text()
        );
      }
      
      return await response.json();
      
    } catch (error) {
      // Track error with context
      ErrorTracker.getInstance().handleError(error, {
        endpoint: '/api/data',
        method: 'GET'
      });
      
      // Rethrow for boundary handling
      throw error;
    }
  }

  // Error boundary implementation
  render() {
    return (
      <ErrorBoundary
        fallback={<ErrorDisplay />}
        onError={(error) => {
          // Log error
          logger.error('Component error:', error);
          
          // Show user feedback
          notifications.show({
            type: 'error',
            message: 'Something went wrong'
          });
        }}
      >
        <Component />
      </ErrorBoundary>
    );
  }

  // Detailed error information
  async saveData(data: any) {
    const validation = this.validate(data);
    
    if (!validation.valid) {
      throw new ValidationError(
        'Data validation failed',
        validation.errors,
        {
          fields: validation.failedFields,
          data: JSON.stringify(data)
        }
      );
    }
  }

  // Cleanup on error
  async processItems(items: any[]) {
    const processed = new Set();
    
    try {
      for (const item of items) {
        await this.process(item);
        processed.add(item.id);
      }
      
    } catch (error) {
      // Cleanup processed items
      await this.rollback(Array.from(processed));
      throw error;
    }
  }
}`,
      explanation: 'This implementation includes specific error types, proper error tracking, error boundaries, and cleanup handling.'
    }
  ],
  bestPractices: [
    'Use specific error types',
    'Include error context',
    'Implement error boundaries',
    'Add error tracking',
    'Handle async errors',
    'Provide cleanup mechanisms',
    'Log error details'
  ],
  commonPitfalls: [
    'Generic error handling',
    'Swallowing errors',
    'Missing error boundaries',
    'Poor error information',
    'No error tracking',
    'Inconsistent error handling',
    'Missing cleanup on error'
  ]
};
