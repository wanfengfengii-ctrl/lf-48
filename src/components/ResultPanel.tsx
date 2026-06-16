import { Paper, Stack, Title, Text, Group, Badge, Divider, Box, SimpleGrid } from '@mantine/core';
import {
  IconTarget,
  IconArrowUp,
  IconRuler,
  IconGauge,
  IconClock,
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconWind,
  IconArrowsLeftRight,
  IconCrosshair,
} from '@tabler/icons-react';
import { useCatapultStore } from '@/store/catapultStore';
import { SimulationResult } from '@/types/catapult';
import { RANGE_LIMIT } from '@/types/catapult';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TARGET_MIN_DISTANCE, TARGET_MAX_DISTANCE } from '@/types/catapult';

function StatusBadge({ status }: { status: SimulationResult['status'] }) {
  if (status === 'hit') {
    return (
      <Badge color="green" size="lg" leftSection={<IconCircleCheck size={14} />}>
        命中目标
      </Badge>
    );
  } else if (status === 'too_close') {
    return (
      <Badge color="yellow" size="lg" leftSection={<IconAlertTriangle size={14} />}>
        落点过近
      </Badge>
    );
  } else {
    return (
      <Badge color="red" size="lg" leftSection={<IconCircleX size={14} />}>
        超出靶场
      </Badge>
    );
  }
}

export default function ResultPanel() {
  const { currentResult, params, windParams, targetParams } = useCatapultStore();

  if (!currentResult) {
    return (
      <Paper p="md" radius="md" withBorder shadow="sm" style={{ height: '100%', minHeight: 400 }}>
        <Stack justify="center" align="center" style={{ height: '100%' }}>
          <IconTarget size={48} color="#CBD5E1" />
          <Text color="dimmed" ta="center">
            调整参数后点击「发射模拟」
            <br />
            查看投射结果
          </Text>
        </Stack>
      </Paper>
    );
  }

  const trajectoryData = currentResult.trajectory
    .filter((_, i) => i % 3 === 0)
    .map((p) => ({ ...p }));

  const isTooClose = currentResult.status === 'too_close';
  const isTooFar = currentResult.status === 'too_far';
  const isOutOfRange = currentResult.distance >= RANGE_LIMIT;

  return (
    <Paper p="md" radius="md" withBorder shadow="sm" style={{ height: '100%' }}>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={4} size="h5">
            模拟结果
          </Title>
          <Group gap="xs">
            {currentResult.isTargetHit ? (
              <Badge color="green" size="lg" leftSection={<IconCrosshair size={14} />}>
                命中靶心
              </Badge>
            ) : (
              <Badge color="orange" size="lg" leftSection={<IconCrosshair size={14} />}>
                未命中靶心
              </Badge>
            )}
            <StatusBadge status={currentResult.status} />
          </Group>
        </Group>

        {isTooClose && (
          <Box p="sm" style={{ backgroundColor: '#FEF9C3', borderRadius: 6, border: '1px solid #FDE047' }}>
            <Group gap="xs">
              <IconAlertTriangle size={18} color="#CA8A04" />
              <Text size="sm" c="yellow.8" fw={500}>
                提示：弹丸落点过近（{currentResult.distance}m），未进入靶场范围（{TARGET_MIN_DISTANCE}-{TARGET_MAX_DISTANCE}m）
              </Text>
            </Group>
          </Box>
        )}

        {isTooFar && !isOutOfRange && (
          <Box p="sm" style={{ backgroundColor: '#FFEDD5', borderRadius: 6, border: '1px solid #FDBA74' }}>
            <Group gap="xs">
              <IconAlertTriangle size={18} color="#C2410C" />
              <Text size="sm" c="orange.8" fw={500}>
                提示：弹丸落点过远（{currentResult.distance}m），超出靶场范围（{TARGET_MIN_DISTANCE}-{TARGET_MAX_DISTANCE}m）
              </Text>
            </Group>
          </Box>
        )}

        {isOutOfRange && (
          <Box p="sm" style={{ backgroundColor: '#FEF2F2', borderRadius: 6, border: '1px solid #FECACA' }}>
            <Group gap="xs">
              <IconAlertTriangle size={18} color="#DC2626" />
              <Text size="sm" color="red" fw={500}>
                警告：弹丸超出最大靶场范围 (最大 {RANGE_LIMIT}m)
              </Text>
            </Group>
          </Box>
        )}

        <Divider />

        <SimpleGrid cols={2} spacing="md">
          <Paper p="sm" withBorder style={{ backgroundColor: '#F0FDF4' }}>
            <Group gap="xs">
              <IconRuler size={20} color="#16A34A" />
              <Stack gap={0}>
                <Text size="xs" color="dimmed">
                  射程距离
                </Text>
                <Text fw={700} size="lg">
                  {currentResult.distance} m
                </Text>
              </Stack>
            </Group>
          </Paper>

          <Paper p="sm" withBorder style={{ backgroundColor: '#EFF6FF' }}>
            <Group gap="xs">
              <IconArrowUp size={20} color="#2563EB" />
              <Stack gap={0}>
                <Text size="xs" color="dimmed">
                  最大高度
                </Text>
                <Text fw={700} size="lg">
                  {currentResult.maxHeight} m
                </Text>
              </Stack>
            </Group>
          </Paper>

          <Paper p="sm" withBorder style={{ backgroundColor: '#FEF3C7' }}>
            <Group gap="xs">
              <IconGauge size={20} color="#D97706" />
              <Stack gap={0}>
                <Text size="xs" color="dimmed">
                  冲击速度
                </Text>
                <Text fw={700} size="lg">
                  {currentResult.impactVelocity} m/s
                </Text>
              </Stack>
            </Group>
          </Paper>

          <Paper p="sm" withBorder style={{ backgroundColor: '#F3E8FF' }}>
            <Group gap="xs">
              <IconClock size={20} color="#7C3AED" />
              <Stack gap={0}>
                <Text size="xs" color="dimmed">
                  飞行时间
                </Text>
                <Text fw={700} size="lg">
                  {currentResult.flightTime} s
                </Text>
              </Stack>
            </Group>
          </Paper>

          <Paper p="sm" withBorder style={{ backgroundColor: '#E0F2FE' }}>
            <Group gap="xs">
              <IconArrowsLeftRight size={20} color="#0284C7" />
              <Stack gap={0}>
                <Text size="xs" color="dimmed">
                  横向风偏
                </Text>
                <Text fw={700} size="lg">
                  {currentResult.lateralDeviation > 0 ? '+' : ''}{currentResult.lateralDeviation} m
                </Text>
              </Stack>
            </Group>
          </Paper>

          <Paper p="sm" withBorder style={{ backgroundColor: currentResult.isTargetHit ? '#DCFCE7' : '#FEE2E2' }}>
            <Group gap="xs">
              <IconCrosshair size={20} color={currentResult.isTargetHit ? '#16A34A' : '#DC2626'} />
              <Stack gap={0}>
                <Text size="xs" color="dimmed">
                  偏离靶心
                </Text>
                <Text fw={700} size="lg">
                  {currentResult.targetDeviation} m
                </Text>
              </Stack>
            </Group>
          </Paper>
        </SimpleGrid>

        <Divider />

        <Group gap="xs" wrap="nowrap">
          <IconWind size={18} color="#0EA5E9" />
          <Text size="sm" fw={500}>
            风场条件
          </Text>
        </Group>
        <SimpleGrid cols={3} spacing="xs">
          <Box>
            <Text size="xs" color="dimmed">
              风速
            </Text>
            <Text size="sm" fw={600}>
              {windParams.windSpeed} m/s
            </Text>
          </Box>
          <Box>
            <Text size="xs" color="dimmed">
              风向
            </Text>
            <Text size="sm" fw={600}>
              {windParams.windDirection}°
            </Text>
          </Box>
          <Box>
            <Text size="xs" color="dimmed">
              阻力系数
            </Text>
            <Text size="sm" fw={600}>
              Cd {windParams.dragCoefficient}
            </Text>
          </Box>
        </SimpleGrid>

        <Divider />

        <Box>
          <Text size="sm" fw={500} mb="xs">
            弹丸轨迹 (侧视图)
          </Text>
          <Box style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="距离"
                  unit="m"
                  tick={{ fontSize: 11 }}
                  domain={[0, Math.max(TARGET_MAX_DISTANCE + 30, currentResult.distance + 20)]}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="高度"
                  unit="m"
                  tick={{ fontSize: 11 }}
                  domain={[0, currentResult.maxHeight + 10]}
                />
                <RechartsTooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                />
                <ReferenceLine
                  x={TARGET_MIN_DISTANCE}
                  stroke="#22C55E"
                  strokeDasharray="3 3"
                  label={{ value: `${TARGET_MIN_DISTANCE}m`, position: 'top', fontSize: 10, fill: '#22C55E' }}
                />
                <ReferenceLine
                  x={TARGET_MAX_DISTANCE}
                  stroke="#22C55E"
                  strokeDasharray="3 3"
                  label={{ value: `${TARGET_MAX_DISTANCE}m`, position: 'top', fontSize: 10, fill: '#22C55E' }}
                />
                <ReferenceLine
                  x={targetParams.targetDistance}
                  stroke="#EF4444"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  label={{ value: `靶心${targetParams.targetDistance}m`, position: 'insideTopLeft', fontSize: 10, fill: '#EF4444' }}
                />
                <Scatter
                  name="轨迹"
                  data={trajectoryData}
                  fill="#F97316"
                  line={{ stroke: '#F97316', strokeWidth: 2 }}
                  lineType="joint"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        <Divider />

        <Box>
          <Text size="sm" fw={500} mb="xs">
            横向风偏轨迹 (俯视图)
          </Text>
          <Box style={{ height: 150 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="距离"
                  unit="m"
                  tick={{ fontSize: 11 }}
                  domain={[0, Math.max(TARGET_MAX_DISTANCE + 30, currentResult.distance + 20)]}
                />
                <YAxis
                  type="number"
                  dataKey="z"
                  name="横向偏移"
                  unit="m"
                  tick={{ fontSize: 11 }}
                />
                <RechartsTooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  formatter={(value: number, name: string) => {
                    if (name === '横向偏移') return [`${value.toFixed(2)} m`, '横向偏移'];
                    return [value, name];
                  }}
                />
                <ReferenceLine
                  x={targetParams.targetDistance}
                  stroke="#EF4444"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
                <ReferenceLine
                  y={0}
                  stroke="#64748B"
                  strokeDasharray="2 2"
                />
                <Scatter
                  name="风偏轨迹"
                  data={currentResult.trajectory3D
                    .filter((_, i) => i % 5 === 0)
                    .map((p) => ({ x: p.x, z: p.z }))}
                  fill="#0EA5E9"
                  line={{ stroke: '#0EA5E9', strokeWidth: 2 }}
                  lineType="joint"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        <Divider />

        <Box>
          <Text size="sm" fw={500} mb="xs">
            当前参数
          </Text>
          <Group gap="md">
            <Text size="xs" color="dimmed">
              臂长: <Text span fw={500}>{params.armLength}m</Text>
            </Text>
            <Text size="xs" color="dimmed">
              配重: <Text span fw={500}>{params.counterweight}kg</Text>
            </Text>
            <Text size="xs" color="dimmed">
              弹重: <Text span fw={500}>{params.projectileWeight}kg</Text>
            </Text>
            <Text size="xs" color="dimmed">
              角度: <Text span fw={500}>{params.releaseAngle}°</Text>
            </Text>
          </Group>
        </Box>
      </Stack>
    </Paper>
  );
}
