export type Pattern = {
  id: string
  title: string
  description: string
  category: string
  diagram: string
  longDescription?: string
  useCases?: string[]
  codeExamples: {
    title: string
    code: string
    explanation: string
  }[]
}

export const patterns: Pattern[] = [
  {
    id: 'async-promise-hell',
    title: 'Promise Chaining',
    description: 'Visualize and debug complex asynchronous flows and promise chains for structured reasoning and step-by-step task completion.',
    category: 'WORKFLOW',
    diagram: 'https://raw.githubusercontent.com/noah-ing/Debug-Pics/refs/heads/main/mermaid-diagram-2025-01-09-222927.svg',
    codeExamples: [
      {
        title: 'Promise Hell Example',
        code: `// Promise Hell - Hard to debug
fetchUserData(userId)
  .then(user => {
    return fetchUserPosts(user.id)
      .then(posts => {
        return fetchPostComments(posts[0].id)
          .then(comments => {
            console.log(comments);
          });
      });
  })
  .catch(error => console.error(error));`,
        explanation: 'This example shows deeply nested promises that are difficult to debug and maintain.'
      },
      {
        title: 'Improved Promise Chain',
        code: `// Better approach using async/await
async function getUserData(userId) {
  try {
    const user = await fetchUserData(userId);
    const posts = await fetchUserPosts(user.id);
    const comments = await fetchPostComments(posts[0].id);
    return comments;
  } catch (error) {
    console.error('Error in data fetching:', error);
    throw error;
  }
}`,
        explanation: 'Using async/await makes the code more readable and easier to debug with clear error handling.'
      }
    ]
  },
  {
    id: 'memory-leaks',
    title: 'Memory Leaks 101',
    description: 'A systematic approach to identifying and fixing memory leaks through heap snapshot analysis, memory usage visualization, and common leak pattern detection.',
    category: 'PERFORMANCE',
    diagram: 'https://raw.githubusercontent.com/noah-ing/Debug-Pics/refs/heads/main/mermaid-diagram-2025-01-09-224808.svg',
    codeExamples: [
      {
        title: 'Event Listener Memory Leak',
        code: `// Memory leak - event listeners not cleaned up
class Component {
  constructor() {
    window.addEventListener('resize', this.handleResize);
  }
  
  handleResize = () => {
    // Handle resize logic
  }
}`,
        explanation: 'This code creates a memory leak by not removing the event listener when the component is destroyed.'
      },
      {
        title: 'Fixed Event Listener Implementation',
        code: `// Proper cleanup implementation
class Component {
  constructor() {
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }
  
  handleResize() {
    // Handle resize logic
  }
  
  cleanup() {
    window.removeEventListener('resize', this.handleResize);
  }
}`,
        explanation: 'Adding a cleanup method ensures proper removal of event listeners, preventing memory leaks.'
      }
    ]
  },
  {
    id: 'api-integration',
    title: 'API Integration',
    description: 'A comprehensive debugging flow for API integrations, focusing on request/response cycles, error handling patterns, and timeout/retry strategies.',
    category: 'INTEGRATION',
    diagram: 'https://raw.githubusercontent.com/noah-ing/Debug-Pics/refs/heads/main/mermaid-diagram-2025-01-09-222949.svg',
    codeExamples: [
      {
        title: 'Basic API Integration',
        code: `// Simple API integration without proper error handling
async function fetchData() {
  const response = await fetch('api/data');
  const data = await response.json();
  return data;
}`,
        explanation: 'This basic implementation lacks proper error handling and retry logic.'
      },
      {
        title: 'Robust API Integration',
        code: `// Robust API integration with retry logic and error handling
async function fetchDataWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}`,
        explanation: 'This implementation includes retry logic, exponential backoff, and proper error handling.'
      }
    ]
  },
  {
    id: 'state-management',
    title: 'State Management',
    description: 'A visual approach to debugging state management issues, tracking component re-renders, state mutations, and cache invalidation patterns.',
    category: 'STATE',
    diagram: 'https://raw.githubusercontent.com/noah-ing/Debug-Pics/refs/heads/main/mermaid-diagram-2025-01-09-222959.svg',
    codeExamples: [
      {
        title: 'Problematic State Update',
        code: `// Direct state mutation - can cause bugs
const TodoList = () => {
  const [todos, setTodos] = useState([]);
  
  const addTodo = (todo) => {
    todos.push(todo); // Direct mutation!
    setTodos(todos);
  };
}`,
        explanation: 'Directly mutating state can lead to unexpected behavior and re-render issues.'
      },
      {
        title: 'Proper State Update',
        code: `// Immutable state update pattern
const TodoList = () => {
  const [todos, setTodos] = useState([]);
  
  const addTodo = (todo) => {
    setTodos(prevTodos => [...prevTodos, todo]);
  };
  
  const removeTodo = (id) => {
    setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
  };
}`,
        explanation: 'Using immutable updates ensures predictable state changes and proper component re-rendering.'
      }
    ]
  },
  {
    id: 'performance-bottleneck',
    title: 'Performance Bottleneck',
    description: 'A systematic method for identifying and resolving performance bottlenecks through waterfall diagrams, load time analysis, and resource optimization.',
    category: 'PERFORMANCE',
    diagram: 'https://raw.githubusercontent.com/noah-ing/Debug-Pics/refs/heads/main/mermaid-diagram-2025-01-09-223020.svg',
    codeExamples: [
      {
        title: 'Inefficient List Rendering',
        code: `// Inefficient list rendering
function ItemList({ items }) {
  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          <ExpensiveComponent item={item} />
        </div>
      ))}
    </div>
  );
}`,
        explanation: 'This implementation re-renders all items unnecessarily, causing performance issues.'
      },
      {
        title: 'Optimized List Rendering',
        code: `// Optimized rendering with virtualization
import { FixedSizeList } from 'react-window';

function ItemList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <MemoizedExpensiveComponent item={items[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={400}
      width="100%"
      itemCount={items.length}
      itemSize={50}
    >
      {Row}
    </FixedSizeList>
  );
}

const MemoizedExpensiveComponent = React.memo(ExpensiveComponent);`,
        explanation: 'Using virtualization and memoization improves performance by only rendering visible items.'
      }
    ]
  },
  {
    id: 'stack-trace',
    title: 'Stack Trace Analyzer',
    description: 'A structured approach to runtime error debugging, helping developers navigate complex stack traces, identify error sources, and implement error boundaries.',
    category: 'RUNTIME',
    diagram: 'https://raw.githubusercontent.com/noah-ing/Debug-Pics/refs/heads/main/mermaid-diagram-2025-01-09-223035.svg',
    codeExamples: [
      {
        title: 'Basic Error Handling',
        code: `// Basic try-catch without proper error handling
try {
  throw new Error('Something went wrong');
} catch (error) {
  console.error(error);
}`,
        explanation: 'Simple error handling without proper stack trace analysis or error reporting.'
      },
      {
        title: 'Advanced Error Boundary',
        code: `// React Error Boundary with detailed error handling
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null, errorInfo: null };
  
  componentDidCatch(error, errorInfo) {
    this.setState({
      hasError: true,
      error,
      errorInfo
    });
    
    // Log to error reporting service
    logErrorToService({
      error,
      componentStack: errorInfo.componentStack,
      userInfo: this.props.userInfo
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-ui">
          <h2>Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    
    return this.props.children;
  }
}`,
        explanation: 'Comprehensive error boundary implementation with detailed stack trace analysis and error reporting.'
      }
    ]
  }
]
