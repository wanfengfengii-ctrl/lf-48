import { Paper, Stack, Title, Group, ActionIcon, Text, Divider, SimpleGrid, Badge, Box, Tooltip as MantineTooltip, ScrollArea } from '@mantine/core';
import { IconTrash, IconFolderOpen, IconTrashX, IconChartBar, IconCircleCheck, IconAlertTriangle, IconCircleX } from '@tabler/icons-react';
import { useCatapultStore } from '@/store/catapultStore';
import { SavedScheme } from '@/types/catapult';
import { TARGET_MIN_DISTANCE, TARGET_MAX_DISTANCE } from '@/types/catapult';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';

function StatusDot({ status }: { status: SavedScheme['result']['status'] }) {
  if (status === 'hit') {
    return <IconCircleCheck size={16} color="#22C55E" />;
  } else if (status === 'too_close') {
    return <IconAlertTriangle size={16} color="#EAB308" />;
  } else {
    return <IconCircleX size={16} color="#EF4444" />;
  }
}

const getColor = (status: SavedScheme['result']['status']) => {
  if (status === 'hit') return '#22C55E';
  if (status === 'too_close') return '#EAB308';
  return '#EF4444';
};

const getStatusLabel = (status: SavedScheme['result']['status']) => {
  if (status === 'hit') return '命中';
  if (status === 'too_close') return '过近';
  return '过远';
};

export default function SchemesPanel() {
  const { savedSchemes, deleteScheme, clearSchemes, loadScheme } = useCatapultStore();

  const chartData = savedSchemes.map((s) => ({
    name: s.name.length > 8 ? s.name.slice(0, 8) + '...' : s.name,
    fullName: s.name,
    distance: s.result.distance,
    maxHeight: s.result.maxHeight,
    status: s.result.status,
  }));

  if (savedSchemes.length === 0) {
    return (
      <Paper p="md" radius="md" withBorder shadow="sm" style={{ height: '100%', minHeight: 300 }}>
        <Stack justify="center" align="center" style={{ height: '100%' }}>
          <IconChartBar size={48} color="#CBD5E1" />
          <Text color="dimmed" ta="center">
            暂无保存的方案
            <br />
            完成模拟后可保存方案进行对比
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper p="md" radius="md" withBorder shadow="sm" style={{ height: '100%' }}>
      <Stack gap="md" style={{ height: '100%' }}>
        <Group justify="space-between">
          <Title order={4} size="h5">
            方案对比 ({savedSchemes.length})
          </Title>
          <MantineTooltip label="清空所有方案">
            <ActionIcon variant="subtle" color="red" onClick={clearSchemes} size="sm">
              <IconTrashX size={18} />
            </ActionIcon>
          </MantineTooltip>
        </Group>

        <Divider />

        <Box>
          <Text size="sm" fw={500} mb="xs">
            射程对比图
          </Text>
          <Box style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="m" />
                <RechartsTooltip
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: number, _name: string, props: any) => {
                    const { fullName, status } = props.payload;
                    return [`${value} m (${getStatusLabel(status as 'hit' | 'too_close' | 'too_far')})`, fullName];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine
                  y={TARGET_MIN_DISTANCE}
                  stroke="#22C55E"
                  strokeDasharray="3 3"
                  label={{ value: `靶区${TARGET_MIN_DISTANCE}m`, position: 'right', fontSize: 10, fill: '#22C55E' }}
                />
                <ReferenceLine
                  y={TARGET_MAX_DISTANCE}
                  stroke="#22C55E"
                  strokeDasharray="3 3"
                />
                <Bar dataKey="distance" name="射程 (m)" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getColor(entry.status)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        <Group gap="sm" wrap="nowrap">
          <Group gap={4}>
            <Box w={12} h={12} bg="green" />
            <Text size="xs">命中</Text>
          </Group>
          <Group gap={4}>
            <Box w={12} h={12} bg="yellow" />
            <Text size="xs">过近</Text>
          </Group>
          <Group gap={4}>
            <Box w={12} h={12} bg="red" />
            <Text size="xs">过远</Text>
          </Group>
        </Group>

        <Divider />

        <ScrollArea h={200} type="auto">
          <Stack gap="xs">
            {savedSchemes.map((scheme) => (
              <Paper key={scheme.id} p="sm" withBorder style={{ backgroundColor: '#FAFAFA' }}>
                <Group justify="space-between" gap="xs">
                  <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                    <StatusDot status={scheme.result.status} />
                    <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" fw={500} truncate>
                        {scheme.name}
                      </Text>
                      <Group gap="xs" wrap="nowrap">
                        <Badge size="xs" variant="light" color="gray">
                          {scheme.result.distance}m
                        </Badge>
                        <Text size="xs" color="dimmed">
                          {scheme.params.armLength}m·{scheme.params.counterweight}kg·{scheme.params.projectileWeight}kg·{scheme.params.releaseAngle}°
                        </Text>
                      </Group>
                    </Stack>
                  </Group>
                  <Group gap={0}>
                    <MantineTooltip label="加载此方案">
                      <ActionIcon variant="subtle" onClick={() => loadScheme(scheme.id)} size="sm">
                        <IconFolderOpen size={16} />
                      </ActionIcon>
                    </MantineTooltip>
                    <MantineTooltip label="删除">
                      <ActionIcon variant="subtle" color="red" onClick={() => deleteScheme(scheme.id)} size="sm">
                        <IconTrash size={16} />
                      </ActionIcon>
                    </MantineTooltip>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        </ScrollArea>

        <SimpleGrid cols={3} spacing="xs">
          <Paper p="xs" withBorder style={{ backgroundColor: '#F0FDF4', textAlign: 'center' }}>
            <Text size="xs" color="dimmed">命中</Text>
            <Text fw={700}>{savedSchemes.filter(s => s.result.status === 'hit').length}</Text>
          </Paper>
          <Paper p="xs" withBorder style={{ backgroundColor: '#FEF9C3', textAlign: 'center' }}>
            <Text size="xs" color="dimmed">过近</Text>
            <Text fw={700}>{savedSchemes.filter(s => s.result.status === 'too_close').length}</Text>
          </Paper>
          <Paper p="xs" withBorder style={{ backgroundColor: '#FEF2F2', textAlign: 'center' }}>
            <Text size="xs" color="dimmed">过远</Text>
            <Text fw={700}>{savedSchemes.filter(s => s.result.status === 'too_far').length}</Text>
          </Paper>
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}
