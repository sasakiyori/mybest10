# 贡献指南

感谢你对书籍Best10生成器项目的关注！我们欢迎所有形式的贡献。

## 行为准则

请保持友好和尊重。我们致力于为所有人提供一个无骚扰的体验。

## 如何贡献

### 报告Bug

如果你发现了bug，请创建一个Issue并包含以下信息：

- 清晰的标题和描述
- 重现步骤
- 预期行为和实际行为
- 截图（如果适用）
- 浏览器和操作系统信息

### 提出新功能

如果你有新功能的想法：

1. 先检查是否已有相关Issue
2. 创建新Issue描述你的想法
3. 等待维护者反馈
4. 获得批准后再开始开发

### 提交代码

#### 开发流程

1. **Fork项目**
   ```bash
   # 在GitHub上点击Fork按钮
   ```

2. **克隆你的Fork**
   ```bash
   git clone https://github.com/your-username/mybest10.git
   cd mybest10
   ```

3. **创建特性分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

4. **安装依赖**
   ```bash
   npm install
   ```

5. **开发和测试**
   ```bash
   # 启动开发服务器
   npm run dev

   # 运行测试
   npm test

   # 运行测试（监听模式）
   npm run test:watch
   ```

6. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

7. **推送到你的Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **创建Pull Request**
   - 在GitHub上打开你的Fork
   - 点击"New Pull Request"
   - 填写PR描述

#### 提交信息规范

使用语义化提交信息：

- `feat:` 新功能
- `fix:` Bug修复
- `docs:` 文档更新
- `style:` 代码格式（不影响功能）
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具相关

示例：
```
feat: add custom font selection
fix: resolve image loading issue on Safari
docs: update installation instructions
```

#### 代码规范

1. **TypeScript**
   - 使用严格的类型定义
   - 避免使用`any`类型
   - 为公共API添加JSDoc注释

2. **React组件**
   - 使用函数组件和Hooks
   - 保持组件小而专注
   - 提取可复用逻辑到自定义Hooks

3. **样式**
   - 使用Tailwind CSS类
   - 遵循响应式设计原则
   - 保持一致的间距和颜色

4. **测试**
   - 为新功能编写测试
   - 确保所有测试通过
   - 保持测试覆盖率

#### 代码审查

所有PR都需要经过代码审查：

- 确保CI通过
- 至少一个维护者批准
- 解决所有审查意见
- 保持提交历史清晰

### 测试要求

#### 单元测试

使用Vitest和@testing-library/react：

```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

#### 属性测试

使用fast-check进行属性测试：

```typescript
import fc from 'fast-check';

describe('Property Tests', () => {
  it('should maintain data consistency', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = processData(input);
        expect(result).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });
});
```

#### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式
npm run test:watch

# 测试UI
npm run test:ui

# 代码检查
npm run lint
```

### 文档

更新文档时：

- 保持README.md最新
- 为新功能添加使用说明
- 更新API文档
- 添加代码注释

## 项目结构

```
src/
├── components/          # React组件
├── contexts/            # React Context
├── services/            # 服务层
├── types/               # TypeScript类型
├── test/                # 测试配置
└── utils/               # 工具函数
```

## 开发技巧

### 调试

1. **使用React DevTools**
   - 安装浏览器扩展
   - 检查组件状态和props

2. **使用浏览器开发者工具**
   - Console查看日志
   - Network查看API请求
   - Application查看LocalStorage

3. **Vitest UI**
   ```bash
   npm run test:ui
   ```

### 性能优化

- 使用React.memo避免不必要的重渲染
- 使用useMemo和useCallback优化计算
- 懒加载图片
- 防抖和节流用户输入

### 常见问题

#### 测试失败

```bash
# 清除缓存
rm -rf node_modules
npm install

# 重新运行测试
npm test
```

#### 类型错误

```bash
# 检查TypeScript配置
npx tsc --noEmit
```

#### 构建失败

```bash
# 清除构建缓存
rm -rf dist
npm run build
```

## 发布流程

（仅限维护者）

1. 更新版本号
2. 更新CHANGELOG
3. 创建Git标签
4. 推送到GitHub
5. 自动部署到生产环境

## 获取帮助

- 创建Issue提问
- 查看现有Issue和PR
- 阅读文档

## 许可证

通过贡献代码，你同意你的贡献将在MIT许可证下发布。

---

再次感谢你的贡献！🎉
