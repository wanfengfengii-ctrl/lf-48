import { useState } from 'react';
import {
  Paper,
  Stack,
  Title,
  Text,
  Group,
  Button,
  ActionIcon,
  Tooltip,
  Divider,
  Box,
  SimpleGrid,
  NumberInput,
  Badge,
  Modal,
  TextInput,
  Progress,
  ScrollArea,
} from '@mantine/core';
import {
  IconPlayerPlay,
  IconDeviceFloppy,
  IconChartHistogram,
  IconTarget,
  IconRuler,
  IconArrowsLeftRight,
  IconSquare,
  IconRefresh,
  IconCircleCheck,
  IconCircleX,
} from '@tabler/icons-react';
import { useCatapultStore } from '@/store/catapultStore';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ZAxis,
  Cell,
} from 'recharts';

export default function BatchExperimentPanel() {
  const {
    currentBatchShots,
    currentBatchStats,
    targetParams,
    isBatchSimulating,
    runBatchSimulation,
    stopBatchSimulation,
    clearCurrentBatch,
    saveBatchExperiment,
  } = useCatapultStore();

  const [shotCount, setShotCount] = useState(100);
  const [randomness, setRandomness] = useState(0.02);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [experimentName, setExperimentName] = useState('');

  const handleRunBatch = () => {
    if (shotCount > 0) {
      runBatchSimulation(shotCount, randomness);
    }
  };

  const handleSave = () => {
    if (experimentName.trim() && currentBatchStats) {
      saveBatchExperiment(experimentName.trim());
      setExperimentName('');
      setSaveModalOpen(false);
    }
  };

  const scatterData = currentBatchShots.map((shot) => ({
    x: shot.distance,
    z: shot.lateralDeviation,
    id: shot.id,
    isHit: shot.isTargetHit,
    deviation: shot.targetDeviation,
  }));

  if (currentBatchShots.length === 0 && !isBatchSimulating) {
    return (
      <Paper p="md" radius="md" withBorder shadow="sm" style={{ height: '100%', minHeight: 400 }}>
        <Stack gap="md">
          <Group justify="space-between">
            <Group gap="xs">
              <IconChartHistogram size={20} color="#8B5CF6" />
              <Title order={4} size="h5">
                批量实验与精度统计
              </Title>
            </Group>
          </Group>

          <Divider />

          <Stack gap="md">
            <Group grow>
              <div>
                <Text size="sm" fw={500} mb="xs">
                  发射次数
                </Text>
                <NumberInput
                  min={1}
                  max={10000}
                  step={10}
                  value={shotCount}
                  onChange={(v) => typeof v === 'number' && setShotCount(v)}
                />
              </div>
              <div>
                <Text size="sm" fw={500} mb="xs">
                  随机扰动 (%)
                </Text>
                <NumberInput
                  min={0}
                  max={50}
                  step={0.5}
                  value={randomness * 100}
                  onChange={(v) => typeof v === 'number' && setRandomness(v / 100)}
                  decimalScale={1}
                />
              </div>
            </Group>

            <Button
              leftSection={<IconPlayerPlay size={18} />}
              onClick={handleRunBatch}
              disabled={isBatchSimulating}
              fullWidth
              color="violet"
              size="md"
            >
              开始批量实验
            </Button>
          </Stack>

          <Divider />

          <Stack justify="center" align="center" style={{ flex: 1 }}>
            <IconChartHistogram size={48} color="#CBD5E1" />
            <Text color="dimmed" ta="center">
              设置发射次数后点击「开始批量实验」
              <br />
              查看命中率、散布图等精度统计
            </Text>
          </Stack>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper p="md" radius="md" withBorder shadow="sm" style={{ height: '100%' }}>
      <Stack gap="md" style={{ height: '100%' }}>
        <Group justify="space-between">
          <Group gap="xs">
            <IconChartHistogram size={20} color="#8B5CF6" />
            <Title order={4} size="h5">
              批量实验与精度统计
            </Title>
            {currentBatchStats && (
              <Badge color="violet" variant="light">
                {currentBatchStats.totalShots} 发
              </Badge>
            )}
          </Group>
          <Group gap="xs">
            <Tooltip label="清空当前批次">
              <ActionIcon variant="subtle" onClick={clearCurrentBatch} size="sm" disabled={isBatchSimulating}>
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="保存实验">
              <ActionIcon
                variant="subtle"
                color="violet"
                onClick={() => setSaveModalOpen(true)}
                size="sm"
                disabled={!currentBatchStats}
              >
                <IconDeviceFloppy size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        <Divider />

        <Group grow>
          <div>
            <Text size="xs" color="dimmed" mb="xs">
              发射次数
            </Text>
            <NumberInput
              size="xs"
              min={1}
              max={10000}
              step={10}
              value={shotCount}
              onChange={(v) => typeof v === 'number' && setShotCount(v)}
              disabled={isBatchSimulating}
            />
          </div>
          <div>
            <Text size="xs" color="dimmed" mb="xs">
              随机扰动 (%)
            </Text>
            <NumberInput
              size="xs"
              min={0}
              max={50}
              step={0.5}
              value={randomness * 100}
              onChange={(v) => typeof v === 'number' && setRandomness(v / 100)}
              decimalScale={1}
              disabled={isBatchSimulating}
            />
          </div>
          <Button
            leftSection={isBatchSimulating ? <IconSquare size={16} /> : <IconPlayerPlay size={16} />}
            onClick={isBatchSimulating ? stopBatchSimulation : handleRunBatch}
            color={isBatchSimulating ? 'red' : 'violet'}
            size="xs"
          >
            {isBatchSimulating ? '停止' : '开始实验'}
          </Button>
        </Group>

        {isBatchSimulating && (
          <Progress value={100} animated size="xs" color="violet" />
        )}

        {currentBatchStats && (
          <>
            <SimpleGrid cols={4} spacing="xs">
              <Paper p="xs" withBorder style={{ backgroundColor: '#F5F3FF', textAlign: 'center' }}>
                <Group justify="center" gap={4}>
                  <IconTarget size={14} color="#7C3AED" />
                  <Text size="xs" color="dimmed">
                    命中率
                  </Text>
                </Group>
                <Text fw={700} size="lg" c="violet">
                  {currentBatchStats.hitRate}%
                </Text>
                <Text size="xs" color="dimmed">
                  {currentBatchStats.hitCount}/{currentBatchStats.totalShots}
                </Text>
              </Paper>

              <Paper p="xs" withBorder style={{ backgroundColor: '#F0FDF4', textAlign: 'center' }}>
                <Group justify="center" gap={4}>
                  <IconRuler size={14} color="#16A34A" />
                  <Text size="xs" color="dimmed">
                    平均射程
                  </Text>
                </Group>
                <Text fw={700} size="lg" c="green">
                  {currentBatchStats.avgDistance}m
                </Text>
                <Text size="xs" color="dimmed">
                  σ={currentBatchStats.stdDistance}m
                </Text>
              </Paper>

              <Paper p="xs" withBorder style={{ backgroundColor: '#E0F2FE', textAlign: 'center' }}>
                <Group justify="center" gap={4}>
                  <IconArrowsLeftRight size={14} color="#0284C7" />
                  <Text size="xs" color="dimmed">
                    平均横偏
                  </Text>
                </Group>
                <Text fw={700} size="lg" c="sky">
                  {currentBatchStats.avgLateralDeviation}m
                </Text>
                <Text size="xs" color="dimmed">
                  σ={currentBatchStats.stdLateralDeviation}m
                </Text>
              </Paper>

              <Paper p="xs" withBorder style={{ backgroundColor: '#FEF3C7', textAlign: 'center' }}>
                <Group justify="center" gap={4}>
                  <IconTarget size={14} color="#D97706" />
                  <Text size="xs" color="dimmed">
                    CEP 圆概率
                  </Text>
                </Group>
                <Text fw={700} size="lg" c="orange">
                  {currentBatchStats.cEP}m
                </Text>
                <Text size="xs" color="dimmed">
                  平均偏差{currentBatchStats.avgTargetDeviation}m
                </Text>
              </Paper>
            </SimpleGrid>

            <Divider />

            <SimpleGrid cols={3} spacing="xs">
              <Box>
                <Text size="xs" color="dimmed">
                  射程范围
                </Text>
                <Text size="sm" fw={600}>
                  {currentBatchStats.minDistance}m ~ {currentBatchStats.maxDistance}m
                </Text>
              </Box>
              <Box>
                <Text size="xs" color="dimmed">
                  横偏范围
                </Text>
                <Text size="sm" fw={600}>
                  {currentBatchStats.minLateralDeviation}m ~ {currentBatchStats.maxLateralDeviation}m
                </Text>
              </Box>
              <Box>
                <Text size="xs" color="dimmed">
                  平均参数
                </Text>
                <Text size="sm" fw={600}>
                  H={currentBatchStats.avgMaxHeight}m · t={currentBatchStats.avgFlightTime}s
                </Text>
              </Box>
            </SimpleGrid>

            <Divider />

            <Box style={{ flex: 1, minHeight: 0 }}>
              <Group justify="space-between" mb="xs">
                <Text size="sm" fw={500}>
                  落点散布图 (俯视图)
                </Text>
                <Group gap="sm">
                  <Group gap={4}>
                    <IconCircleCheck size={12} color="#22C55E" />
                    <Text size="xs" color="dimmed">
                      命中
                    </Text>
                  </Group>
                  <Group gap={4}>
                    <IconCircleX size={12} color="#EF4444" />
                    <Text size="xs" color="dimmed">
                      未命中
                    </Text>
                  </Group>
                </Group>
              </Group>
              <Box style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="射程"
                      unit="m"
                      tick={{ fontSize: 11 }}
                      domain={[
                        Math.min(targetParams.targetDistance - 30, currentBatchStats.minDistance - 10),
                        Math.max(targetParams.targetDistance + 30, currentBatchStats.maxDistance + 10),
                      ]}
                    />
                    <YAxis
                      type="number"
                      dataKey="z"
                      name="横偏"
                      unit="m"
                      tick={{ fontSize: 11 }}
                    />
                    <ZAxis type="number" range={[20, 40]} />
                    <RechartsTooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ fontSize: 12, borderRadius: 6 }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any, name: string, props: any) => {
                        const { payload } = props;
                        if (name === '射程') return [`${Number(value).toFixed(2)} m`, '射程'];
                        if (name === '横偏') return [`${Number(value).toFixed(2)} m`, '横偏'];
                        return [
                          `第${payload.id}发 · ${payload.isHit ? '命中' : '未命中'} · 偏差${payload.deviation}m`,
                          '详情',
                        ];
                      }}
                    />
                    <ReferenceLine
                      x={targetParams.targetDistance}
                      stroke="#EF4444"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{ value: `靶心`, position: 'top', fontSize: 10, fill: '#EF4444' }}
                    />
                    <ReferenceLine
                      y={0}
                      stroke="#64748B"
                      strokeDasharray="2 2"
                    />
                    <Scatter name="落点" data={scatterData} isAnimationActive={false}>
                      {scatterData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isHit ? '#22C55E' : '#EF4444'} fillOpacity={0.6} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </Box>
            </Box>

            <Divider />

            <Box>
              <Text size="sm" fw={500} mb="xs">
                各发详情
              </Text>
              <ScrollArea h={80} type="auto">
                <SimpleGrid cols={10} spacing={4}>
                  {currentBatchShots.slice(0, 100).map((shot) => (
                    <Tooltip key={shot.id} label={`#${shot.id}: ${shot.distance}m / ${shot.lateralDeviation}m / 偏差${shot.targetDeviation}m`}>
                      <Badge
                        size="sm"
                        color={shot.isTargetHit ? 'green' : 'red'}
                        variant="light"
                        style={{ cursor: 'pointer' }}
                      >
                        #{shot.id}
                      </Badge>
                    </Tooltip>
                  ))}
                </SimpleGrid>
              </ScrollArea>
            </Box>
          </>
        )}
      </Stack>

      <Modal
        opened={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="保存批量实验"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="实验名称"
            placeholder="输入实验名称，例如：无风-标准参数"
            value={experimentName}
            onChange={(e) => setExperimentName(e.currentTarget.value)}
          />
          {currentBatchStats && (
            <Paper p="sm" withBorder style={{ backgroundColor: '#FAFAFA' }}>
              <SimpleGrid cols={2} spacing="xs">
                <Box>
                  <Text size="xs" color="dimmed">
                    发射次数
                  </Text>
                  <Text size="sm" fw={600}>
                    {currentBatchStats.totalShots} 发
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" color="dimmed">
                    命中率
                  </Text>
                  <Text size="sm" fw={600}>
                    {currentBatchStats.hitRate}%
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" color="dimmed">
                    平均射程
                  </Text>
                  <Text size="sm" fw={600}>
                    {currentBatchStats.avgDistance} m (σ={currentBatchStats.stdDistance})
                  </Text>
                </Box>
                <Box>
                  <Text size="xs" color="dimmed">
                    CEP
                  </Text>
                  <Text size="sm" fw={600}>
                    {currentBatchStats.cEP} m
                  </Text>
                </Box>
              </SimpleGrid>
            </Paper>
          )}
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setSaveModalOpen(false)}>
              取消
            </Button>
            <Button color="violet" onClick={handleSave} disabled={!experimentName.trim()}>
              保存
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
