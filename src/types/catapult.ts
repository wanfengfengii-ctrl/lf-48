export interface CatapultParams {
  armLength: number;
  counterweight: number;
  projectileWeight: number;
  releaseAngle: number;
}

export interface WindParams {
  windSpeed: number;
  windDirection: number;
  dragCoefficient: number;
}

export interface TargetParams {
  targetDistance: number;
  targetRadius: number;
}

export interface TrajectoryPoint3D {
  x: number;
  y: number;
  z: number;
  t: number;
}

export interface SimulationResult {
  trajectory: { x: number; y: number }[];
  trajectory3D: TrajectoryPoint3D[];
  maxHeight: number;
  distance: number;
  lateralDeviation: number;
  impactVelocity: number;
  flightTime: number;
  status: 'hit' | 'too_close' | 'too_far';
  targetDeviation: number;
  hitError: number;
  isTargetHit: boolean;
}

export interface BatchShotResult {
  id: number;
  trajectory: { x: number; y: number }[];
  trajectory3D: TrajectoryPoint3D[];
  distance: number;
  lateralDeviation: number;
  maxHeight: number;
  flightTime: number;
  impactVelocity: number;
  status: 'hit' | 'too_close' | 'too_far';
  targetDeviation: number;
  isTargetHit: boolean;
  hitError: number;
}

export interface BatchExperimentStats {
  totalShots: number;
  hitCount: number;
  hitRate: number;
  avgDistance: number;
  stdDistance: number;
  avgLateralDeviation: number;
  stdLateralDeviation: number;
  avgMaxHeight: number;
  avgFlightTime: number;
  avgImpactVelocity: number;
  avgTargetDeviation: number;
  minDistance: number;
  maxDistance: number;
  minLateralDeviation: number;
  maxLateralDeviation: number;
  cEP: number;
}

export interface BatchExperimentResult {
  id: string;
  name: string;
  params: CatapultParams;
  windParams: WindParams;
  targetParams: TargetParams;
  shots: BatchShotResult[];
  stats: BatchExperimentStats;
  timestamp: number;
}

export interface SavedScheme {
  id: string;
  name: string;
  params: CatapultParams;
  result: SimulationResult;
  timestamp: number;
}

export type WallMaterial = 'wood' | 'rammed_earth' | 'brick' | 'stone' | 'granite' | 'concrete';
export type ArmorLayer = 'none' | 'hide' | 'wicker' | 'metal_plate' | 'earth_berm';

export interface WallParams {
  material: WallMaterial;
  thickness: number;
  height: number;
  inclineAngle: number;
  armorLayer: ArmorLayer;
}

export interface WallMaterialProperties {
  density: number;
  compressiveStrength: number;
  tensileStrength: number;
  hardness: number;
  durability: number;
  color: string;
  label: string;
}

export interface ArmorLayerProperties {
  energyAbsorption: number;
  durabilityMultiplier: number;
  label: string;
}

export interface ImpactParams {
  projectileMass: number;
  impactVelocity: number;
  impactAngle: number;
  impactHeight: number;
}

export type DamageLevel = 'none' | 'superficial' | 'minor' | 'moderate' | 'severe' | 'critical' | 'destroyed';

export interface SingleImpactResult {
  impactId: number;
  impactParams: ImpactParams;
  energyOnImpact: number;
  absorbedEnergy: number;
  penetrationDepth: number;
  damageLevel: DamageLevel;
  damageScore: number;
  craterRadius: number;
  craterDepth: number;
  crackPropagation: CrackPoint[];
  heatZone: DamageHeatZone;
  collapseRisk: number;
  wallDurabilityAfter: number;
  timestamp: number;
}

export interface CrackPoint {
  x: number;
  y: number;
  length: number;
  angle: number;
  width: number;
}

export interface DamageHeatZone {
  centerX: number;
  centerY: number;
  radius: number;
  intensity: number;
}

export interface SiegeState {
  wallCurrentDurability: number;
  wallMaxDurability: number;
  totalDamageScore: number;
  impactHistory: SingleImpactResult[];
  durabilityCurve: { shot: number; durability: number }[];
  allCracks: CrackPoint[];
  allHeatZones: DamageHeatZone[];
  collapseProbability: number;
  isDestroyed: boolean;
  totalShotsFired: number;
}

export interface BestParamsSuggestion {
  armLength: number;
  counterweight: number;
  projectileWeight: number;
  releaseAngle: number;
  expectedDamagePerShot: number;
  expectedShotsToDestroy: number;
  resourceEfficiency: number;
}

export interface SiegeExperimentResult {
  id: string;
  name: string;
  wallParams: WallParams;
  catapultParams: CatapultParams;
  windParams: WindParams;
  shotCount: number;
  totalShotsFired: number;
  hitsOnWall: number;
  wallDestroyed: boolean;
  shotsToDestroy: number | null;
  totalDamageScore: number;
  maxPenetrationDepth: number;
  avgDamagePerShot: number;
  resourceConsumption: {
    counterweightKg: number;
    projectilesKg: number;
    totalKg: number;
  };
  damageEfficiency: number;
  resourceEfficiency: number;
  durabilityCurve: { shot: number; durability: number }[];
  impactHistory: SingleImpactResult[];
  timestamp: number;
}

export const WALL_MATERIAL_PROPERTIES: Record<WallMaterial, WallMaterialProperties> = {
  wood: {
    density: 600,
    compressiveStrength: 40,
    tensileStrength: 80,
    hardness: 2,
    durability: 100,
    color: '#8B4513',
    label: '木栅栏',
  },
  rammed_earth: {
    density: 1800,
    compressiveStrength: 15,
    tensileStrength: 3,
    hardness: 3,
    durability: 300,
    color: '#A0826D',
    label: '夯土墙',
  },
  brick: {
    density: 1900,
    compressiveStrength: 35,
    tensileStrength: 5,
    hardness: 5,
    durability: 500,
    color: '#B22222',
    label: '砖墙',
  },
  stone: {
    density: 2500,
    compressiveStrength: 100,
    tensileStrength: 10,
    hardness: 7,
    durability: 800,
    color: '#696969',
    label: '条石墙',
  },
  granite: {
    density: 2700,
    compressiveStrength: 200,
    tensileStrength: 15,
    hardness: 9,
    durability: 1200,
    color: '#4A4A4A',
    label: '花岗岩墙',
  },
  concrete: {
    density: 2400,
    compressiveStrength: 400,
    tensileStrength: 35,
    hardness: 8,
    durability: 1500,
    color: '#808080',
    label: '混凝土墙',
  },
};

export const ARMOR_LAYER_PROPERTIES: Record<ArmorLayer, ArmorLayerProperties> = {
  none: { energyAbsorption: 0, durabilityMultiplier: 1, label: '无防护' },
  hide: { energyAbsorption: 15, durabilityMultiplier: 1.1, label: '兽皮覆盖' },
  wicker: { energyAbsorption: 25, durabilityMultiplier: 1.15, label: '柳条防护' },
  metal_plate: { energyAbsorption: 50, durabilityMultiplier: 1.3, label: '金属板甲' },
  earth_berm: { energyAbsorption: 80, durabilityMultiplier: 1.5, label: '覆土护坡' },
};

export const DEFAULT_WALL_PARAMS: WallParams = {
  material: 'stone',
  thickness: 3,
  height: 8,
  inclineAngle: 5,
  armorLayer: 'none',
};

export const TARGET_MIN_DISTANCE = 80;
export const TARGET_MAX_DISTANCE = 150;
export const RANGE_LIMIT = 250;

export const DEFAULT_PARAMS: CatapultParams = {
  armLength: 3,
  counterweight: 100,
  projectileWeight: 5,
  releaseAngle: 45,
};

export const DEFAULT_WIND_PARAMS: WindParams = {
  windSpeed: 0,
  windDirection: 90,
  dragCoefficient: 0.47,
};

export const DEFAULT_TARGET_PARAMS: TargetParams = {
  targetDistance: 115,
  targetRadius: 5,
};

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type WeatherType = 'clear' | 'cloudy' | 'fog' | 'rain' | 'storm';
export type MoonPhase = 'new' | 'crescent' | 'quarter' | 'gibbous' | 'full';

export interface EnvironmentParams {
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  moonPhase: MoonPhase;
  torchCount: number;
  visibility: number;
}

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  dawn: '黎明',
  day: '白昼',
  dusk: '黄昏',
  night: '夜间',
};

export const WEATHER_LABELS: Record<WeatherType, string> = {
  clear: '晴朗',
  cloudy: '多云',
  fog: '大雾',
  rain: '降雨',
  storm: '暴风雨',
};

export const MOON_PHASE_LABELS: Record<MoonPhase, string> = {
  new: '新月',
  crescent: '蛾眉月',
  quarter: '上弦月',
  gibbous: '盈凸月',
  full: '满月',
};

export const DEFAULT_ENVIRONMENT_PARAMS: EnvironmentParams = {
  timeOfDay: 'day',
  weather: 'clear',
  moonPhase: 'full',
  torchCount: 0,
  visibility: 100,
};

export interface LogisticsState {
  projectileStock: number;
  counterweightStock: number;
  repairMaterials: number;
  soldierStamina: number;
  maxProjectileStock: number;
  maxCounterweightStock: number;
  maxRepairMaterials: number;
  maxSoldierStamina: number;
  shotsFiredInSession: number;
  totalRepairCount: number;
  totalFatigueAccumulated: number;
}

export const DEFAULT_LOGISTICS_STATE: LogisticsState = {
  projectileStock: 50,
  counterweightStock: 200,
  repairMaterials: 100,
  soldierStamina: 100,
  maxProjectileStock: 200,
  maxCounterweightStock: 1000,
  maxRepairMaterials: 500,
  maxSoldierStamina: 100,
  shotsFiredInSession: 0,
  totalRepairCount: 0,
  totalFatigueAccumulated: 0,
};

export interface ShotLogisticsCost {
  projectileUsed: number;
  counterweightUsed: number;
  staminaUsed: number;
  wearAndTear: number;
}

export interface RepairResult {
  materialsUsed: number;
  staminaUsed: number;
  repairAmount: number;
  timeTaken: number;
}

export interface NightBattleStats {
  nightSuccessRate: number;
  visibilityPenalty: number;
  accuracyModifier: number;
  windSensitivity: number;
  torchEffectiveness: number;
  moonEffectiveness: number;
}

export interface TacticalCombo {
  id: string;
  name: string;
  description: string;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  moonPhase: MoonPhase;
  torchCount: number;
  projectileWeight: number;
  counterweight: number;
  releaseAngle: number;
  shotInterval: number;
  repairThreshold: number;
}

export interface TacticalComparisonResult {
  id: string;
  name: string;
  combo: TacticalCombo;
  shotsToDestroy: number | null;
  wallDestroyed: boolean;
  totalTimeMinutes: number;
  totalProjectilesUsed: number;
  totalCounterweightUsed: number;
  totalRepairMaterialsUsed: number;
  soldierFatigue: number;
  nightSuccessRate: number;
  avgDamagePerShot: number;
  hitRate: number;
  costEffectiveness: number;
  overallScore: number;
  durabilityCurve: { shot: number; durability: number }[];
  timestamp: number;
}

export const TACTICAL_PRESETS: TacticalCombo[] = [
  {
    id: 'day_lightning',
    name: '白昼闪电战',
    description: '白天晴朗条件下快速连续攻击',
    timeOfDay: 'day',
    weather: 'clear',
    moonPhase: 'full',
    torchCount: 0,
    projectileWeight: 8,
    counterweight: 200,
    releaseAngle: 45,
    shotInterval: 15,
    repairThreshold: 20,
  },
  {
    id: 'night_stealth',
    name: '夜袭潜行',
    description: '满月夜借助月光隐蔽攻击',
    timeOfDay: 'night',
    weather: 'clear',
    moonPhase: 'full',
    torchCount: 2,
    projectileWeight: 10,
    counterweight: 250,
    releaseAngle: 50,
    shotInterval: 30,
    repairThreshold: 30,
  },
  {
    id: 'fog_siege',
    name: '雾天围攻',
    description: '大雾掩护下近距离强攻',
    timeOfDay: 'dawn',
    weather: 'fog',
    moonPhase: 'new',
    torchCount: 5,
    projectileWeight: 15,
    counterweight: 300,
    releaseAngle: 40,
    shotInterval: 25,
    repairThreshold: 25,
  },
  {
    id: 'rain_heavy',
    name: '雨夜重锤',
    description: '雨夜中使用重型弹丸减缓防守',
    timeOfDay: 'night',
    weather: 'rain',
    moonPhase: 'new',
    torchCount: 8,
    projectileWeight: 20,
    counterweight: 400,
    releaseAngle: 55,
    shotInterval: 45,
    repairThreshold: 40,
  },
];
