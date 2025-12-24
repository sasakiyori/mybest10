# 📚 书籍Best10生成器

一个现代化的Web应用，帮助你创建个性化的书单排行榜图片，完美适配社交媒体分享。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646cff.svg)](https://vitejs.dev/)
[![Deploy](https://github.com/sasakiyori/mybest10/actions/workflows/deploy.yml/badge.svg)](https://github.com/sasakiyori/mybest10/actions/workflows/deploy.yml)

🌐 **在线体验**: [https://sasakiyori.github.io/mybest10/](https://sasakiyori.github.io/mybest10/)

## ✨ 功能特性

- 🔍 **智能搜索** - 集成豆瓣API，快速搜索书籍信息
- 🖼️ **多源图片搜索** - 支持豆瓣、百度图片、Google Books、Open Library多个来源，提供更多封面选择
- 📝 **简单输入** - 10个输入框对应排名1-10位
- 🎨 **样式自定义** - 自定义背景色、文字色、标题等
- 🖼️ **高清生成** - 生成1080x1920高清图片
- 💾 **自动保存** - 浏览器本地存储，数据不丢失
- 📱 **响应式设计** - 完美支持桌面端和移动端
- 🎯 **拖拽排序** - 轻松调整书籍排名顺序
- ⚡ **快捷键支持** - 提升操作效率
- 🧪 **全面测试** - 单元测试 + 属性测试保证质量

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd mybest10

# 安装依赖
npm install
```

### 开发

```bash
# 启动开发服务器
npm run dev

# 应用将在 http://localhost:5173 运行
```

### 构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 测试

```bash
# 运行所有测试
npm test

# 监听模式运行测试
npm run test:watch

# 运行测试UI
npm run test:ui

# 测试图片搜索功能
# 在浏览器中打开 test-image-search.html 文件
```

## 📖 使用指南

### 1. 输入书名

在10个输入框中输入你想要推荐的书籍名称。支持中文、英文和其他Unicode字符。

### 2. 搜索选择

点击搜索按钮，选择搜索方式：

- **豆瓣搜索**：从豆瓣数据库搜索，获取完整的书籍信息（作者、出版社、评分等）
- **图片搜索**：从多个来源（豆瓣、百度图片、Google Books、Open Library）搜索书籍封面，提供更多选择

系统会自动获取封面图片和书籍信息。

> 💡 提示：图片搜索会并行查询多个来源，即使某个来源失败，其他来源仍可返回结果，最大化搜索成功率。

### 3. 自定义样式

- 选择预设模板（经典、现代、简约）
- 自定义背景颜色和文字颜色
- 编辑标题文字
- 实时预览效果

### 4. 生成下载

点击"生成图片"按钮，等待渲染完成后下载PNG或JPG格式的图片。

### 快捷键

- `Ctrl/Cmd + K` - 快速聚焦到第一个空输入框
- `Ctrl/Cmd + S` - 显示保存提示（数据已自动保存）
- `ESC` - 关闭搜索弹窗

## 🏗️ 技术栈

### 核心技术

- **React 19.2** - UI框架
- **TypeScript 5.9** - 类型安全
- **Vite 7.2** - 构建工具
- **Tailwind CSS 4** - 样式框架

### 主要依赖

- **@dnd-kit** - 拖拽排序功能
- **Canvas API** - 图片渲染引擎
- **LocalStorage** - 数据持久化

### 测试工具

- **Vitest** - 单元测试框架
- **@testing-library/react** - React组件测试
- **fast-check** - 属性测试库

## 📁 项目结构

```
src/
├── components/          # React组件
│   ├── BookInputList.tsx       # 书名输入列表
│   ├── BookSearchModal.tsx     # 搜索弹窗
│   ├── BookPreview.tsx         # 书籍预览
│   ├── ImageGenerator.tsx      # 图片生成器
│   ├── StyleCustomizer.tsx     # 样式自定义
│   └── ErrorBoundary.tsx       # 错误边界
├── contexts/            # React Context
│   └── Best10Context.tsx       # 全局状态管理
├── services/            # 服务层
│   ├── doubanService.ts        # 豆瓣API服务
│   ├── imageSearchService.ts   # 图片搜索服务（百度、Google Books、Open Library）
│   ├── storageService.ts       # 本地存储服务
│   └── renderService.ts        # 图片渲染服务
├── types/               # TypeScript类型定义
│   ├── models.ts               # 数据模型
│   └── constants.ts            # 常量定义
├── test/                # 测试配置
│   └── setup.ts                # 测试环境设置
├── App.tsx              # 主应用组件
└── main.tsx             # 应用入口
```

## 🧪 测试策略

项目采用双重测试策略确保代码质量：

### 单元测试

使用Vitest和@testing-library/react测试组件行为和用户交互。

```bash
npm test
```

### 属性测试

使用fast-check进行属性测试，每个测试运行100次迭代，验证系统在各种输入下的正确性。

测试覆盖的关键属性：
- 数据持久化往返一致性
- Unicode字符输入支持
- 搜索结果完整性
- API错误处理完整性
- 书籍选择数据完整性
- 排名顺序唯一性
- Canvas渲染尺寸正确性
- 图片导出格式正确性
- 样式预览一致性
- 中文字体渲染正确性

## 🚢 部署

### GitHub Pages 部署（推荐）

本项目已配置 GitHub Actions 自动部署到 GitHub Pages：

1. Fork 本仓库或推送到你的 GitHub 仓库
2. 在仓库 Settings → Pages → Source 选择 **GitHub Actions**
3. 推送代码到 `main` 分支后会自动构建部署
4. 访问 `https://<用户名>.github.io/mybest10/`

当前部署地址: [https://sasakiyori.github.io/mybest10/](https://sasakiyori.github.io/mybest10/)

### Vercel部署

1. 在Vercel导入项目
2. 构建命令：`npm run build`
3. 输出目录：`dist`
4. 自动部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Netlify部署

1. 在Netlify导入项目
2. 构建命令：`npm run build`
3. 发布目录：`dist`
4. 自动部署

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

### 环境变量

项目不需要额外的环境变量配置。豆瓣API通过公开代理访问。

## 🔧 配置说明

### Vite配置

项目使用Vite作为构建工具，配置文件：`vite.config.ts`

### TypeScript配置

- `tsconfig.json` - 基础配置
- `tsconfig.app.json` - 应用配置
- `tsconfig.node.json` - Node环境配置

### Tailwind CSS配置

使用Tailwind CSS 4，配置文件：`tailwind.config.js`（如需自定义）

## 🐛 已知问题

### API限制

- 豆瓣官方API有CORS限制，项目使用第三方代理服务
- 百度图片搜索使用非官方API，可能不稳定
- 如遇到API不可用，系统会自动尝试其他来源或使用模拟数据

### 浏览器兼容性

- 推荐使用现代浏览器（Chrome, Firefox, Safari, Edge）
- 需要支持Canvas API和LocalStorage

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

### 代码规范

- 使用ESLint进行代码检查
- 遵循TypeScript最佳实践
- 编写测试覆盖新功能
- 添加必要的代码注释

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [豆瓣读书](https://book.douban.com/) - 提供书籍数据
- [百度图片](https://image.baidu.com/) - 提供图片搜索
- [Google Books API](https://developers.google.com/books) - 提供书籍封面
- [Open Library](https://openlibrary.org/) - 提供开放书籍数据
- [React](https://react.dev/) - UI框架
- [Vite](https://vitejs.dev/) - 构建工具
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架

## 📞 联系方式

如有问题或建议，欢迎提交 [Issue](https://github.com/sasakiyori/mybest10/issues) 或 [Pull Request](https://github.com/sasakiyori/mybest10/pulls)。

---

Made with ❤️ by [sasakiyori](https://github.com/sasakiyori)
