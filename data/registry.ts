import { Pattern } from './index';
import { asyncPromiseHellPattern } from './patterns/async-promise-hell';
import { memoryLeaksPattern } from './patterns/memory-leaks';
import { apiIntegrationPattern } from './patterns/api-integration';
import { stateManagementPattern } from './patterns/state-management';
import { performanceBottleneckPattern } from './patterns/performance-bottleneck';
import { stackTracePattern } from './patterns/stack-trace';

export const patterns: Pattern[] = [
  asyncPromiseHellPattern,
  memoryLeaksPattern,
  apiIntegrationPattern,
  stateManagementPattern,
  performanceBottleneckPattern,
  stackTracePattern
];
