# 版本管理建议

## 当前方式

当前仓库通过 Git 管理页面版本。每次重要修改后提交一次，GitHub 会保留历史记录，可用于查看差异和回退。

## 建议规则

- 小改动：直接提交到 `main`。
- 重要版式调整：先复制一份到 `versions/`，再提交。
- 大版本重构：新建分支，例如 `redesign-a4-print` 或 `interactive-map-v2`。
- 正式对外版本：打 tag，例如 `v2026.07.10-a4-release`。

## 推荐提交信息格式

- `Update page layout`
- `Fix image aspect ratio`
- `Add source inventory`
- `Archive release version`
- `Deploy interactive map`

## 回退方式

如需回退到某个 Git 版本，可在 GitHub 的 commit history 中找到对应提交，也可在本地使用：

```bash
git log --oneline
git checkout <commit-id>
```

注意：正式回退线上页面前，应确认是否会覆盖后续改动。

