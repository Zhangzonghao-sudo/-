### 将项目上传到 Git 的步骤

#### 1. 初始化 Git 仓库（如果尚未初始化）

在项目根目录执行：

```bash
git init
```

#### 2. 创建 .gitignore 文件（如果不存在）

在项目根目录创建 `.gitignore` 文件，添加需要忽略的文件和目录，例如：

```
# 依赖文件
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# 构建产物
dist/
build/

# 环境变量文件
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE 配置
.vscode/
.idea/
*.swp
*.swo
*~

# 操作系统文件
.DS_Store
Thumbs.db
```

#### 3. 添加文件到暂存区

```bash
git add .
```

#### 4. 提交文件到本地仓库

```bash
git commit -m "初始化项目"
```

#### 5. 在 Git 平台（如 GitHub、Gitee 等）创建远程仓库

- 登录 Git 平台
- 创建新仓库，复制仓库的 SSH 或 HTTPS 地址

#### 6. 关联远程仓库

```bash
git remote add origin <远程仓库地址>
```

#### 7. 推送代码到远程仓库

```bash
git push -u origin main
```

（如果默认分支是 master，使用 `git push -u origin master`）

#### 8. 验证推送结果

在 Git 平台查看仓库是否已成功上传代码。

### 注意事项

- 确保 `.gitignore` 文件正确配置，避免上传不必要的文件
- 使用有意义的提交信息
- 首次推送时使用 `-u` 参数设置默认上游分支，后续推送可直接使用 `git push`
- 如果远程仓库已有文件，可能需要先拉取合并后再推送