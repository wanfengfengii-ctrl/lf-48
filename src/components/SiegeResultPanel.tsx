import { Paper, Stack, Title, Text, Group, Badge, Divider, Box, SimpleGrid, Button, Modal, TextInput, NumberInput, Tooltip, ActionIcon, Table } from '@mantine/core';
import {
  IconBolt,
  IconTarget,
  IconArrowBarToDown,
  IconAlertTriangle,
  IconChartLine,
  IconDeviceFloppy,
  IconRefresh,
  IconPlayerPlay,
  IconMeteor,
  IconAward,
  IconTrash,
  IconMathFunction,
} from '@tabler/icons-react';
import { useCatapultStore } from '@/store/catapultStore';
import { DamageLevel, WALL_MATERIAL_PROPERTIES } from '@/types/catapult';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from 'recharts';
import { useState } from 'react';

const DAMAGE_LEVEL_INFO: Record<DamageLevel, { label: string; color: string; bgColor: string }> = {
  none: { label: '无损伤', color: '#64748B', bgColor: '#F1F5F9' },
  superficial: { label: '表面损伤', color: '#0EA5E9', bgColor: '#E0F2FE' },
  minor: { label: '轻微损伤', color: '#22C55E', bgColor: '#DCFCE7' },
  moderate: { label: '中度损伤', color: '#EAB308', bgColor: '#FEF9C3' },
  severe: { label: '严重损伤', color: '#F97316', bgColor: '#FFEDD5' },
  critical: { label: '危险损伤', color: '#EF4444', bgColor: '#FEE2E2' },
  destroyed: { label: '完全摧毁', color: '#7F1D1D', bgColor: '#FECACA' },
};

export default function SiegeResultPanel() {
  const {
    siegeState,
    wallParams,
    currentImpactResult,
    bestParamsSuggestion,
    computeBestParams,
    resetSiegeState,
    runSiegeBatch,
    isSiegeSimulating,
    saveSiegeExperiment,
    siegeExperiments,
    deleteSiegeExperiment,
    loadSiegeExperiment,
    activeSiegeExperimentId,
    setActiveSiegeExperiment,
    setParams,
  } = useCatapultStore();

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [batchShots, setBatchShots] = useState(20);
  const [experimentName, setExperimentName] = useState('');

  const materialProps = WALL_MATERIAL_PROPERTIES[wallParams.material];
  const durabilityPercent = (siegeState.wallCurrentDurability / siegeState.wallMaxDurability) * 100;

  const handleRunBatch = () => {
    runSiegeBatch(batchShots);
  };

  const handleSaveExperiment = () => {
    if (experimentName.trim()) {
      saveSiegeExperiment(experimentName.trim());
      setExperimentName('');
      setSaveModalOpen(false);
    }
  };

  const handleApplyBestParams = () => {
    if (bestParamsSuggestion) {
      setParams({
        armLength: bestParamsSuggestion.armLength,
        counterweight: bestParamsSuggestion.counterweight,
        projectileWeight: bestParamsSuggestion.projectileWeight,
        releaseAngle: bestParamsSuggestion.releaseAngle,
      });
    }
  };

  const penetrationChartData = siegeState.impactHistory.map((impact, idx) => ({
    shot: idx + 1,
    penetration: impact.penetrationDepth,
    damage: impact.damageScore,
  }));

  const damageRadarData = [
    { subject: '能量冲击', A: currentImpactResult ? Math.min(100, currentImpactResult.energyOnImpact / 10) : 0 },
    { subject: '穿透深度', A: currentImpactResult ? (currentImpactResult.penetrationDepth / wallParams.thickness) * 100 : 0 },
    { subject: '破坏得分', A: currentImpactResult ? (currentImpactResult.damageScore / siegeState.wallMaxDurability) * 300 : 0 },
    { subject: '倒塌风险', A: siegeState.collapseProbability * 100 },
    { subject: '裂纹扩展', A: Math.min(100, siegeState.allCracks.length) },
    { subject: '累计耐久损失', A: 100 - durabilityPercent },
  ];

  const shotsToEstimate =
    siegeState.totalDamageScore > 0 && siegeState.impactHistory.length > 0
      ? Math.ceil(
          (siegeState.wallMaxDurability / (siegeState.totalDamageScore / siegeState.impactHistory.length))
        )
      : null;

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
              <IconMeteor size={20} color="white" />
            </div>
            <div>
              <Title order={4} size="h5">
                破坏评估
              </Title>
              <Text size="xs" c="dimmed">
                城墙耐久衰减 & 裂纹分析
              </Text>
            </div>
          </Group>
          <Group gap="xs">
            <Tooltip label="计算最佳破城参数">
              <ActionIcon variant="subtle" onClick={computeBestParams} size="sm" color="grape">
                <IconMathFunction size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="重置城墙状态">
              <ActionIcon variant="subtle" onClick={resetSiegeState} size="sm">
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        <Divider />

        {currentImpactResult && (
          <>
            <Group justify="space-between">
              <Group gap="xs" wrap="nowrap">
                <IconBolt size={16} color={DAMAGE_LEVEL_INFO[currentImpactResult.damageLevel].color} />
                <Text size="sm" fw={500}>
                  本次命中评估
                </Text>
              </Group>
              <Badge color={DAMAGE_LEVEL_INFO[currentImpactResult.damageLevel].color.replace('#', '')} size="sm" variant="light">
                {DAMAGE_LEVEL_INFO[currentImpactResult.damageLevel].label}
              </Badge>
            </Group>

            <SimpleGrid cols={3} spacing="xs">
              <Paper p="xs" withBorder style={{ backgroundColor: DAMAGE_LEVEL_INFO[currentImpactResult.damageLevel].bgColor }}>
                <Group gap="xs" wrap="nowrap">
                  <IconBolt size={16} color="#EA580C" />
                  <Stack gap={0}>
                    <Text size="xs" color="dimmed">
                      冲击动能
                    </Text>
                    <Text fw={700} size="sm">
                      {currentImpactResult.energyOnImpact} J
                    </Text>
                  </Stack>
                </Group>
              </Paper>
              <Paper p="xs" withBorder style={{ backgroundColor: '#EFF6FF' }}>
                <Group gap="xs" wrap="nowrap">
                  <IconArrowBarToDown size={16} color="#2563EB" />
                  <Stack gap={0}>
                    <Text size="xs" color="dimmed">
                      穿透深度
                    </Text>
                    <Text fw={700} size="sm">
                      {currentImpactResult.penetrationDepth} m
                    </Text>
                  </Stack>
                </Group>
              </Paper>
              <Paper p="xs" withBorder style={{ backgroundColor: '#FEF3C7' }}>
                <Group gap="xs" wrap="nowrap">
                  <IconTarget size={16} color="#D97706" />
                  <Stack gap={0}>
                    <Text size="xs" color="dimmed">
                      破坏得分
                    </Text>
                    <Text fw={700} size="sm">
                      {currentImpactResult.damageScore}
                    </Text>
                  </Stack>
                </Group>
              </Paper>
            </SimpleGrid>

            <SimpleGrid cols={2} spacing="xs">
              <div>
                <Text size="xs" color="dimmed" mb={4}>
                  命中参数
                </Text>
                <Table withTableBorder>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td bg="gray.0">命中速度</Table.Td>
                      <Table.Td fw={600}>{currentImpactResult.impactParams.impactVelocity} m/s</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td bg="gray.0">命中角度</Table.Td>
                      <Table.Td fw={600}>{currentImpactResult.impactParams.impactAngle}°</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td bg="gray.0">命中高度</Table.Td>
                      <Table.Td fw={600}>{currentImpactResult.impactParams.impactHeight} m</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td bg="gray.0">弹丸质量</Table.Td>
                      <Table.Td fw={600}>{currentImpactResult.impactParams.projectileMass} kg</Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </div>
              <div>
                <Text size="xs" color="dimmed" mb={4}>
                  损伤详情
                </Text>
                <Table withTableBorder>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td bg="gray.0">弹坑半径</Table.Td>
                      <Table.Td fw={600}>{currentImpactResult.craterRadius} m</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td bg="gray.0">弹坑深度</Table.Td>
                      <Table.Td fw={600}>{currentImpactResult.craterDepth} m</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td bg="gray.0">新增裂纹</Table.Td>
                      <Table.Td fw={600}>{currentImpactResult.crackPropagation.length} 条</Table.Td>
                    </Table.Tr>
                    <Table.Tr>
                      <Table.Td bg="gray.0">倒塌风险</Table.Td>
                      <Table.Td fw={600} c="red">{currentImpactResult.collapseRisk}%</Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              </div>
            </SimpleGrid>

            <Divider />
          </>
        )}

        {bestParamsSuggestion && (
          <Paper p="sm" withBorder style={{ backgroundColor: '#FAF5FF', borderColor: '#A78BFA' }}>
            <Group justify="space-between" mb="xs">
              <Group gap="xs" wrap="nowrap">
                <IconAward size={18} color="#7C3AED" />
                <Text size="sm" fw={600} c="grape.7">
                  推荐破城参数
                </Text>
              </Group>
              <Button
                size="xs"
                variant="light"
                color="grape"
                onClick={handleApplyBestParams}
                leftSection={<IconPlayerPlay size={14} />}
              >
                应用
              </Button>
            </Group>
            <SimpleGrid cols={4} spacing="xs">
              <Box>
                <Text size="xs" color="dimmed">臂长</Text>
                <Text fw={600} size="sm">{bestParamsSuggestion.armLength}m</Text>
              </Box>
              <Box>
                <Text size="xs" color="dimmed">配重</Text>
                <Text fw={600} size="sm">{bestParamsSuggestion.counterweight}kg</Text>
              </Box>
              <Box>
                <Text size="xs" color="dimmed">弹重</Text>
                <Text fw={600} size="sm">{bestParamsSuggestion.projectileWeight}kg</Text>
              </Box>
              <Box>
                <Text size="xs" color="dimmed">角度</Text>
                <Text fw={600} size="sm">{bestParamsSuggestion.releaseAngle}°</Text>
              </Box>
            </SimpleGrid>
            <SimpleGrid cols={3} spacing="xs" mt="xs">
              <Badge color="grape" variant="light" size="sm">
                单伤 {bestParamsSuggestion.expectedDamagePerShot}
              </Badge>
              <Badge color="grape" variant="light" size="sm">
                预计 {bestParamsSuggestion.expectedShotsToDestroy} 发破城
              </Badge>
              <Badge color="grape" variant="light" size="sm">
                效费比 {bestParamsSuggestion.resourceEfficiency}
              </Badge>
            </SimpleGrid>
          </Paper>
        )}

        <Group grow>
          <div>
            <Text size="xs" color="dimmed" mb={4}>
              连发轰击（发）
            </Text>
            <NumberInput
              value={batchShots}
              onChange={(v) => typeof v === 'number' && setBatchShots(Math.max(1, Math.min(200, v)))}
              min={1}
              max={200}
              size="sm"
              allowNegative={false}
            />
          </div>
          <Button
            leftSection={<IconPlayerPlay size={16} />}
            onClick={handleRunBatch}
            loading={isSiegeSimulating}
            disabled={siegeState.isDestroyed}
            color="red"
            variant="filled"
            fullWidth
            mt="auto"
            size="md"
          >
            连续轰击
          </Button>
        </Group>

        {shotsToEstimate && !siegeState.isDestroyed && siegeState.impactHistory.length > 0 && (
          <Box p="sm" style={{ backgroundColor: '#FFFBEB', borderRadius: 6, border: '1px solid #FDE68A' }}>
            <Group gap="xs" wrap="nowrap">
              <IconAlertTriangle size={18} color="#D97706" />
              <Text size="sm" fw={500} c="yellow.8">
                按当前效率预计还需 <Text fw={700} c="red">{Math.max(0, shotsToEstimate - siegeState.impactHistory.length)}</Text> 发可破城
              </Text>
            </Group>
          </Box>
        )}

        <Divider />

        <Box>
          <Group gap="xs" wrap="nowrap" mb="xs">
            <IconChartLine size={16} color="#0EA5E9" />
            <Text size="sm" fw={500}>
              耐久衰减曲线
            </Text>
          </Group>
          <Box style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={siegeState.durabilityCurve} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  type="number"
                  dataKey="shot"
                  name="射击次数"
                  tick={{ fontSize: 10 }}
                  domain={[0, 'auto']}
                />
                <YAxis
                  type="number"
                  dataKey="durability"
                  name="耐久度"
                  tick={{ fontSize: 10 }}
                  domain={[0, siegeState.wallMaxDurability]}
                />
                <RechartsTooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{ fontSize: 11, borderRadius: 6 }}
                  formatter={(value: number) => [`${Math.round(value)}`, '耐久度']}
                  labelFormatter={(label) => `第 ${label} 发`}
                />
                <ReferenceLine
                  y={0}
                  stroke="#EF4444"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  label={{ value: '摧毁线', position: 'right', fontSize: 9, fill: '#EF4444' }}
                />
                <Line
                  type="monotone"
                  dataKey="durability"
                  name="耐久度"
                  stroke={durabilityPercent > 50 ? '#22C55E' : durabilityPercent > 25 ? '#F59E0B' : '#EF4444'}
                  strokeWidth={2.5}
                  dot={siegeState.durabilityCurve.length < 30 ? { r: 2 } : false}
                  activeDot={{ r: 5 }}
                  fill={`${durabilityPercent > 50 ? '#22C55E' : durabilityPercent > 25 ? '#F59E0B' : '#EF4444'}22`}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        {penetrationChartData.length > 1 && (
          <Box>
            <Text size="sm" fw={500} mb="xs">
              穿透深度变化
            </Text>
            <Box style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={penetrationChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="shot" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                  <Bar dataKey="penetration" name="穿透深度(m)" radius={[3, 3, 0, 0]}>
                    {penetrationChartData.map((_, index) => {
                      const ratio = penetrationChartData[index].penetration / wallParams.thickness;
                      const color = ratio > 0.5 ? '#EF4444' : ratio > 0.25 ? '#F97316' : '#22C55E';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        )}

        {currentImpactResult && (
          <Box>
            <Text size="sm" fw={500} mb="xs">
              破坏能量雷达图
            </Text>
            <Box style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={damageRadarData} outerRadius="70%">
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar name="破坏指数" dataKey="A" stroke="#DC2626" fill="#DC2626" fillOpacity={0.4} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </RadarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        )}

        <Divider />

        <Group grow>
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={() => setSaveModalOpen(true)}
            disabled={siegeState.impactHistory.length === 0}
            variant="light"
            color="teal"
            size="sm"
          >
            保存实验
          </Button>
        </Group>

        {siegeExperiments.length > 0 && (
          <Box>
            <Text size="sm" fw={500} mb="xs">
              已保存攻城实验 ({siegeExperiments.length})
            </Text>
            <Stack gap="xs" style={{ maxHeight: 180, overflowY: 'auto' }}>
              {siegeExperiments.map((exp) => (
                <Paper
                  key={exp.id}
                  p="xs"
                  withBorder
                  style={{
                    cursor: 'pointer',
                    backgroundColor: activeSiegeExperimentId === exp.id ? '#ECFDF5' : 'white',
                    borderColor: activeSiegeExperimentId === exp.id ? '#10B981' : undefined,
                  }}
                  onClick={() => {
                    setActiveSiegeExperiment(exp.id);
                    loadSiegeExperiment(exp.id);
                  }}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                      <Text size="xs" fw={600} lineClamp={1}>
                        {exp.name}
                      </Text>
                      <Group gap={4} wrap="nowrap">
                        <Badge color={exp.wallDestroyed ? 'red' : 'blue'} size="xs" variant="light">
                          {exp.wallDestroyed ? '已破城' : '未破'}
                        </Badge>
                        <Badge color="gray" size="xs" variant="light">
                          {exp.hitsOnWall}/{exp.totalShotsFired}命中
                        </Badge>
                        <Badge color="orange" size="xs" variant="light">
                          效费比{exp.resourceEfficiency}
                        </Badge>
                      </Group>
                    </Stack>
                    <Tooltip label="删除实验">
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSiegeExperiment(exp.id);
                        }}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>

      <Modal opened={saveModalOpen} onClose={() => setSaveModalOpen(false)} title="保存攻城实验" centered>
        <Stack gap="md">
          <TextInput
            label="实验名称"
            placeholder="输入实验名称，如: 条石墙 vs 200kg配重"
            value={experimentName}
            onChange={(e) => setExperimentName(e.currentTarget.value)}
          />
          <Box p="sm" bg="gray.0" style={{ borderRadius: 6 }}>
            <SimpleGrid cols={2} spacing="xs">
              <Box>
                <Text size="xs" color="dimmed">城墙材质</Text>
                <Text size="sm" fw={600}>{materialProps.label}</Text>
              </Box>
              <Box>
                <Text size="xs" color="dimmed">总发射数</Text>
                <Text size="sm" fw={600}>{siegeState.totalShotsFired} 发</Text>
              </Box>
              <Box>
                <Text size="xs" color="dimmed">命中数</Text>
                <Text size="sm" fw={600}>{siegeState.impactHistory.length} 发</Text>
              </Box>
              <Box>
                <Text size="xs" color="dimmed">是否破城</Text>
                <Text size="sm" fw={600} c={siegeState.isDestroyed ? 'red' : 'green'}>
                  {siegeState.isDestroyed ? '是' : '否'}
                </Text>
              </Box>
            </SimpleGrid>
          </Box>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setSaveModalOpen(false)}>
              取消
            </Button>
            <Button color="teal" onClick={handleSaveExperiment} disabled={!experimentName.trim()}>
              保存
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
