import { Paper, Stack, Title, Text, Group, Badge, Divider, Box, SimpleGrid, Button, ScrollArea, Checkbox, Table, ActionIcon, Tooltip, Modal, NumberInput } from '@mantine/core';
import {
  IconSwords,
  IconTrophy,
  IconClock,
  IconTarget,
  IconFlame,
  IconSun,
  IconMoon,
  IconCloud,
  IconWind,
  IconChartBar,
  IconPlayerPlay,
  IconTrash,
  IconDownload,
  IconRefresh,
  IconStar,
  IconGauge,
  IconMilitaryRank,
} from '@tabler/icons-react';
import { useCatapultStore } from '@/store/catapultStore';
import { TACTICAL_PRESETS, TacticalCombo, WEATHER_LABELS, TIME_OF_DAY_LABELS } from '@/types/catapult';
import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

const COLORS = ['#DC2626', '#F97316', '#EAB308', '#22C55E', '#0EA5E9', '#8B5CF6', '#EC4899', '#14B8A6'];

export default function TacticalComparePanel() {
  const {
    tacticalResults,
    wallParams,
    windParams,
    runTacticalSimulation,
    deleteTacticalResult,
    clearTacticalResults,
    loadTacticalCombo,
  } = useCatapultStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [simulating, setSimulating] = useState(false);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 6 ? [...prev, id] : prev
    );
  };

  const selectedResults = useMemo(
    () => tacticalResults.filter((r) => selectedIds.includes(r.id)),
    [tacticalResults, selectedIds]
  );

  const runPresetSimulation = async (combo: TacticalCombo) => {
    setSimulating(true);
    setTimeout(() => {
      runTacticalSimulation(combo);
      setSimulating(false);
    }, 100);
  };

  const runAllPresets = () => {
    setSimulating(true);
    setTimeout(() => {
      TACTICAL_PRESETS.forEach((combo, index) => {
        setTimeout(() => {
          runTacticalSimulation(combo);
          if (index === TACTICAL_PRESETS.length - 1) {
            setSimulating(false);
          }
        }, index * 50);
      });
    }, 100);
  };

  const durabilityCompareData = useMemo(() => {
    if (selectedResults.length === 0) return [];
    const maxLen = Math.max(...selectedResults.map((r) => r.durabilityCurve.length));
    const data: { shot: number; [key: string]: number }[] = [];
    for (let i = 0; i < maxLen; i++) {
      const row: { shot: number; [key: string]: number } = { shot: i };
      selectedResults.forEach((res, idx) => {
        const point = res.durabilityCurve[i];
        if (point) {
          row[`res${idx}`] = (point.durability / (res.durabilityCurve[0]?.durability || 1)) * 100;
        }
      });
      data.push(row);
    }
    return data;
  }, [selectedResults]);

  const barChartData = useMemo(() => {
    return selectedResults.map((res, idx) => ({
      name: res.name.length > 6 ? res.name.slice(0, 6) + '..' : res.name,
      破城速度: res.wallDestroyed ? Math.round(1000 / Math.max(1, res.totalTimeMinutes)) : Math.round((res.durabilityCurve[res.durabilityCurve.length - 1]?.durability ? 1 - res.durabilityCurve[res.durabilityCurve.length - 1].durability / (res.durabilityCurve[0]?.durability || 1) : 0) * 100),
      资源效费: res.costEffectiveness,
      夜战成功率: res.nightSuccessRate,
      color: COLORS[idx % COLORS.length],
    }));
  }, [selectedResults]);

  const radarData = useMemo(() => {
    if (selectedResults.length === 0) return [];
    const metrics = [
      { key: 'breakSpeed', label: '破城速度' },
      { key: 'efficiency', label: '资源效费' },
      { key: 'nightSuccess', label: '夜战成功' },
      { key: 'hitRate', label: '命中率' },
      { key: 'damage', label: '单发伤害' },
    ];

    const maxSpeed = Math.max(...selectedResults.map((r) => r.wallDestroyed ? 1000 / Math.max(1, r.totalTimeMinutes) : 50));
    const maxEff = Math.max(...selectedResults.map((r) => r.costEffectiveness));
    const maxDamage = Math.max(...selectedResults.map((r) => r.avgDamagePerShot));

    return metrics.map((m) => {
      const row: { subject: string; [key: string]: number | string } = { subject: m.label };
      selectedResults.forEach((res, idx) => {
        let val = 0;
        switch (m.key) {
          case 'breakSpeed':
            val = res.wallDestroyed ? (1000 / Math.max(1, res.totalTimeMinutes)) / maxSpeed * 100 : 30;
            break;
          case 'efficiency':
            val = maxEff > 0 ? (res.costEffectiveness / maxEff) * 100 : 0;
            break;
          case 'nightSuccess':
            val = res.nightSuccessRate;
            break;
          case 'hitRate':
            val = res.hitRate;
            break;
          case 'damage':
            val = maxDamage > 0 ? (res.avgDamagePerShot / maxDamage) * 100 : 0;
            break;
        }
        row[`res${idx}`] = Math.round(val * 10) / 10;
      });
      return row;
    });
  }, [selectedResults]);

  const getComboIcon = (combo: TacticalCombo) => {
    if (combo.timeOfDay === 'night') return <IconMoon size={14} color="#6366F1" />;
    if (combo.weather === 'fog') return <IconCloud size={14} color="#9CA3AF" />;
    if (combo.weather === 'rain') return <IconCloud size={14} color="#3B82F6" />;
    return <IconSun size={14} color="#F59E0B" />;
  };

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
                background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconSwords size={20} color="white" />
            </div>
            <div>
              <Title order={4} size="h5">
                战术对比
              </Title>
              <Text size="xs" c="dimmed">
                多战术组合模拟与评估
              </Text>
            </div>
          </Group>
          <Group gap="xs">
            <Tooltip label="运行全部预设">
              <ActionIcon variant="subtle" onClick={runAllPresets} loading={simulating} size="sm" color="red">
                <IconPlayerPlay size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="清空结果">
              <ActionIcon variant="subtle" onClick={clearTacticalResults} disabled={tacticalResults.length === 0} size="sm" color="red">
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        <Divider />

        <Box>
          <Text size="sm" fw={500} mb="xs">
            战术预设
          </Text>
          <ScrollArea h={140} scrollbars="y" offsetScrollbars type="always">
            <Stack gap="xs">
              {TACTICAL_PRESETS.map((combo, idx) => (
                <Paper
                  key={combo.id}
                  p="xs"
                  withBorder
                  style={{
                    backgroundColor: tacticalResults.some((r) => r.combo.id === combo.id)
                      ? `${COLORS[idx % COLORS.length]}10`
                      : undefined,
                    borderColor: tacticalResults.some((r) => r.combo.id === combo.id)
                      ? COLORS[idx % COLORS.length]
                      : undefined,
                  }}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                      <Badge size="xs" color={COLORS[idx % COLORS.length].replace('#', '')} variant="filled">
                        {idx + 1}
                      </Badge>
                      <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                        <Text size="xs" fw={600} lineClamp={1}>
                          {combo.name}
                        </Text>
                        <Group gap={4} wrap="nowrap">
                          {getComboIcon(combo)}
                          <Text size="xs" c="dimmed">
                            {TIME_OF_DAY_LABELS[combo.timeOfDay]} · {WEATHER_LABELS[combo.weather]}
                          </Text>
                        </Group>
                      </Stack>
                    </Group>
                    <Group gap={4}>
                      <Tooltip label="加载配置">
                        <ActionIcon size="xs" variant="subtle" onClick={() => loadTacticalCombo(combo)}>
                          <IconTarget size={14} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="运行模拟">
                        <ActionIcon size="xs" variant="subtle" color="blue" onClick={() => runPresetSimulation(combo)} loading={simulating}>
                          <IconPlayerPlay size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Group>
                  <Text size="xs" c="dimmed" mt={4} lineClamp={1}>
                    {combo.description}
                  </Text>
                </Paper>
              ))}
            </Stack>
          </ScrollArea>
        </Box>

        {tacticalResults.length > 0 && (
          <>
            <Divider />

            <Box>
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={500}>
                  模拟结果（选择对比，最多6个）
                </Text>
                <Badge size="sm" variant="light" color={selectedResults.length > 0 ? 'red' : 'gray'}>
                  已选 {selectedResults.length}/{tacticalResults.length}
                </Badge>
              </Group>
              <ScrollArea h={120} scrollbars="y" offsetScrollbars type="always">
                <Stack gap="xs">
                  {tacticalResults.map((res, idx) => (
                    <Paper
                      key={res.id}
                      p="xs"
                      withBorder
                      style={{
                        borderColor: selectedIds.includes(res.id) ? COLORS[idx % COLORS.length] : undefined,
                        borderWidth: selectedIds.includes(res.id) ? 2 : 1,
                      }}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Checkbox
                          checked={selectedIds.includes(res.id)}
                          onChange={() => toggleSelected(res.id)}
                          size="xs"
                        />
                        <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                          <Group gap={4} wrap="nowrap">
                            <Badge size="xs" color={COLORS[idx % COLORS.length].replace('#', '')} variant="filled">
                              {idx + 1}
                            </Badge>
                            <Text size="xs" fw={600} lineClamp={1}>
                              {res.name}
                            </Text>
                          </Group>
                          <Group gap={4} wrap="nowrap">
                            <Badge size="xs" variant="light" color={res.wallDestroyed ? 'red' : 'blue'}>
                              {res.wallDestroyed ? '已破城' : '未破'}
                            </Badge>
                            <Text size="xs" c="dimmed">
                              {res.totalTimeMinutes}分
                            </Text>
                            <Text size="xs" c="dimmed">
                              综合分:
                              <Text fw={600} span>
                                {res.overallScore}
                              </Text>
                            </Text>
                          </Group>
                        </Stack>
                        <Tooltip label="删除">
                          <ActionIcon size="xs" variant="subtle" color="red" onClick={() => deleteTacticalResult(res.id)}>
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </ScrollArea>
            </Box>

            {selectedResults.length > 0 && (
              <>
                <Divider />

                <Box>
                  <Text size="sm" fw={500} mb="xs">
                    耐久衰减对比
                  </Text>
                  <Box style={{ height: 140 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={durabilityCompareData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="shot" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                        <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        {selectedResults.map((res, idx) => (
                          <Line
                            key={res.id}
                            type="monotone"
                            dataKey={`res${idx}`}
                            name={res.name.length > 8 ? res.name.slice(0, 8) : res.name}
                            stroke={COLORS[idx % COLORS.length]}
                            strokeWidth={2}
                            dot={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>

                <Box>
                  <Text size="sm" fw={500} mb="xs">
                    核心指标对比
                  </Text>
                  <Box style={{ height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="破城速度" fill="#DC2626" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="资源效费" fill="#10B981" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="夜战成功率" fill="#6366F1" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>

                {selectedResults.length > 1 && (
                  <Box>
                    <Text size="sm" fw={500} mb="xs">
                      综合能力雷达图
                    </Text>
                    <Box style={{ height: 200 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData} outerRadius="70%">
                          <PolarGrid stroke="#E2E8F0" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                          {selectedResults.map((res, idx) => (
                            <Radar
                              key={res.id}
                              name={res.name.length > 6 ? res.name.slice(0, 6) : res.name}
                              dataKey={`res${idx}`}
                              stroke={COLORS[idx % COLORS.length]}
                              fill={COLORS[idx % COLORS.length]}
                              fillOpacity={0.15 + idx * 0.05}
                              strokeWidth={2}
                            />
                          ))}
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                )}

                <ScrollArea h={160} scrollbars="x" offsetScrollbars type="always">
                  <Table withTableBorder striped>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th bg="gray.0">战术</Table.Th>
                        <Table.Th bg="gray.0">破城</Table.Th>
                        <Table.Th bg="gray.0">时间</Table.Th>
                        <Table.Th bg="gray.0">命中</Table.Th>
                        <Table.Th bg="gray.0">弹丸</Table.Th>
                        <Table.Th bg="gray.0">体力</Table.Th>
                        <Table.Th bg="gray.0">效费比</Table.Th>
                        <Table.Th bg="gray.0">夜战</Table.Th>
                        <Table.Th bg="gray.0">综合分</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {selectedResults.map((res, idx) => (
                        <Table.Tr key={res.id}>
                          <Table.Td>
                            <Group gap={4} wrap="nowrap">
                              <Badge size="xs" color={COLORS[idx % COLORS.length].replace('#', '')} variant="filled">
                                {idx + 1}
                              </Badge>
                              <Text size="xs" fw={600} lineClamp={1} style={{ maxWidth: 60 }}>
                                {res.name}
                              </Text>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Badge size="xs" variant="light" color={res.wallDestroyed ? 'red' : 'gray'}>
                              {res.wallDestroyed ? `${res.shotsToDestroy}发` : '未破'}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs">{res.totalTimeMinutes}分</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs">{res.hitRate}%</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs">{res.totalProjectilesUsed}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs">{res.soldierFatigue.toFixed(0)}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" fw={600}>
                              {res.costEffectiveness}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs">{res.nightSuccessRate}%</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" fw={700} c="grape">
                              {res.overallScore}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </>
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
}
