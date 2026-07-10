# 电力能源产业链智能图谱上下文

## 总体项目方向

用户希望建设“电力能源产业链智能图谱”，覆盖电力能源供应链上游关键环节，早期范围包括：

- 陆上风电
- 海上风电
- 光伏组件
- 储能系统
- 电气设备
- 燃气轮机

## 总体产品目标

- 清晰呈现各类别的上游产业链结构。
- 将设备主图、部件、供应商、市场格局、公司投研信息联动起来。
- 能够及时了解重点公司的经营情况，包括业绩、公告、年报、季报、股价表现等。
- 兼顾展示效果与后续投研使用价值。

## 早期交互设想

- 每个类别有一个主视觉设备图。
- 支持设备拆解、部件点击、供应商联动和公司财务信息联动。
- 如有 CAD 或 STEP/STP 装配文件，可进一步制作精细 3D 爆炸模型。
- 在缺少工业 CAD 模型的情况下，可先采用高质量 2D 图谱或半手工 3D 绘制方案。

## 设计迭代关键点

- 用户对低精度 3D 色块模型不满意，更倾向真实设备模型或原始 2D 图谱优化。
- 对于需要导出为 PDF 或图片的页面，不适合使用点击切换隐藏内容。
- 对于知识图谱交互页面，可以保留点击联动，但需要保证主图、部件、供应商、财务信息之间的映射准确。
- 所有数据和投研信息需要有明确来源，避免使用虚假或未经确认的数据。

## 本地已有相关页面

本地目录：`/Users/rhea/Documents/Codex/2026-06-25/uo/outputs`

- `energy-supply-chain-3d-prototype.html`
- `energy-supply-chain-3d-interactive-map.html`
- `energy-supply-chain-3d-prototype.before-original-visual.html`
- `energy-supply-chain-3d-prototype-backup-original-visual.html`
- `energy-supply-chain-3d-prototype.saved-redrawnparts2.html`
- `gas-turbine-chain-map.html`

## 后续仓库组织建议

如果要把整个电力能源知识图谱项目统一管理，建议另建总仓库，例如：

- `energy-supply-chain-knowledge-map`

建议目录结构：

- `gas-turbine/`
- `wind/`
- `offshore-wind/`
- `pv-module/`
- `storage/`
- `electrical-equipment/`
- `docs/`
- `data/`
- `versions/`

当前仓库 `gas-turbine-chain-map` 可作为燃气轮机子项目或静态发布仓库保留。

