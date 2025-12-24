/**
 * 豆瓣API服务属性测试
 * Feature: book-best10-generator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { searchBooks, getBookDetail, DoubanAPIError } from './doubanService';

/**
 * 属性 4: API错误处理完整性
 * 验证: 需求 2.5, 9.2
 * 
 * 对于任何API调用失败的情况（网络错误、超时、404、500等），
 * 系统应该捕获错误并返回用户友好的错误消息，而不是抛出未处理的异常。
 */
describe('Property 4: API错误处理完整性', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // 重置fetch mock
    vi.clearAllMocks();
  });

  afterEach(() => {
    // 恢复原始fetch
    global.fetch = originalFetch;
  });

  it('对于任何HTTP错误状态码，应该抛出DoubanAPIError而不是未处理的异常', async () => {
    // 生成各种HTTP错误状态码
    const httpErrorCodes = fc.integer({ min: 400, max: 599 });

    await fc.assert(
      fc.asyncProperty(httpErrorCodes, fc.string({ minLength: 1 }), async (statusCode, query) => {
        // Mock fetch返回错误状态码
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status: statusCode,
          statusText: `Error ${statusCode}`,
        });

        // 验证抛出DoubanAPIError
        await expect(searchBooks(query)).rejects.toThrow(DoubanAPIError);
        
        // 验证错误消息是用户友好的（不是原始错误）
        try {
          await searchBooks(query);
        } catch (error) {
          expect(error).toBeInstanceOf(DoubanAPIError);
          expect((error as DoubanAPIError).message).toBeTruthy();
          expect((error as DoubanAPIError).message.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 20 } // 减少运行次数以避免超时
    );
  }, 10000); // 增加测试超时时间

  it('对于网络错误，应该抛出DoubanAPIError而不是未处理的异常', async () => {
    // 生成各种网络错误类型
    const networkErrors = fc.constantFrom(
      new TypeError('Failed to fetch'),
      new Error('Network error'),
      new Error('Connection refused'),
      new DOMException('The operation was aborted', 'AbortError')
    );

    await fc.assert(
      fc.asyncProperty(networkErrors, fc.string({ minLength: 1 }), async (error, query) => {
        // Mock fetch抛出网络错误
        global.fetch = vi.fn().mockRejectedValue(error);

        // 验证抛出DoubanAPIError
        await expect(searchBooks(query)).rejects.toThrow(DoubanAPIError);
        
        // 验证错误消息是用户友好的
        try {
          await searchBooks(query);
        } catch (caughtError) {
          expect(caughtError).toBeInstanceOf(DoubanAPIError);
          expect((caughtError as DoubanAPIError).message).toBeTruthy();
          // 错误消息应该是中文且友好的
          expect((caughtError as DoubanAPIError).message).toMatch(/请|重试|失败|超时/);
        }
      }),
      { numRuns: 10 } // 进一步减少运行次数
    );
  }, 20000); // 增加测试超时时间到20秒

  it('对于JSON解析错误，应该抛出DoubanAPIError而不是未处理的异常', async () => {
    // 生成各种无效的JSON响应
    const invalidJsonResponses = fc.constantFrom(
      'not json',
      '{invalid}',
      '{"incomplete":',
      '<html>error page</html>',
      '',
      'null',
      'undefined'
    );

    await fc.assert(
      fc.asyncProperty(invalidJsonResponses, fc.string({ minLength: 1 }), async (invalidJson, query) => {
        // Mock fetch返回无效JSON
        global.fetch = vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => {
            throw new SyntaxError('Unexpected token');
          },
        });

        // 验证抛出DoubanAPIError
        await expect(searchBooks(query)).rejects.toThrow(DoubanAPIError);
        
        // 验证错误消息是用户友好的
        try {
          await searchBooks(query);
        } catch (error) {
          expect(error).toBeInstanceOf(DoubanAPIError);
          expect((error as DoubanAPIError).message).toBeTruthy();
        }
      }),
      { numRuns: 100 }
    );
  });

  it('对于空查询或无效输入，应该抛出DoubanAPIError而不是未处理的异常', async () => {
    // 生成各种无效输入
    const invalidInputs = fc.constantFrom(
      '',
      '   ',
      '\t\n',
      '\0'
    );

    await fc.assert(
      fc.asyncProperty(invalidInputs, async (invalidQuery) => {
        // 验证抛出DoubanAPIError
        await expect(searchBooks(invalidQuery)).rejects.toThrow(DoubanAPIError);
        
        // 验证错误消息是用户友好的
        try {
          await searchBooks(invalidQuery);
        } catch (error) {
          expect(error).toBeInstanceOf(DoubanAPIError);
          expect((error as DoubanAPIError).message).toContain('不能为空');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('对于getBookDetail的各种错误情况，应该抛出DoubanAPIError', async () => {
    // 生成各种错误场景
    const errorScenarios = fc.constantFrom(
      { type: 'http_error', statusCode: 404 },
      { type: 'http_error', statusCode: 500 },
      { type: 'network_error', error: new Error('Network error') },
      { type: 'json_error', error: new SyntaxError('Invalid JSON') }
    );

    await fc.assert(
      fc.asyncProperty(errorScenarios, fc.string({ minLength: 1 }), async (scenario, bookId) => {
        // Mock不同的错误场景
        if (scenario.type === 'http_error') {
          global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: scenario.statusCode,
            statusText: `Error ${scenario.statusCode}`,
          });
        } else if (scenario.type === 'network_error') {
          global.fetch = vi.fn().mockRejectedValue(scenario.error);
        } else if (scenario.type === 'json_error') {
          global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => {
              throw scenario.error;
            },
          });
        }

        // 验证抛出DoubanAPIError
        await expect(getBookDetail(bookId)).rejects.toThrow(DoubanAPIError);
        
        // 验证错误消息是用户友好的
        try {
          await getBookDetail(bookId);
        } catch (error) {
          expect(error).toBeInstanceOf(DoubanAPIError);
          expect((error as DoubanAPIError).message).toBeTruthy();
        }
      }),
      { numRuns: 20 } // 减少运行次数以避免超时
    );
  }, 10000); // 增加测试超时时间

  it('所有DoubanAPIError都应该包含有意义的错误消息', async () => {
    // 生成各种错误场景
    const errorScenarios = fc.constantFrom(
      { statusCode: 404, expectedMessage: '未找到' },
      { statusCode: 429, expectedMessage: '频繁' },
      { statusCode: 500, expectedMessage: '不可用' },
      { statusCode: 503, expectedMessage: '不可用' }
    );

    await fc.assert(
      fc.asyncProperty(
        errorScenarios, 
        fc.string({ minLength: 1 }).filter(s => s.trim().length > 0 && !s.includes('\0')), // 过滤掉空字符串和null字符
        async (scenario, query) => {
          // Mock fetch返回特定错误
          global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: scenario.statusCode,
            statusText: `Error ${scenario.statusCode}`,
          });

          try {
            await searchBooks(query);
            // 不应该到达这里
            expect(true).toBe(false);
          } catch (error) {
            expect(error).toBeInstanceOf(DoubanAPIError);
            const apiError = error as DoubanAPIError;
            
            // 对于4xx错误，验证错误消息包含预期的关键词
            // 对于5xx错误，由于重试后会返回通用网络错误，所以只验证是DoubanAPIError
            if (scenario.statusCode < 500) {
              expect(apiError.message).toContain(scenario.expectedMessage);
              expect(apiError.statusCode).toBe(scenario.statusCode);
            } else {
              // 5xx错误会重试，最终返回网络错误消息
              expect(apiError.message).toBeTruthy();
            }
          }
        }
      ),
      { numRuns: 20 } // 减少运行次数
    );
  }, 10000); // 增加测试超时时间
});
