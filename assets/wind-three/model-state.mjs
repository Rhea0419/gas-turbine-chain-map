export const COMPONENT_SPECS = [
  {
    id: "blade-system",
    name: "叶片",
    shortName: "叶片",
    type: "blade",
    material: "碳纤维复合材料",
    supplier: "中材科技",
    share: "17%",
    status: "正常",
    bomOrder: 1,
    assembled: { x: -3.46, y: 0.42, z: 0 },
    explode: { x: -3.9, y: 0.18, z: -0.12 },
    labelOffset: { x: -0.55, y: 1.48, z: 0.1 },
    color: "#f3f8fb",
    detailUnits: 18,
  },
  {
    id: "pitch-ring",
    name: "变桨轴承",
    shortName: "变桨",
    type: "ring",
    material: "高强合金钢",
    supplier: "洛轴LYC",
    share: "10%",
    status: "稳定",
    bomOrder: 8,
    assembled: { x: -2.98, y: 0.42, z: 0 },
    explode: { x: -2.36, y: 0.1, z: 0.05 },
    labelOffset: { x: -0.18, y: 1.15, z: 0 },
    color: "#d8e3eb",
    detailUnits: 24,
  },
  {
    id: "main-bearing",
    name: "主轴承",
    shortName: "主轴承",
    type: "bearing",
    material: "调心滚子轴承",
    supplier: "SKF",
    share: "18%",
    status: "核心",
    bomOrder: 2,
    assembled: { x: -2.18, y: 0.42, z: 0 },
    explode: { x: -1.86, y: 0.08, z: 0.08 },
    labelOffset: { x: -0.05, y: 1.24, z: 0.04 },
    color: "#cfd6dd",
    detailUnits: 42,
  },
  {
    id: "main-shaft",
    name: "主轴",
    shortName: "主轴",
    type: "shaft",
    material: "42CrMo锻件",
    supplier: "南高齿",
    share: "8%",
    status: "正常",
    bomOrder: 9,
    assembled: { x: -1.28, y: 0.42, z: 0 },
    explode: { x: -0.82, y: -0.02, z: 0 },
    labelOffset: { x: 0.16, y: 1.08, z: 0.02 },
    color: "#aeb8c3",
    detailUnits: 16,
  },
  {
    id: "gearbox",
    name: "齿轮箱",
    shortName: "齿轮箱",
    type: "gearbox",
    material: "三级行星齿轮",
    supplier: "南高齿",
    share: "21%",
    status: "稳定",
    bomOrder: 3,
    assembled: { x: -0.18, y: 0.42, z: 0 },
    explode: { x: 0.86, y: 0.06, z: 0.02 },
    labelOffset: { x: 0.04, y: 1.35, z: -0.05 },
    color: "#2f92df",
    detailUnits: 38,
  },
  {
    id: "coupling",
    name: "联轴器",
    shortName: "联轴器",
    type: "coupling",
    material: "柔性联接",
    supplier: "KTR",
    share: "5%",
    status: "正常",
    bomOrder: 10,
    assembled: { x: 0.82, y: 0.42, z: 0 },
    explode: { x: 1.36, y: 0.03, z: -0.02 },
    labelOffset: { x: 0.02, y: 1.05, z: 0 },
    color: "#9aa6b2",
    detailUnits: 18,
  },
  {
    id: "generator",
    name: "发电机",
    shortName: "发电机",
    type: "generator",
    material: "双馈异步电机",
    supplier: "上海电气",
    share: "15%",
    status: "正常",
    bomOrder: 4,
    assembled: { x: 1.62, y: 0.42, z: 0 },
    explode: { x: 2.42, y: 0.04, z: 0.02 },
    labelOffset: { x: 0.06, y: 1.28, z: 0.04 },
    color: "#8a9199",
    detailUnits: 34,
  },
  {
    id: "converter",
    name: "变流器",
    shortName: "变流器",
    type: "converter",
    material: "IGBT功率柜",
    supplier: "阳光电源",
    share: "12%",
    status: "跟踪",
    bomOrder: 5,
    assembled: { x: 2.86, y: 0.45, z: -0.04 },
    explode: { x: 3.65, y: 0.08, z: 0.26 },
    labelOffset: { x: 0.18, y: 1.22, z: 0.05 },
    color: "#46505c",
    detailUnits: 22,
  },
  {
    id: "yaw-system",
    name: "偏航系统",
    shortName: "偏航系统",
    type: "yaw",
    material: "回转支承",
    supplier: "新强联",
    share: "8%",
    status: "正常",
    bomOrder: 7,
    assembled: { x: 0.12, y: -0.82, z: 0 },
    explode: { x: 0.24, y: -0.52, z: -0.02 },
    labelOffset: { x: 0.32, y: 0.42, z: 0.02 },
    color: "#445565",
    detailUnits: 24,
  },
  {
    id: "platform",
    name: "安装平台",
    shortName: "平台",
    type: "platform",
    material: "钢结构平台",
    supplier: "SSB",
    share: "9%",
    status: "正常",
    bomOrder: 6,
    assembled: { x: 0.18, y: -0.36, z: 0 },
    explode: { x: 0.16, y: -0.46, z: 0.04 },
    labelOffset: { x: 0.45, y: 0.3, z: 0.1 },
    color: "#536273",
    detailUnits: 30,
  },
  {
    id: "cooling-pipe",
    name: "冷却管线",
    shortName: "冷却",
    type: "pipe",
    material: "液冷回路",
    supplier: "丹佛斯",
    share: "6%",
    status: "正常",
    bomOrder: 11,
    assembled: { x: 1.06, y: -0.1, z: 0.35 },
    explode: { x: 1.72, y: -0.28, z: 0.38 },
    labelOffset: { x: 0.12, y: 0.52, z: 0.18 },
    color: "#f28c32",
    detailUnits: 18,
  },
  {
    id: "nacelle-shell",
    name: "机舱外壳",
    shortName: "外壳",
    type: "shell",
    material: "玻璃钢罩壳",
    supplier: "时代新材",
    share: "11%",
    status: "正常",
    bomOrder: 12,
    assembled: { x: 0.28, y: 0.42, z: 0 },
    explode: { x: 0.64, y: 0.86, z: -0.92 },
    labelOffset: { x: 0.28, y: 1.34, z: -0.04 },
    color: "#d9e3ec",
    opacity: 0.14,
    transparentOpacity: 0.22,
    detailUnits: 12,
  },
];

export function clamp01(value) {
  if (Number.isNaN(Number(value))) {
    return 0;
  }

  return Math.max(0, Math.min(1, Number(value)));
}

export function interpolateVector(start, offset, factor) {
  const t = clamp01(factor);
  return {
    x: round(start.x + offset.x * t),
    y: round(start.y + offset.y * t),
    z: round(start.z + offset.z * t),
  };
}

export function resolveComponentTransform(component, explodeFactor) {
  return {
    id: component.id,
    position: interpolateVector(component.assembled, component.explode, explodeFactor),
    labelPosition: interpolateVector(
      addVector(component.assembled, component.labelOffset),
      component.explode,
      explodeFactor,
    ),
  };
}

export function buildSceneState({ explodeFactor = 1, transparent = false, selectedId = null } = {}) {
  const clampedFactor = clamp01(explodeFactor);

  return {
    explodeFactor: clampedFactor,
    transparent,
    selectedId,
    parts: COMPONENT_SPECS.map((component) => {
      const transform = resolveComponentTransform(component, clampedFactor);
      const baseOpacity = component.opacity ?? 1;
      const transparentOpacity = component.transparentOpacity ?? 0.52;
      const isSelected = component.id === selectedId;
      const dimmedOpacity = component.opacity != null ? Math.min(component.opacity, 0.06) : 0.14;

      return {
        ...component,
        ...transform,
        selected: isSelected,
        opacity: transparent ? transparentOpacity : (selectedId && !isSelected ? dimmedOpacity : baseOpacity),
      };
    }),
  };
}

export function buildBomCards() {
  return COMPONENT_SPECS.filter((component) => Number.isFinite(component.bomOrder))
    .sort((a, b) => a.bomOrder - b.bomOrder)
    .map((component) => ({
      id: component.id,
      order: component.bomOrder,
      name: component.shortName,
      supplier: component.supplier,
      material: component.material,
      share: component.share,
      status: component.status,
    }));
}

function addVector(a, b) {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  };
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
