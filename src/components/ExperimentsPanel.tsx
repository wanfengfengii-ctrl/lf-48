import { useState } from 'react';
import {
  Paper,
  Stack,
  Title,
  Text,
  Group,
  ActionIcon,
  Tooltip,
  Divider,
  Box,
  SimpleGrid,
  Badge,
  ScrollArea,
  Checkbox,
} from '@mantine/core';
import {
  IconTrash,
  IconFolderOpen,
  IconTrashX,
  IconChartBar,
  IconWind,
  IconTarget,
  IconCircleCheck,
  IconAlertTriangle,
  IconCircleX,
} from '@tabler/icons-react';
import { useCatapultStore } from '@/store/catapultStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from 'recharts';

const COLORS = ['#8B5CF6', '#F97316', '#0EA5E9', '#10B981', '#EF4444', '#F59E0B', '#EC4899', '#6366F1'];

function StatusDot({ hitRate }: { hitRate: number }) {
  if (hitRate >= 80) return <IconCircleCheck size={16} color="#22C55E" />;
  if (hitRate >= 40) return <IconAlertTriangle size={16} color="#EAB308" />;
  return <IconCircleX size={16} color="#EF4444" />;
}

export default function ExperimentsPanel() {
  const { batchExperiments, deleteBatchExperiment, clearBatchExperiments, loadBatchExperiment } = useCatapultStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedExperiments = batchExperiments.filter((e) => selectedIds.has(e.id));
  const compareExperiments = selectedExperiments.length > 0 ? selectedExperiments : batchExperiments;

  const hitRateChartData = compareExperiments.map((e, i) => ({
    name: e.name.length > 8 ? e.name.slice(0, 8) + '...' : e.name,
    fullName: e.name,
    命中率: e.stats.hitRate,
    color: COLORS[i % COLORS.length],
  }));

  const distanceChartData = compareExperiments.map((e, i) => ({
    name: e.name.length > 8 ? e.name.slice(0, 8) + '...' : e.name,
    fullName: e.name,
    平均射程: e.stats.avgDistance,
    射程标准差: e.stats.stdDistance,
    color: COLORS[i % COLORS.length],
  }));

  const radarData = compareExperiments.length > 0 ? [
    ...compareExperiments.map((e) => ({
      subject: '命中率',
      [e.name]: e.stats.hitRate,
      fullMark: 100,
    })),
    ...compareExperiments.map((e) => ({
      subject: '射程稳定性',
      [e.name]: Math.max(0, 100 - e.stats.stdDistance * 5),
      fullMark: 100,
    })),
    ...compareExperiments.map((e) => ({
      subject: '抗风能力',
      [e.name]: Math.max(0, 100 - Math.abs(e.stats.avgLateralDeviation) * 10),
      fullMark: 100,
    })),
    ...compareExperiments.map((e) => ({
      subject: '精度(CEP)',
      [e.name]: Math.max(0, 100 - e.stats.cEP * 5),
      fullMark: 100,
    })),
  ] : [];

  if (batchExperiments.length === 0) {
    return (
      <Paper p="md" radius="md" withBorder shadow="sm" style={{ height: '100%', minHeight: 300 }}>
        <Stack justify="center" align="center" style={{ height: '100%' }}>
          <IconChartBar size={48} color="#CBD5E1" />
          <Text color="dimmed" ta="center">
            暂无保存的批量实验
            <br />
            完成批量实验后可保存进行多方案对比
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper p="md" radius="md" withBorder shadow="sm" style={{ height: '100%' }}>
      <Stack gap="md" style={{ height: '100%' }}>
        <Group justify="space-between">
          <Group gap="xs">
            <IconChartBar size={20} color="#8B5CF6" />
            <Title order={4} size="h5">
              实验方案对比 ({batchExperiments.length})
            </Title>
            {selectedExperiments.length > 0 && (
              <Badge color="violet" variant="light">
                已选 {selectedExperiments.length} 个对比
              </Badge>
            )}
          </Group>
          <Tooltip label="清空所有实验">
            <ActionIcon variant="subtle" color="red" onClick={clearBatchExperiments} size="sm">
              <IconTrashX size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Divider />

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <Box>
            <Text size="sm" fw={500} mb="xs">
              命中率对比
            </Text>
            <Box style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hitRateChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <RechartsTooltip
                    contentStyle={{ fontSize: 12, borderRadius: 6 }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: number, _name: string, props: any) => {
                      return [`${value}%`, props.payload.fullName];
                    }}
                  />
                  <Bar dataKey="命中率" radius={[4, 4, 0, 0]}>
                    {hitRateChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          <Box>
            <Text size="sm" fw={500} mb="xs">
              射程与稳定性对比
            </Text>
            <Box style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distanceChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="m" />
                  <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="平均射程" radius={[4, 4, 0, 0]} fill="#F97316" />
                  <Bar dataKey="射程标准差" radius={[4, 4, 0, 0]} fill="#0EA5E9" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </SimpleGrid>

        {compareExperiments.length >= 2 && (
          <>
            <Divider />
            <Box>
              <Text size="sm" fw={500} mb="xs">
                综合性能雷达图
              </Text>
              <Box style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {compareExperiments.map((e, i) => (
                      <Radar
                        key={e.id}
                        name={e.name}
                        dataKey={e.name}
                        stroke={COLORS[i % COLORS.length]}
                        fill={COLORS[i % COLORS.length]}
                        fillOpacity={0.2}
                      />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </>
        )}

        <Divider />

        <SimpleGrid cols={4} spacing="xs">
          {compareExperiments.map((e, i) => (
            <Paper key={e.id} p="xs" withBorder style={{ borderLeft: `4px solid ${COLORS[i % COLORS.length]}` }}>
              <Text size="xs" fw={600} truncate title={e.name}>
                {e.name}
              </Text>
              <Group gap={4} mt={4}>
                <IconWind size={12} color="#0EA5E9" />
                <Text size="xs" color="dimmed">
                  {e.windParams.windSpeed}m/s {e.windParams.windDirection}°
                </Text>
              </Group>
              <Text size="xs" color="dimmed">
                臂{e.params.armLength}m · 配{e.params.counterweight}kg · 弹{e.params.projectileWeight}kg · {e.params.releaseAngle}°
              </Text>
            </Paper>
          ))}
        </SimpleGrid>

        <Divider />

        <ScrollArea h={180} type="auto">
          <Stack gap="xs">
            {batchExperiments.map((exp, index) => (
              <Paper
                key={exp.id}
                p="sm"
                withBorder
                style={{
                  backgroundColor: selectedIds.has(exp.id) ? '#F5F3FF' : '#FAFAFA',
                  borderLeft: `4px solid ${COLORS[index % COLORS.length]}`,
                }}
              >
                <Group justify="space-between" gap="xs">
                  <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                    <Checkbox
                      checked={selectedIds.has(exp.id)}
                      onChange={() => toggleSelect(exp.id)}
                      size="xs"
                    />
                    <StatusDot hitRate={exp.stats.hitRate} />
                    <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" fw={500} truncate>
                        {exp.name}
                      </Text>
                      <Group gap="xs" wrap="nowrap">
                        <Badge size="xs" variant="light" color="violet">
                          {exp.stats.hitRate}%
                        </Badge>
                        <Badge size="xs" variant="light" color="orange">
                          {exp.stats.avgDistance}m
                        </Badge>
                        <Badge size="xs" variant="light" color="sky">
                          CEP {exp.stats.cEP}m
                        </Badge>
                        <Group gap={4}>
                          <IconWind size={12} color="#0EA5E9" />
                          <Text size="xs" color="dimmed">
                            {exp.windParams.windSpeed}m/s
                          </Text>
                        </Group>
                        <Group gap={4}>
                          <IconTarget size={12} color="#EF4444" />
                          <Text size="xs" color="dimmed">
                            {exp.targetParams.targetDistance}m
                          </Text>
                        </Group>
                      </Group>
                    </Stack>
                  </Group>
                  <Group gap={0}>
                    <Tooltip label="加载此实验">
                      <ActionIcon variant="subtle" onClick={() => loadBatchExperiment(exp.id)} size="sm">
                        <IconFolderOpen size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="删除">
                      <ActionIcon variant="subtle" color="red" onClick={() => deleteBatchExperiment(exp.id)} size="sm">
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>
              </Paper>
            ))}
          </Stack>
        </ScrollArea>

        <SimpleGrid cols={4} spacing="xs">
          <Paper p="xs" withBorder style={{ backgroundColor: '#F0FDF4', textAlign: 'center' }}>
            <Text size="xs" color="dimmed">
              最佳命中率
            </Text>
            <Text fw={700} c="green">
              {Math.max(...batchExperiments.map((e) => e.stats.hitRate))}%
            </Text>
          </Paper>
          <Paper p="xs" withBorder style={{ backgroundColor: '#EFF6FF', textAlign: 'center' }}>
            <Text size="xs" color="dimmed">
              最小射程σ
            </Text>
            <Text fw={700} c="blue">
              {Math.min(...batchExperiments.map((e) => e.stats.stdDistance))}m
            </Text>
          </Paper>
          <Paper p="xs" withBorder style={{ backgroundColor: '#FEF3C7', textAlign: 'center' }}>
            <Text size="xs" color="dimmed">
              最小CEP
            </Text>
            <Text fw={700} c="orange">
              {Math.min(...batchExperiments.map((e) => e.stats.cEP))}m
            </Text>
          </Paper>
          <Paper p="xs" withBorder style={{ backgroundColor: '#E0F2FE', textAlign: 'center' }}>
            <Text size="xs" color="dimmed">
              总发射次数
            </Text>
            <Text fw={700} c="sky">
              {batchExperiments.reduce((sum, e) => sum + e.stats.totalShots, 0)}
            </Text>
          </Paper>
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}
