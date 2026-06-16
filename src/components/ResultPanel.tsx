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
  const { currentResult, params } = useCatapultStore();

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

  const isOutOfRange = currentResult.distance >= RANGE_LIMIT;

  return (
    <Paper p="md" radius="md" withBorder shadow="sm" style={{ height: '100%' }}>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={4} size="h5">
            模拟结果
          </Title>
          <StatusBadge status={currentResult.status} />
        </Group>

        {isOutOfRange && (
          <Box p="sm" style={{ backgroundColor: '#FEF2F2', borderRadius: 6, border: '1px solid #FECACA' }}>
            <Group gap="xs">
              <IconAlertTriangle size={18} color="#DC2626" />
              <Text size="sm" color="red" fw={500}>
                警告：弹丸超出靶场范围 (最大 {RANGE_LIMIT}m)
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
        </SimpleGrid>

        <Divider />

        <Box>
          <Text size="sm" fw={500} mb="xs">
            弹丸轨迹
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
