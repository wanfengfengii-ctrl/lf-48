import { Paper, Stack, Title, Text, Group, Badge, Divider, Box, SimpleGrid, Select, Slider, Progress, Tooltip } from '@mantine/core';
import {
  IconSun,
  IconMoon,
  IconCloud,
  IconCloudFog,
  IconCloudRain,
  IconCloudStorm,
  IconFlame,
  IconEye,
  IconTarget,
  IconWind,
  IconClock,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useCatapultStore } from '@/store/catapultStore';
import {
  TIME_OF_DAY_LABELS,
  WEATHER_LABELS,
  MOON_PHASE_LABELS,
  TimeOfDay,
  WeatherType,
  MoonPhase,
} from '@/types/catapult';
import {
  calculateVisibility,
  calculateAccuracyModifier,
  calculateWindModifier,
  calculateNightBattleStats,
  calculateFailureRate,
} from '@/lib/environment';

const TIME_OF_DAY_OPTIONS = Object.entries(TIME_OF_DAY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const WEATHER_OPTIONS = Object.entries(WEATHER_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const MOON_PHASE_OPTIONS = Object.entries(MOON_PHASE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const getWeatherIcon = (weather: WeatherType) => {
  switch (weather) {
    case 'clear':
      return <IconSun size={18} color="#F59E0B" />;
    case 'cloudy':
      return <IconCloud size={18} color="#6B7280" />;
    case 'fog':
      return <IconCloudFog size={18} color="#9CA3AF" />;
    case 'rain':
      return <IconCloudRain size={18} color="#3B82F6" />;
    case 'storm':
      return <IconCloudStorm size={18} color="#7C3AED" />;
  }
};

const getTimeIcon = (time: TimeOfDay) => {
  switch (time) {
    case 'day':
      return <IconSun size={18} color="#F59E0B" />;
    case 'night':
      return <IconMoon size={18} color="#6366F1" />;
    case 'dawn':
      return <IconSun size={18} color="#FB923C" />;
    case 'dusk':
      return <IconMoon size={18} color="#F97316" />;
  }
};

export default function EnvironmentControlPanel() {
  const { environmentParams, setEnvironmentParams, logisticsState } = useCatapultStore();

  const visibility = calculateVisibility(environmentParams);
  const accuracyMod = calculateAccuracyModifier(environmentParams);
  const windMod = calculateWindModifier(environmentParams);
  const nightStats = calculateNightBattleStats(environmentParams);
  const failureRate = calculateFailureRate(
    environmentParams,
    logisticsState.soldierStamina,
    logisticsState.shotsFiredInSession
  );

  const visibilityColor = visibility > 70 ? 'green' : visibility > 40 ? 'yellow' : 'red';
  const accuracyColor = accuracyMod > 0.8 ? 'green' : accuracyMod > 0.5 ? 'yellow' : 'red';

  return (
    <Paper p="md" radius="md" withBorder shadow="sm" style={{ height: '100%' }}>
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="md" wrap="nowrap">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconSun size={20} color="white" />
            </div>
            <div>
              <Title order={4} size="h5">
                环境控制
              </Title>
              <Text size="xs" c="dimmed">
                昼夜 · 天气 · 视野 · 命中
              </Text>
            </div>
          </Group>
        </Group>

        <Divider />

        <SimpleGrid cols={2} spacing="sm">
          <div>
            <Text size="xs" c="dimmed" mb={4}>
              时段
            </Text>
            <Select
              value={environmentParams.timeOfDay}
              onChange={(v) => v && setEnvironmentParams({ timeOfDay: v as TimeOfDay })}
              data={TIME_OF_DAY_OPTIONS}
              size="sm"
              leftSection={getTimeIcon(environmentParams.timeOfDay)}
            />
          </div>
          <div>
            <Text size="xs" c="dimmed" mb={4}>
              天气
            </Text>
            <Select
              value={environmentParams.weather}
              onChange={(v) => v && setEnvironmentParams({ weather: v as WeatherType })}
              data={WEATHER_OPTIONS}
              size="sm"
              leftSection={getWeatherIcon(environmentParams.weather)}
            />
          </div>
        </SimpleGrid>

        {(environmentParams.timeOfDay === 'night' ||
          environmentParams.timeOfDay === 'dusk' ||
          environmentParams.timeOfDay === 'dawn') && (
          <div>
            <Text size="xs" c="dimmed" mb={4}>
              月相
            </Text>
            <Select
              value={environmentParams.moonPhase}
              onChange={(v) => v && setEnvironmentParams({ moonPhase: v as MoonPhase })}
              data={MOON_PHASE_OPTIONS}
              size="sm"
              leftSection={<IconMoon size={16} color="#6366F1" />}
            />
          </div>
        )}

        <div>
          <Group justify="space-between" mb={4}>
            <Group gap="xs" wrap="nowrap">
              <IconFlame size={16} color="#F97316" />
              <Text size="xs" fw={500}>
                火把数量
              </Text>
            </Group>
            <Badge size="sm" variant="light" color="orange">
              {environmentParams.torchCount} 支
            </Badge>
          </Group>
          <Slider
            value={environmentParams.torchCount}
            onChange={(v) => setEnvironmentParams({ torchCount: v })}
            min={0}
            max={20}
            step={1}
            marks={[
              { value: 0, label: '0' },
              { value: 10, label: '10' },
              { value: 20, label: '20' },
            ]}
            color="orange"
          />
        </div>

        <Divider />

        <Box>
          <Group justify="space-between" mb="xs">
            <Group gap="xs" wrap="nowrap">
              <IconEye size={16} color={visibilityColor === 'green' ? '#22C55E' : visibilityColor === 'yellow' ? '#EAB308' : '#EF4444'} />
              <Text size="xs" fw={500}>
                视野范围
              </Text>
            </Group>
            <Text size="xs" fw={600} c={visibilityColor}>
              {visibility}%
            </Text>
          </Group>
          <Progress value={visibility} color={visibilityColor} size="sm" />
        </Box>

        <Box>
          <Group justify="space-between" mb="xs">
            <Group gap="xs" wrap="nowrap">
              <IconTarget size={16} color={accuracyColor === 'green' ? '#22C55E' : accuracyColor === 'yellow' ? '#EAB308' : '#EF4444'} />
              <Text size="xs" fw={500}>
                命中精度系数
              </Text>
            </Group>
            <Text size="xs" fw={600} c={accuracyColor}>
              {(accuracyMod * 100).toFixed(0)}%
            </Text>
          </Group>
          <Progress value={accuracyMod * 100} color={accuracyColor} size="sm" />
        </Box>

        <SimpleGrid cols={2} spacing="xs">
          <Paper p="xs" withBorder style={{ backgroundColor: '#EFF6FF' }}>
            <Group gap="xs" wrap="nowrap">
              <IconWind size={16} color="#2563EB" />
              <Stack gap={0}>
                <Text size="xs" c="dimmed">
                  风力影响
                </Text>
                <Text fw={700} size="sm">
                  ×{windMod.toFixed(2)}
                </Text>
              </Stack>
            </Group>
          </Paper>
          <Paper p="xs" withBorder style={{ backgroundColor: '#FEF2F2' }}>
            <Group gap="xs" wrap="nowrap">
              <IconAlertTriangle size={16} color="#DC2626" />
              <Stack gap={0}>
                <Text size="xs" c="dimmed">
                  故障概率
                </Text>
                <Text fw={700} size="sm">
                  {(failureRate * 100).toFixed(1)}%
                </Text>
              </Stack>
            </Group>
          </Paper>
        </SimpleGrid>

        {environmentParams.timeOfDay === 'night' && (
          <Paper p="sm" withBorder style={{ backgroundColor: '#1E1B4B', color: '#E0E7FF' }}>
            <Group gap="xs" wrap="nowrap" mb="xs">
              <IconMoon size={18} color="#818CF8" />
              <Text size="sm" fw={600}>
                夜战数据
              </Text>
            </Group>
            <SimpleGrid cols={2} spacing="xs">
              <Box>
                <Text size="xs" c="indigo.3">
                  夜战成功率
                </Text>
                <Text fw={700} size="sm">
                  {nightStats.nightSuccessRate}%
                </Text>
              </Box>
              <Box>
                <Text size="xs" c="indigo.3">
                  视野损失
                </Text>
                <Text fw={700} size="sm">
                  -{nightStats.visibilityPenalty}%
                </Text>
              </Box>
              <Box>
                <Text size="xs" c="indigo.3">
                  月光效果
                </Text>
                <Text fw={700} size="sm">
                  {nightStats.moonEffectiveness}%
                </Text>
              </Box>
              <Box>
                <Text size="xs" c="indigo.3">
                  火把效果
                </Text>
                <Text fw={700} size="sm">
                  {nightStats.torchEffectiveness}%
                </Text>
              </Box>
            </SimpleGrid>
          </Paper>
        )}
      </Stack>
    </Paper>
  );
}
