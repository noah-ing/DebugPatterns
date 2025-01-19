import { Pattern } from '../index';

export const performanceBottleneckPattern: Pattern = {
  id: 'performance-bottleneck',
  title: 'Performance Bottleneck',
  description: 'A systematic method for identifying and resolving performance bottlenecks through waterfall diagrams, load time analysis, and resource optimization.',
  category: 'PERFORMANCE',
  diagram: 'https://raw.githubusercontent.com/noah-ing/Debug-Pics/refs/heads/main/mermaid-diagram-2025-01-09-223020.svg',
  useCases: [
    'Load time optimization',
    'Resource utilization',
    'Performance monitoring',
    'Bottleneck identification'
  ],
  implementation: {
    typescript: `// Real-world example: Performance monitoring and optimization toolkit
interface PerformanceMetrics {
  fps: number;
  memory: {
    used: number;
    total: number;
  };
  timing: {
    [key: string]: number;
  };
  resources: Array<{
    name: string;
    size: number;
    loadTime: number;
  }>;
}

interface ProfilerOptions {
  sampleInterval?: number;
  maxDataPoints?: number;
  enableMemoryProfiling?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

class PerformanceProfiler {
  private metrics: PerformanceMetrics[];
  private sampleInterval: number;
  private maxDataPoints: number;
  private isRunning: boolean;
  private intervalId?: number;
  private marks: Map<string, number>;
  private resourceObserver?: PerformanceObserver;
  private logger: Console;

  constructor(options: ProfilerOptions = {}) {
    this.metrics = [];
    this.sampleInterval = options.sampleInterval || 1000;
    this.maxDataPoints = options.maxDataPoints || 100;
    this.isRunning = false;
    this.marks = new Map();
    this.logger = console;

    // Initialize performance observers
    this.setupObservers();
  }

  private setupObservers(): void {
    // Resource timing observer
    try {
      this.resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.entryType === 'resource') {
            this.logResourceTiming(entry as PerformanceResourceTiming);
          }
        });
      });

      this.resourceObserver.observe({
        entryTypes: ['resource']
      });

    } catch (error) {
      this.logger.warn('Resource timing API not supported:', error);
    }
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.collectMetrics();
    
    this.intervalId = window.setInterval(
      () => this.collectMetrics(),
      this.sampleInterval
    );
  }

  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      throw new Error(\`Start mark "\${startMark}" not found\`);
    }

    const duration = performance.now() - start;
    this.logger.debug(\`Measurement "\${name}": \${duration.toFixed(2)}ms\`);
    return duration;
  }

  private async collectMetrics(): Promise<void> {
    try {
      const metrics: PerformanceMetrics = {
        fps: await this.measureFPS(),
        memory: this.getMemoryUsage(),
        timing: this.getPageTiming(),
        resources: this.getResourceMetrics()
      };

      this.metrics.push(metrics);

      // Maintain max data points
      if (this.metrics.length > this.maxDataPoints) {
        this.metrics.shift();
      }

      this.analyzeMetrics(metrics);

    } catch (error) {
      this.logger.error('Failed to collect metrics:', error);
    }
  }

  private async measureFPS(): Promise<number> {
    return new Promise(resolve => {
      requestAnimationFrame((t1) => {
        requestAnimationFrame((t2) => {
          resolve(1000 / (t2 - t1));
        });
      });
    });
  }

  private getMemoryUsage(): { used: number; total: number } {
    // Use performance.memory if available (Chrome only)
    const memory = (performance as any).memory;
    if (memory) {
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize
      };
    }

    // Fallback to rough estimation
    return {
      used: 0,
      total: 0
    };
  }

  private getPageTiming(): { [key: string]: number } {
    const timing = performance.timing;
    return {
      loadTime: timing.loadEventEnd - timing.navigationStart,
      domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
      firstPaint: this.getFirstPaint(),
      ttfb: timing.responseStart - timing.navigationStart
    };
  }

  private getFirstPaint(): number {
    const paint = performance.getEntriesByType('paint')
      .find(entry => entry.name === 'first-paint');
    
    return paint ? paint.startTime : 0;
  }

  private getResourceMetrics(): Array<{
    name: string;
    size: number;
    loadTime: number;
  }> {
    return performance.getEntriesByType('resource')
      .map(entry => ({
        name: entry.name,
        size: (entry as PerformanceResourceTiming).encodedBodySize || 0,
        loadTime: entry.duration
      }));
  }

  private logResourceTiming(entry: PerformanceResourceTiming): void {
    const timing = {
      name: entry.name,
      type: entry.initiatorType,
      size: entry.encodedBodySize,
      duration: entry.duration,
      // Network timing
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart
    };

    this.logger.debug('Resource Timing:', timing);
  }

  private analyzeMetrics(metrics: PerformanceMetrics): void {
    // FPS analysis
    if (metrics.fps < 30) {
      this.logger.warn('Low FPS detected:', {
        current: metrics.fps,
        threshold: 30
      });
    }

    // Memory analysis
    const memoryUsage = (metrics.memory.used / metrics.memory.total) * 100;
    if (memoryUsage > 80) {
      this.logger.warn('High memory usage:', {
        usage: \`\${memoryUsage.toFixed(1)}%\`,
        threshold: '80%'
      });
    }

    // Load time analysis
    if (metrics.timing.loadTime > 3000) {
      this.logger.warn('Slow page load:', {
        loadTime: \`\${metrics.timing.loadTime}ms\`,
        threshold: '3000ms'
      });
    }

    // Resource analysis
    const largeResources = metrics.resources
      .filter(r => r.size > 1000000)
      .map(r => ({
        name: r.name,
        size: \`\${(r.size / 1000000).toFixed(1)}MB\`
      }));

    if (largeResources.length > 0) {
      this.logger.warn('Large resources detected:', largeResources);
    }
  }

  getMetricsSummary(): {
    averageFPS: number;
    peakMemory: number;
    slowestResources: Array<{ name: string; loadTime: number }>;
  } {
    const averageFPS = this.metrics.reduce(
      (sum, m) => sum + m.fps,
      0
    ) / this.metrics.length;

    const peakMemory = Math.max(
      ...this.metrics.map(m => m.memory.used)
    );

    const allResources = this.metrics
      .flatMap(m => m.resources)
      .sort((a, b) => b.loadTime - a.loadTime)
      .slice(0, 5);

    return {
      averageFPS,
      peakMemory,
      slowestResources: allResources
    };
  }

  generateReport(): string {
    const summary = this.getMetricsSummary();
    
    return \`Performance Report
----------------
Average FPS: \${summary.averageFPS.toFixed(1)}
Peak Memory: \${(summary.peakMemory / 1000000).toFixed(1)}MB
Slowest Resources:
\${summary.slowestResources
  .map(r => \`- \${r.name}: \${r.loadTime.toFixed(0)}ms\`)
  .join('\\n')
}\`;
  }
}

// Example usage: Performance optimization for image loading
class ImageOptimizer {
  private observer: IntersectionObserver;
  private profiler: PerformanceProfiler;

  constructor() {
    this.profiler = new PerformanceProfiler();
    
    // Setup intersection observer for lazy loading
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );
  }

  optimize(imageElement: HTMLImageElement): void {
    // Start performance monitoring
    this.profiler.mark(\`image_start_\${imageElement.src}\`);

    // Add lazy loading
    imageElement.loading = 'lazy';

    // Observe for viewport entry
    this.observer.observe(imageElement);

    // Add srcset for responsive images
    this.addResponsiveSources(imageElement);
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        
        // Load image
        img.src = img.dataset.src || img.src;
        
        // Measure load performance
        img.onload = () => {
          this.profiler.measure(
            \`image_load_\${img.src}\`,
            \`image_start_\${img.src}\`
          );
        };

        // Stop observing
        this.observer.unobserve(img);
      }
    });
  }

  private addResponsiveSources(img: HTMLImageElement): void {
    // Generate srcset for different viewport sizes
    const sizes = [320, 640, 1280, 1920];
    const srcset = sizes
      .map(size => \`\${this.getOptimizedUrl(img.src, size)} \${size}w\`)
      .join(',');

    img.srcset = srcset;
    img.sizes = '(max-width: 320px) 320px, (max-width: 640px) 640px, 1280px';
  }

  private getOptimizedUrl(url: string, width: number): string {
    // Add image optimization service parameters
    return \`\${url}?width=\${width}&quality=80\`;
  }
}

// Example usage
const profiler = new PerformanceProfiler({
  sampleInterval: 1000,
  maxDataPoints: 100,
  enableMemoryProfiling: true,
  logLevel: 'warn'
});

// Start monitoring
profiler.start();

// Optimize images
const imageOptimizer = new ImageOptimizer();
document.querySelectorAll('img').forEach(img => {
  imageOptimizer.optimize(img);
});

// Generate report after page load
window.addEventListener('load', () => {
  const report = profiler.generateReport();
  console.log(report);
});`,
    python: `# Real-world example: Performance monitoring and optimization toolkit
from dataclasses import dataclass
from typing import Dict, List, Optional, Union
import time
import asyncio
import logging
import psutil
import tracemalloc
from datetime import datetime
from functools import wraps
from contextlib import contextmanager

@dataclass
class ResourceMetrics:
    """Resource usage metrics"""
    name: str
    size: int
    load_time: float

@dataclass
class PerformanceMetrics:
    """Performance metrics container"""
    cpu_usage: float
    memory_usage: Dict[str, int]
    timing: Dict[str, float]
    resources: List[ResourceMetrics]
    timestamp: datetime

class PerformanceProfiler:
    """Performance profiling and monitoring toolkit"""
    
    def __init__(
        self,
        sample_interval: float = 1.0,
        max_data_points: int = 100,
        enable_memory_profiling: bool = True,
        log_level: str = 'WARNING'
    ):
        self.metrics: List[PerformanceMetrics] = []
        self.sample_interval = sample_interval
        self.max_data_points = max_data_points
        self.is_running = False
        self.marks: Dict[str, float] = {}
        self.enable_memory_profiling = enable_memory_profiling
        
        # Setup logging
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(log_level)
        
        # Initialize tracemalloc if memory profiling is enabled
        if enable_memory_profiling:
            tracemalloc.start()

    async def start(self) -> None:
        """Start performance monitoring"""
        if self.is_running:
            return

        self.is_running = True
        await self.collect_metrics()
        
        while self.is_running:
            await asyncio.sleep(self.sample_interval)
            await self.collect_metrics()

    def stop(self) -> None:
        """Stop performance monitoring"""
        self.is_running = False
        if self.enable_memory_profiling:
            tracemalloc.stop()

    def mark(self, name: str) -> None:
        """Set a timing mark"""
        self.marks[name] = time.perf_counter()

    def measure(self, name: str, start_mark: str) -> float:
        """Measure time since a mark"""
        if start_mark not in self.marks:
            raise KeyError(f'Start mark "{start_mark}" not found')

        duration = time.perf_counter() - self.marks[start_mark]
        self.logger.debug(
            f'Measurement "{name}": {duration:.2f}s'
        )
        return duration

    async def collect_metrics(self) -> None:
        """Collect current performance metrics"""
        try:
            metrics = PerformanceMetrics(
                cpu_usage=psutil.cpu_percent(),
                memory_usage=self.get_memory_usage(),
                timing=self.get_timing_metrics(),
                resources=self.get_resource_metrics(),
                timestamp=datetime.now()
            )

            self.metrics.append(metrics)

            # Maintain max data points
            if len(self.metrics) > self.max_data_points:
                self.metrics.pop(0)

            self.analyze_metrics(metrics)

        except Exception as e:
            self.logger.error(
                f'Failed to collect metrics: {e}',
                exc_info=True
            )

    def get_memory_usage(self) -> Dict[str, int]:
        """Get current memory usage statistics"""
        process = psutil.Process()
        memory_info = process.memory_info()

        usage = {
            'rss': memory_info.rss,
            'vms': memory_info.vms
        }

        if self.enable_memory_profiling:
            current, peak = tracemalloc.get_traced_memory()
            usage.update({
                'traced_current': current,
                'traced_peak': peak
            })

        return usage

    def get_timing_metrics(self) -> Dict[str, float]:
        """Get timing-related metrics"""
        return {
            'uptime': time.time() - psutil.boot_time(),
            'process_time': time.process_time()
        }

    def get_resource_metrics(self) -> List[ResourceMetrics]:
        """Get resource usage metrics"""
        resources = []
        process = psutil.Process()

        # Open files
        for file in process.open_files():
            resources.append(
                ResourceMetrics(
                    name=file.path,
                    size=file.size if hasattr(file, 'size') else 0,
                    load_time=0  # Not available for files
                )
            )

        return resources

    def analyze_metrics(self, metrics: PerformanceMetrics) -> None:
        """Analyze metrics for potential issues"""
        # CPU analysis
        if metrics.cpu_usage > 80:
            self.logger.warning(
                'High CPU usage detected',
                extra={
                    'cpu_usage': metrics.cpu_usage,
                    'threshold': 80
                }
            )

        # Memory analysis
        rss_gb = metrics.memory_usage['rss'] / (1024 ** 3)
        if rss_gb > 1.0:  # 1GB threshold
            self.logger.warning(
                'High memory usage detected',
                extra={
                    'memory_gb': f'{rss_gb:.1f}',
                    'threshold': '1.0GB'
                }
            )

        # Resource analysis
        for resource in metrics.resources:
            size_mb = resource.size / (1024 ** 2)
            if size_mb > 100:  # 100MB threshold
                self.logger.warning(
                    'Large resource detected',
                    extra={
                        'resource': resource.name,
                        'size_mb': f'{size_mb:.1f}'
                    }
                )

    def get_metrics_summary(self) -> Dict[str, Union[float, List[Dict]]]:
        """Generate metrics summary"""
        if not self.metrics:
            return {
                'average_cpu': 0.0,
                'peak_memory': 0,
                'resource_usage': []
            }

        average_cpu = sum(
            m.cpu_usage for m in self.metrics
        ) / len(self.metrics)

        peak_memory = max(
            m.memory_usage['rss'] for m in self.metrics
        )

        # Aggregate resource usage
        resource_usage = {}
        for metric in self.metrics:
            for resource in metric.resources:
                if resource.name not in resource_usage:
                    resource_usage[resource.name] = {
                        'size': resource.size,
                        'count': 1
                    }
                else:
                    usage = resource_usage[resource.name]
                    usage['size'] = max(usage['size'], resource.size)
                    usage['count'] += 1

        return {
            'average_cpu': average_cpu,
            'peak_memory': peak_memory,
            'resource_usage': [
                {
                    'name': name,
                    'average_size': stats['size'] / stats['count'],
                    'peak_size': stats['size'],
                    'access_count': stats['count']
                }
                for name, stats in resource_usage.items()
            ]
        }

    def generate_report(self) -> str:
        """Generate performance report"""
        summary = self.get_metrics_summary()
        
        return f"""Performance Report
----------------
Average CPU Usage: {summary['average_cpu']:.1f}%
Peak Memory Usage: {summary['peak_memory'] / (1024 ** 2):.1f}MB
Resource Usage:
{chr(10).join(
    f"- {r['name']}: "
    f"Avg: {r['average_size'] / (1024 ** 2):.1f}MB, "
    f"Peak: {r['peak_size'] / (1024 ** 2):.1f}MB, "
    f"Accesses: {r['access_count']}"
    for r in summary['resource_usage']
)}"""

# Performance monitoring decorators
def monitor_performance(func):
    """Decorator to monitor function performance"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        profiler = PerformanceProfiler()
        start_time = time.perf_counter()
        
        try:
            return await func(*args, **kwargs)
        finally:
            duration = time.perf_counter() - start_time
            logging.info(
                f'{func.__name__} execution time: {duration:.2f}s'
            )
            
    return wrapper

@contextmanager
def performance_context(name: str):
    """Context manager for performance monitoring"""
    profiler = PerformanceProfiler()
    start_time = time.perf_counter()
    
    try:
        yield profiler
    finally:
        duration = time.perf_counter() - start_time
        logging.info(f'{name} execution time: {duration:.2f}s')

# Example usage
async def main():
    # Initialize profiler
    profiler = PerformanceProfiler(
        sample_interval=1.0,
        max_data_points=100,
        enable_memory_profiling=True,
        log_level='WARNING'
    )

    # Start monitoring
    monitoring_task = asyncio.create_task(profiler.start())

    try:
        # Your application code here
        await asyncio.sleep(10)  # Simulate work

    finally:
        # Stop monitoring and generate report
        profiler.stop()
        print(profiler.generate_report())

    await monitoring_task

# Example with decorator
@monitor_performance
async def process_data(data: List[dict]) -> None:
    for item in data:
        # Process item
        await asyncio.sleep(0.1)

# Example with context manager
async def batch_operation():
    with performance_context('batch_processing'):
        # Perform batch operation
        await asyncio.sleep(1)

if __name__ == '__main__':
    asyncio.run(main())`
  },
  codeExamples: [
    {
      title: 'Common Performance Issues',
      language: 'typescript',
      code: `// ❌ Common performance issues
class DataGrid {
  // Issue 1: Inefficient rendering
  render() {
    this.items.forEach(item => {
      const element = document.createElement('div');
      element.innerHTML = item.toString();
      this.container.appendChild(element);
    });
  }
  
  // Issue 2: Memory leaks
  attachListeners() {
    window.addEventListener('scroll', () => {
      this.handleScroll();
    });
  }
  
  // Issue 3: Blocking operations
  processData(items: any[]) {
    for (const item of items) {
      const result = heavyCalculation(item);
      this.results.push(result);
    }
  }
  
  // Issue 4: Unoptimized images
  loadImages() {
    this.images.forEach(src => {
      const img = new Image();
      img.src = src;
      this.container.appendChild(img);
    });
  }
}`,
      explanation: 'Common performance issues include inefficient DOM operations, memory leaks, blocking operations, and unoptimized resource loading.'
    },
    {
      title: 'Optimized Implementation',
      language: 'typescript',
      code: `// ✅ Optimized implementation
class DataGrid {
  // Efficient rendering with DocumentFragment
  render() {
    const fragment = document.createDocumentFragment();
    
    requestAnimationFrame(() => {
      this.items.forEach(item => {
        const element = document.createElement('div');
        element.textContent = item.toString();
        fragment.appendChild(element);
      });
      
      this.container.appendChild(fragment);
    });
  }
  
  // Proper event cleanup
  private cleanup: Array<() => void> = [];
  
  attachListeners() {
    const handler = this.handleScroll.bind(this);
    window.addEventListener('scroll', handler);
    this.cleanup.push(() => {
      window.removeEventListener('scroll', handler);
    });
  }
  
  // Non-blocking operations with chunking
  async processData(items: any[]) {
    const chunkSize = 100;
    
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      
      // Process chunk in next tick
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const results = chunk.map(heavyCalculation);
      this.results.push(...results);
      
      // Update progress
      this.updateProgress(i / items.length);
    }
  }
  
  // Optimized image loading
  loadImages() {
    const imageLoader = new ImageOptimizer();
    
    this.images.forEach(src => {
      const img = new Image();
      
      imageLoader.optimize(img);
      img.dataset.src = src; // For lazy loading
      
      this.container.appendChild(img);
    });
  }
  
  destroy() {
    // Clean up event listeners
    this.cleanup.forEach(cleanup => cleanup());
    this.cleanup = [];
  }
}`,
      explanation: 'This implementation uses efficient DOM operations, proper cleanup, non-blocking operations, and optimized resource loading.'
    }
  ],
  bestPractices: [
    'Use performance profiling tools',
    'Implement efficient DOM operations',
    'Optimize resource loading',
    'Handle memory management',
    'Use non-blocking operations',
    'Monitor performance metrics',
    'Implement proper cleanup'
  ],
  commonPitfalls: [
    'Blocking main thread',
    'Memory leaks',
    'Unoptimized resource loading',
    'Inefficient DOM operations',
    'Missing performance monitoring',
    'Poor error handling',
    'No cleanup implementation'
  ]
};
