# 项目配置说明

## 技术栈

- **React 19.2** + **TypeScript 5.9** + **Vite 7.2**
- **Tailwind CSS 4** - 样式框架
- **Vitest** + **@testing-library/react** - 测试
- **fast-check** - 属性测试

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 构建生产版本
npm run build
```

## 项目结构

```
mybest10/
├── .github/workflows/     # GitHub Actions 工作流
│   ├── ci.yml            # CI 测试流水线
│   └── deploy.yml        # GitHub Pages 部署
├── src/
│   ├── components/       # React 组件
│   ├── contexts/         # React Context 状态管理
│   ├── services/         # 服务层（API、存储、渲染）
│   ├── types/            # TypeScript 类型定义
│   ├── test/             # 测试配置
│   └── App.tsx           # 主应用组件
├── server/               # 本地开发代理服务器
├── docs/                 # 项目文档
└── public/               # 静态资源
```

## 部署

### GitHub Pages（推荐）

项目已配置 GitHub Actions 自动部署：

1. 推送代码到 `main` 分支
2. 在仓库 Settings → Pages → Source 选择 **GitHub Actions**
3. 自动构建部署到 `https://<用户名>.github.io/mybest10/`

**当前部署地址**: https://sasakiyori.github.io/mybest10/

### 本地开发

图片搜索功能需要代理服务器绑定跨域：

```bash
# 终端1：启动代理服务器
cd server && npm install && node index.js

# 终端2：启动前端开发服务器
npm run dev
```

## 配置文件说明

| 文件 | 说明 |
|------|------|
| `vite.config.ts` | Vite 构建配置，包含 base 路径和测试配置 |
| `tsconfig.json` | TypeScript 基础配置 |
| `eslint.config.js` | ESLint 代码检查配置 |
| `vercel.json` | Vercel 部署配置 |
| `netlify.toml` | Netlify 部署配置 |

## 测试

```bash
npm test              # 运行所有测试
npm run test:watch    # 监听模式
npm run test:ui       # 可视化测试界面
```

## 常见问题

### API 限制

- 豆瓣 API 有 CORS 限制，使用代理服务访问
- 部署环境需要自行配置后端代理或使用 Serverless Functions

