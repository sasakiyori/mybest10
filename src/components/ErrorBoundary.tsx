/**
 * ErrorBoundary Component
 * 全局错误边界，捕获React组件树中的错误
 * 需求: 2.5, 4.3, 9.2
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 错误日志服务
 */
class ErrorLogger {
  /**
   * 记录错误到控制台和本地存储
   */
  static log(error: Error, errorInfo: ErrorInfo): void {
    // 记录到控制台
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // 记录到本地存储（用于调试）
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack ?? undefined,
      };

      const existingLogs = this.getErrorLogs();
      existingLogs.push(errorLog);

      // 只保留最近10条错误日志
      const recentLogs = existingLogs.slice(-10);
      localStorage.setItem('error_logs', JSON.stringify(recentLogs));
    } catch (e) {
      console.error('Failed to save error log:', e);
    }
  }

  /**
   * 获取错误日志
   */
  static getErrorLogs(): Array<{
    timestamp: string;
    message: string;
    stack?: string;
    componentStack?: string;
  }> {
    try {
      const logs = localStorage.getItem('error_logs');
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  /**
   * 清除错误日志
   */
  static clearErrorLogs(): void {
    try {
      localStorage.removeItem('error_logs');
    } catch (e) {
      console.error('Failed to clear error logs:', e);
    }
  }
}

/**
 * ErrorBoundary组件
 * 捕获子组件树中的JavaScript错误，记录错误并显示降级UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // 更新state以便下次渲染显示降级UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误到日志服务
    ErrorLogger.log(error, errorInfo);

    // 更新state
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
            <div className="flex items-center justify-center mb-6">
              <svg
                className="w-16 h-16 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
              哎呀，出错了！
            </h1>

            <p className="text-gray-600 text-center mb-6">
              应用遇到了一个意外错误。我们已经记录了这个问题，请尝试以下操作：
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 font-mono break-all">
                {this.state.error?.message || '未知错误'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                尝试恢复
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                重新加载页面
              </button>
            </div>

            {/* 开发环境显示详细错误信息 */}
            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  查看详细错误信息（开发模式）
                </summary>
                <pre className="mt-4 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                  {this.state.error?.stack}
                  {'\n\n'}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 导出错误日志服务供外部使用
 */
export { ErrorLogger };
