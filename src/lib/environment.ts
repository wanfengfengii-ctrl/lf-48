import {
  EnvironmentParams,
  NightBattleStats,
  TimeOfDay,
  WeatherType,
  MoonPhase,
  WindParams,
} from '@/types/catapult';

const TIME_OF_DAY_VISIBILITY: Record<TimeOfDay, number> = {
  dawn: 75,
  day: 100,
  dusk: 65,
  night: 25,
};

const TIME_OF_DAY_ACCURACY: Record<TimeOfDay, number> = {
  dawn: 0.9,
  day: 1.0,
  dusk: 0.8,
  night: 0.5,
};

const WEATHER_VISIBILITY: Record<WeatherType, number> = {
  clear: 100,
  cloudy: 85,
  fog: 30,
  rain: 50,
  storm: 20,
};

const WEATHER_ACCURACY: Record<WeatherType, number> = {
  clear: 1.0,
  cloudy: 0.95,
  fog: 0.6,
  rain: 0.75,
  storm: 0.4,
};

const WEATHER_WIND_MODIFIER: Record<WeatherType, number> = {
  clear: 1.0,
  cloudy: 1.2,
  fog: 0.8,
  rain: 1.5,
  storm: 2.5,
};

const WEATHER_DRAG_MODIFIER: Record<WeatherType, number> = {
  clear: 1.0,
  cloudy: 1.05,
  fog: 1.15,
  rain: 1.3,
  storm: 1.5,
};

const MOON_VISIBILITY: Record<MoonPhase, number> = {
  new: 0,
  crescent: 15,
  quarter: 35,
  gibbous: 60,
  full: 100,
};

const TORCH_VISIBILITY_PER_UNIT = 8;
const TORCH_ACCURACY_PER_UNIT = 0.03;
const MAX_TORCH_EFFECT = 10;

export function calculateVisibility(env: EnvironmentParams): number {
  const baseVisibility = TIME_OF_DAY_VISIBILITY[env.timeOfDay];
  const weatherMultiplier = WEATHER_VISIBILITY[env.weather] / 100;

  let moonBonus = 0;
  if (env.timeOfDay === 'night' || env.timeOfDay === 'dusk' || env.timeOfDay === 'dawn') {
    moonBonus = MOON_VISIBILITY[env.moonPhase] * 0.4;
  }

  const torchBonus = Math.min(env.torchCount * TORCH_VISIBILITY_PER_UNIT, MAX_TORCH_EFFECT * TORCH_VISIBILITY_PER_UNIT);

  const totalVisibility = (baseVisibility + moonBonus) * weatherMultiplier + torchBonus;
  return Math.min(100, Math.max(0, Math.round(totalVisibility * 100) / 100));
}

export function calculateAccuracyModifier(env: EnvironmentParams): number {
  const timeAccuracy = TIME_OF_DAY_ACCURACY[env.timeOfDay];
  const weatherAccuracy = WEATHER_ACCURACY[env.weather];

  let moonBonus = 0;
  if (env.timeOfDay === 'night') {
    moonBonus = MOON_VISIBILITY[env.moonPhase] * 0.003;
  }

  const torchBonus = Math.min(env.torchCount * TORCH_ACCURACY_PER_UNIT, MAX_TORCH_EFFECT * TORCH_ACCURACY_PER_UNIT);

  const totalModifier = timeAccuracy * weatherAccuracy + moonBonus + torchBonus;
  return Math.min(1.2, Math.max(0.2, Math.round(totalModifier * 1000) / 1000));
}

export function calculateWindModifier(env: EnvironmentParams): number {
  return WEATHER_WIND_MODIFIER[env.weather];
}

export function calculateDragModifier(env: EnvironmentParams): number {
  return WEATHER_DRAG_MODIFIER[env.weather];
}

export function modifyWindParams(windParams: WindParams, env: EnvironmentParams): WindParams {
  const windModifier = calculateWindModifier(env);
  const dragModifier = calculateDragModifier(env);

  return {
    windSpeed: windParams.windSpeed * windModifier,
    windDirection: windParams.windDirection,
    dragCoefficient: windParams.dragCoefficient * dragModifier,
  };
}

export function calculateNightBattleStats(env: EnvironmentParams): NightBattleStats {
  const visibility = calculateVisibility(env);
  const accuracyModifier = calculateAccuracyModifier(env);
  const windSensitivity = calculateWindModifier(env);

  const isNight = env.timeOfDay === 'night';
  const nightSuccessRate = isNight ? accuracyModifier * 100 : 100;

  const visibilityPenalty = 100 - visibility;

  const moonEffectiveness = MOON_VISIBILITY[env.moonPhase];
  const torchEffectiveness = Math.min(env.torchCount / MAX_TORCH_EFFECT, 1) * 100;

  return {
    nightSuccessRate: Math.round(nightSuccessRate * 100) / 100,
    visibilityPenalty: Math.round(visibilityPenalty * 100) / 100,
    accuracyModifier: Math.round(accuracyModifier * 1000) / 1000,
    windSensitivity: Math.round(windSensitivity * 100) / 100,
    torchEffectiveness: Math.round(torchEffectiveness * 100) / 100,
    moonEffectiveness: Math.round(moonEffectiveness * 100) / 100,
  };
}

export function calculateShotInterval(
  baseInterval: number,
  env: EnvironmentParams,
  soldierStamina: number
): number {
  const visibilityFactor = 1 + (100 - calculateVisibility(env)) / 200;
  const staminaFactor = 1 + (100 - soldierStamina) / 100;
  const weatherFactor = env.weather === 'storm' ? 1.5 : env.weather === 'rain' ? 1.2 : 1;

  return Math.round(baseInterval * visibilityFactor * staminaFactor * weatherFactor * 10) / 10;
}

export function calculateFailureRate(
  env: EnvironmentParams,
  soldierStamina: number,
  shotsFired: number
): number {
  const baseRate = 0.01;
  const weatherRate = env.weather === 'storm' ? 0.08 : env.weather === 'rain' ? 0.04 : env.weather === 'fog' ? 0.02 : 0;
  const nightRate = env.timeOfDay === 'night' ? 0.03 : env.timeOfDay === 'dusk' || env.timeOfDay === 'dawn' ? 0.015 : 0;
  const fatigueRate = Math.max(0, (100 - soldierStamina) / 500);
  const wearRate = Math.min(0.1, shotsFired / 500);

  const totalRate = baseRate + weatherRate + nightRate + fatigueRate + wearRate;
  return Math.min(0.3, Math.round(totalRate * 1000) / 1000);
}

export function getEnvironmentDescription(env: EnvironmentParams): string {
  const parts: string[] = [];

  parts.push(`${env.timeOfDay === 'day' ? '白天' : env.timeOfDay === 'night' ? '夜间' : env.timeOfDay === 'dawn' ? '黎明' : '黄昏'}`);
  parts.push(env.weather === 'clear' ? '晴朗' : env.weather === 'cloudy' ? '多云' : env.weather === 'fog' ? '大雾' : env.weather === 'rain' ? '降雨' : '暴风雨');

  if (env.timeOfDay === 'night') {
    parts.push(`${env.moonPhase === 'full' ? '满月' : env.moonPhase === 'new' ? '新月' : env.moonPhase === 'quarter' ? '弦月' : env.moonPhase === 'crescent' ? '蛾眉月' : '凸月'}`);
  }

  if (env.torchCount > 0) {
    parts.push(`${env.torchCount}支火把`);
  }

  return parts.join(' · ');
}
