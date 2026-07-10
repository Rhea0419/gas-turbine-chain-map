# 数据与素材说明

## 页面数据原则

- 页面仅展示用户提供图片和文档中已经明确出现的信息。
- 不主动编造国产化率、市场份额、供应商排名或未来预测数据。
- 对需要投研支撑的数据，后续应记录来源、发布时间和口径。

## 当前页面素材

当前页面使用重新绘制后的图片素材，而不是直接整图贴入参考图：

- `gas-turbine-redraw.png`：燃气轮机剖面主示意图。
- `upstream-sprite.png`：上游材料和核心部件小图。
- `midstream-sprite.png`：中游设备及制造小图。
- `downstream-sprite.png`：下游应用小图。

## 后续可补充的数据字段

如后续扩展为互动式知识图谱，建议为每个节点补充以下字段：

- 节点名称
- 所属环节
- 关键功能
- 主要供应商
- 国产化水平
- 价格或成本占比
- 交付周期
- 技术壁垒
- 供应风险
- 数据来源
- 更新时间

## 数据来源管理建议

建议新增 `data/sources.csv` 或 `data/sources.json`，记录每一条数据的来源：

- source_id
- source_name
- source_type
- url_or_file
- publish_date
- accessed_date
- data_scope
- reliability_note

