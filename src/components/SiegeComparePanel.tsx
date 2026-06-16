import { Paper, Stack, Title, Text, Group, Badge, Divider, Box, SimpleGrid, ActionIcon, Tooltip, Checkbox, Table, ScrollArea } from '@mantine/core';
import {
  IconChartBar,
  IconTrash,
  IconDownload,
  IconRefresh,
  IconShield,
  IconCat,
  IconTarget,
  IconGauge,
  IconFlame,
} from '@tabler/icons-react';
import { useCatapultStore } from '@/store/catapultStore';
import { WALL_MATERIAL_PROPERTIES } from '@/types/catapult';
import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
const COLORS = ['#DC2626', '#F97316', '#EAB308', '#22C55E', '#0EA5E9', '#8B5CF6', '#EC4899', '#14B8A6'];

export default function SiegeComparePanel() {
  const { siegeExperiments, clearSiegeExperiments, deleteSiegeExperiment, loadSiegeExperiment } = useCatapultStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 6 ? [...prev, id] : prev
    );
  };

  const selectedExperiments = useMemo(
    () => siegeExperiments.filter((e) => selectedIds.includes(e.id)),
    [siegeExperiments, selectedIds]
  );

  const durabilityCompareData = useMemo(() => {
    if (selectedExperiments.length === 0) return [];
    const maxLen = Math.max(...selectedExperiments.map((e) => e.durabilityCurve.length));
    const data: { shot: number; [key: string]: number }[] = [];
    for (let i = 0; i < maxLen; i++) {
      const row: { shot: number; [key: string]: number } = { shot: i };
      selectedExperiments.forEach((exp, idx) => {
        const point = exp.durabilityCurve[i];
        if (point) {
          row[`exp${idx}`] = (point.durability / (exp.durabilityCurve[0]?.durability || 1)) * 100;
        }
      });
      data.push(row);
    }
    return data;
  }, [selectedExperiments]);

  const efficiencyBarData = useMemo(() => {
    return selectedExperiments.map((exp, idx) => ({
      name: exp.name.length > 8 ? exp.name.slice(0, 8) + '..' : exp.name,
      资源效费比: exp.resourceEfficiency,
      单发破坏效率: exp.damageEfficiency,
      命中率: Math.round((exp.hitsOnWall / Math.max(1, exp.totalShotsFired)) * 100),
      color: COLORS[idx % COLORS.length],
    }));
  }, [selectedExperiments]);

  const scatterData = useMemo(() => {
    return selectedExperiments.map((exp, idx) => ({
      name: exp.name,
      总资源消耗: exp.resourceConsumption.totalKg,
      总破坏得分: exp.totalDamageScore,
      穿透深度: exp.maxPenetrationDepth * 100,
      color: COLORS[idx % COLORS.length],
    }));
  }, [selectedExperiments]);

  const radarData = useMemo(() => {
    if (selectedExperiments.length === 0) return [];
    const metrics = [
      { key: 'hitRate', label: '命中率', max: 100 },
      { key: 'damageEfficiency', label: '单发效率', scale: 1 },
      { key: 'resourceEfficiency', label: '资源效费', scale: 10 },
      { key: 'penetration', label: '穿透能力', scale: 100 },
      { key: 'breakSpeed', label: '破城速度', scale: 100 },
    ];

    const maxResource = Math.max(...selectedExperiments.map((e) => e.resourceEfficiency));
    const maxDamage = Math.max(...selectedExperiments.map((e) => e.damageEfficiency));
    const maxPen = Math.max(...selectedExperiments.map((e) => e.maxPenetrationDepth));
    const minShots = Math.min(...selectedExperiments.map((e) => e.shotsToDestroy || 999));

    return metrics.map((m) => {
      const row: { subject: string; [key: string]: number | string } = { subject: m.label };
      selectedExperiments.forEach((exp, idx) => {
        let val = 0;
        switch (m.key) {
          case 'hitRate':
            val = (exp.hitsOnWall / Math.max(1, exp.totalShotsFired)) * 100;
            break;
          case 'damageEfficiency':
            val = maxDamage > 0 ? (exp.damageEfficiency / maxDamage) * 100 : 0;
            break;
          case 'resourceEfficiency':
            val = maxResource > 0 ? (exp.resourceEfficiency / maxResource) * 100 : 0;
            break;
          case 'penetration':
            val = maxPen > 0 ? (exp.maxPenetrationDepth / maxPen) * 100 : 0;
            break;
          case 'breakSpeed': {
            const shots = exp.shotsToDestroy || 999;
            val = shots < 999 ? (minShots / shots) * 100 : 0;
            break;
          }
        }
        row[`exp${idx}`] = Math.round(val * 10) / 10;
      });
      return row;
    });
  }, [selectedExperiments]);

  const exportCSV = () => {
    if (selectedExperiments.length === 0) return;
    const headers = [
      '实验名称',
      '城墙材质',
      '城墙厚度',
      '城墙高度',
      '臂长',
      '配重',
      '弹重',
      '发射角度',
      '总发射',
      '命中数',
      '命中率',
      '是否破城',
      '破城所需发数',
      '总破坏得分',
      '最大穿透(m)',
      '单发破坏',
      '资源消耗(kg)',
      '破坏效率',
      '资源效费比',
    ];
    const rows = selectedExperiments.map((e) => [
      e.name,
      WALL_MATERIAL_PROPERTIES[e.wallParams.material].label,
      e.wallParams.thickness,
      e.wallParams.height,
      e.catapultParams.armLength,
      e.catapultParams.counterweight,
      e.catapultParams.projectileWeight,
      e.catapultParams.releaseAngle,
      e.totalShotsFired,
      e.hitsOnWall,
      ((e.hitsOnWall / Math.max(1, e.totalShotsFired)) * 100).toFixed(1) + '%',
      e.wallDestroyed ? '是' : '否',
      e.shotsToDestroy ?? '-',
      e.totalDamageScore,
      e.maxPenetrationDepth,
      e.avgDamagePerShot,
      e.resourceConsumption.totalKg,
      e.damageEfficiency,
      e.resourceEfficiency,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `siege-compare-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
                background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconChartBar size={20} color="white" />
            </div>
            <div>
              <Title order={4} size="h5">
                攻城实验对比
              </Title>
              <Text size="xs" c="dimmed">
                多配置破坏效率 & 资源消耗分析
              </Text>
            </div>
          </Group>
          <Group gap="xs">
            <Tooltip label="导出CSV">
              <ActionIcon variant="subtle" onClick={exportCSV} disabled={selectedExperiments.length === 0} size="sm">
                <IconDownload size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="清空全部">
              <ActionIcon variant="subtle" onClick={clearSiegeExperiments} disabled={siegeExperiments.length === 0} color="red" size="sm">
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        <Divider />

        {siegeExperiments.length === 0 ? (
          <Stack justify="center" align="center" style={{ height: 200 }}>
            <IconChartBar size={48} color="#CBD5E1" />
            <Text color="dimmed" ta="center" size="sm">
              在「破坏评估」面板保存攻城实验
              <br />
              后可在此处多组对比
            </Text>
          </Stack>
        ) : (
          <>
            <Box>
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={500}>
                  选择对比实验（最多6个）
                </Text>
                <Badge size="sm" variant="light" color={selectedExperiments.length > 0 ? 'grape' : 'gray'}>
                  已选 {selectedExperiments.length}/{siegeExperiments.length}
                </Badge>
              </Group>
              <ScrollArea h={140} scrollbars="y" offsetScrollbars type="always">
                <Stack gap="xs">
                  {siegeExperiments.map((exp, idx) => (
                    <Paper
                      key={exp.id}
                      p="xs"
                      withBorder
                      style={{
                        borderColor: selectedIds.includes(exp.id) ? COLORS[idx % COLORS.length] : undefined,
                        borderWidth: selectedIds.includes(exp.id) ? 2 : 1,
                        backgroundColor: selectedIds.includes(exp.id)
                          ? `${COLORS[idx % COLORS.length]}10`
                          : undefined,
                      }}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Checkbox
                          checked={selectedIds.includes(exp.id)}
                          onChange={() => toggleSelected(exp.id)}
                          label={
                            <Group gap="xs" wrap="nowrap">
                              <Badge
                                color={COLORS[idx % COLORS.length].replace('#', '')}
                                size="xs"
                                variant="filled"
                                style={{ minWidth: 18, textAlign: 'center' }}
                              >
                                {idx + 1}
                              </Badge>
                              <Text size="xs" fw={600} lineClamp={1} style={{ maxWidth: 120 }}>
                                {exp.name}
                              </Text>
                            </Group>
                          }
                        />
                        <Group gap="xs" wrap="nowrap">
                          <Tooltip label="加载此实验">
                            <ActionIcon
                              size="xs"
                              variant="subtle"
                              onClick={() => loadSiegeExperiment(exp.id)}
                            >
                              <IconTarget size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="删除">
                            <ActionIcon
                              size="xs"
                              variant="subtle"
                              color="red"
                              onClick={() => {
                                deleteSiegeExperiment(exp.id);
                                setSelectedIds((prev) => prev.filter((x) => x !== exp.id));
                              }}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Group>
                      <SimpleGrid cols={4} spacing={4} mt={6}>
                        <Group gap={4} wrap="nowrap">
                          <IconShield size={12} color="#64748B" />
                          <Text size="xs" color="dimmed">
                            {WALL_MATERIAL_PROPERTIES[exp.wallParams.material].label} {exp.wallParams.thickness}m
                          </Text>
                        </Group>
                        <Group gap={4} wrap="nowrap">
                          <IconCat size={12} color="#EA580C" />
                          <Text size="xs" color="dimmed">
                            {exp.catapultParams.counterweight}kg
                          </Text>
                        </Group>
                        <Group gap={4} wrap="nowrap">
                          <IconFlame size={12} color="#DC2626" />
                          <Text size="xs" color="dimmed">
                            {exp.wallDestroyed ? `✓${exp.shotsToDestroy}发破城` : '未破'}
                          </Text>
                        </Group>
                        <Group gap={4} wrap="nowrap">
                          <IconGauge size={12} color="#2563EB" />
                          <Text size="xs" color="dimmed">
                            效费{exp.resourceEfficiency}
                          </Text>
                        </Group>
                      </SimpleGrid>
                    </Paper>
                  ))}
                </Stack>
              </ScrollArea>
            </Box>

            {selectedExperiments.length > 0 && (
              <>
                <Divider />

                <Box>
                  <Text size="sm" fw={500} mb="xs">
                    耐久衰减对比（相对百分比）
                  </Text>
                  <Box style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={durabilityCompareData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="shot" name="射击数" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                        <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        {selectedExperiments.map((exp, idx) => (
                          <Line
                            key={exp.id}
                            type="monotone"
                            dataKey={`exp${idx}`}
                            name={exp.name.length > 10 ? exp.name.slice(0, 10) : exp.name}
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
                    效率指标对比
                  </Text>
                  <Box style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={efficiencyBarData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="资源效费比" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="单发破坏效率" fill="#F97316" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="命中率" fill="#22C55E" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>

                <Box>
                  <Text size="sm" fw={500} mb="xs">
                    综合能力雷达图
                  </Text>
                  <Box style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} outerRadius="70%">
                        <PolarGrid stroke="#E2E8F0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                        {selectedExperiments.map((exp, idx) => (
                          <Radar
                            key={exp.id}
                            name={exp.name.length > 8 ? exp.name.slice(0, 8) : exp.name}
                            dataKey={`exp${idx}`}
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

                <Box>
                  <Text size="sm" fw={500} mb="xs">
                    资源消耗 vs 破坏得分（气泡大小=穿透深度）
                  </Text>
                  <Box style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis
                          type="number"
                          dataKey="总资源消耗"
                          name="资源消耗"
                          unit="kg"
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis
                          type="number"
                          dataKey="总破坏得分"
                          name="破坏得分"
                          tick={{ fontSize: 10 }}
                        />
                        <ZAxis type="number" dataKey="穿透深度" range={[40, 400]} name="穿透" />
                        <RechartsTooltip
                          contentStyle={{ fontSize: 11, borderRadius: 6 }}
                          formatter={(value: number, name: string) => {
                            if (name === '穿透') return [`${(value / 100).toFixed(2)}m`, name];
                            return [value, name];
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        {selectedExperiments.map((exp, idx) => (
                          <Scatter
                            key={exp.id}
                            name={exp.name.length > 8 ? exp.name.slice(0, 8) : exp.name}
                            data={[scatterData[idx]]}
                            fill={COLORS[idx % COLORS.length]}
                          />
                        ))}
                      </ScatterChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>

                <Divider />

                <ScrollArea h={180} scrollbars="x" offsetScrollbars type="always">
                  <Table withTableBorder striped>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th bg="gray.0">实验</Table.Th>
                        <Table.Th bg="gray.0">城墙</Table.Th>
                        <Table.Th bg="gray.0">配置</Table.Th>
                        <Table.Th bg="gray.0">命中</Table.Th>
                        <Table.Th bg="gray.0">破城</Table.Th>
                        <Table.Th bg="gray.0">总伤害</Table.Th>
                        <Table.Th bg="gray.0">最大穿透</Table.Th>
                        <Table.Th bg="gray.0">单发伤害</Table.Th>
                        <Table.Th bg="gray.0">资源(kg)</Table.Th>
                        <Table.Th bg="gray.0">破坏效率</Table.Th>
                        <Table.Th bg="gray.0">效费比</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {selectedExperiments.map((exp, idx) => (
                        <Table.Tr key={exp.id}>
                          <Table.Td>
                            <Group gap={4} wrap="nowrap">
                              <Badge
                                size="xs"
                                color={COLORS[idx % COLORS.length].replace('#', '')}
                                variant="filled"
                              >
                                {idx + 1}
                              </Badge>
                              <Text size="xs" fw={600} lineClamp={1} style={{ maxWidth: 80 }}>
                                {exp.name}
                              </Text>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs">
                              {WALL_MATERIAL_PROPERTIES[exp.wallParams.material].label}
                              <br />
                              {exp.wallParams.thickness}m×{exp.wallParams.height}m
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs">
                              臂{exp.catapultParams.armLength}m
                              <br />
                              配{exp.catapultParams.counterweight}kg
                              <br />
                              弹{exp.catapultParams.projectileWeight}kg/{exp.catapultParams.releaseAngle}°
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs">
                              {exp.hitsOnWall}/{exp.totalShotsFired}
                              <br />
                              ({((exp.hitsOnWall / Math.max(1, exp.totalShotsFired)) * 100).toFixed(0)}%)
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={exp.wallDestroyed ? 'red' : 'gray'} size="xs" variant="light">
                              {exp.wallDestroyed ? `${exp.shotsToDestroy}发` : '未破'}
                            </Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" fw={600} c="orange">
                              {Math.round(exp.totalDamageScore)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs">{exp.maxPenetrationDepth}m</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs">{exp.avgDamagePerShot}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs">{exp.resourceConsumption.totalKg}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" fw={600}>{exp.damageEfficiency}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" fw={700} c="grape">
                              {exp.resourceEfficiency}
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
