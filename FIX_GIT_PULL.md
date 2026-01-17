# 解决 Git Pull 冲突

## 问题
```
error: The following untracked working tree files would be overwritten by merge:
        package-lock.json
Please move or remove them before you merge.
```

## 原因
本地有未跟踪的 `package-lock.json` 文件，而远程仓库也有这个文件，Git 无法自动合并。

## 解决方案

### 方法一：删除本地文件后拉取（推荐）

```bash
# 删除本地的 package-lock.json
rm package-lock.json

# 重新拉取代码
git pull origin main

# 重新安装依赖（会自动生成新的 package-lock.json）
npm install
```

### 方法二：备份后拉取

```bash
# 备份本地文件
mv package-lock.json package-lock.json.bak

# 拉取代码
git pull origin main

# 如果需要，可以比较差异
diff package-lock.json package-lock.json.bak

# 删除备份
rm package-lock.json.bak

# 重新安装依赖
npm install
```

### 方法三：强制覆盖（如果确定要用远程版本）

```bash
# 删除本地文件
rm package-lock.json

# 拉取代码
git pull origin main

# 安装依赖
npm install
```

## 推荐操作流程

```bash
# 1. 删除冲突文件
rm package-lock.json

# 2. 拉取最新代码
git pull origin main

# 3. 重新安装依赖
npm install

# 4. 检查配置（现在应该可以用了）
npm run check

# 5. 启动程序
npm start
```

## 注意事项

`package-lock.json` 是自动生成的文件，删除后运行 `npm install` 会重新生成，通常不会有问题。
