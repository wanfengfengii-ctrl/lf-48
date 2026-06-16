import { Paper, Stack, Title, Text, Group, Badge, Divider, Box, SimpleGrid, Progress, Button, NumberInput, Modal, Tooltip, ActionIcon } from '@mantine/core';
import {
  IconPackage,
  IconWeight,
  IconTool,
  IconHeartbeat,
  IconBolt,
  IconAlertTriangle,
  IconClock,
  IconPlus,
  IconRefresh,
  IconMoodEmpty,
  IconTarget,
  IconTrendingUp,
  IconMilitaryRank,
} from '@tabler/icons-react';
import { useCatapultStore } from '@/store/catapultStore';
import { useState } from 'react';
import { getLogisticsStatus, estimateSiegeResourceUsage } from '@/lib/logistics';

export default function LogisticsPanel() {
  const {
    logisticsState,
    params,
    environmentParams,
    resupplyLogistics,
    restSoldiers,
    resetLogistics,
    siegeState,
  } = useCatapultStore();

  const [resupplyModalOpen, setResupplyModalOpen] = useState(false);
  const [restModalOpen, setRestModalOpen] = useState(false);
  const [projectileAmount, setProjectileAmount] = useState(20);
  const [counterweightAmount, setCounterweightAmount] = useState(50);
  const [materialsAmount, setMaterialsAmount] = useState(30);
  const [restMinutes, setRestMinutes] = useState(30);

  const status = getLogisticsStatus(logisticsState);

  const statusColorMap: Record<string, string> = {
    full: 'green',
    normal: 'blue',
    low: 'yellow',
    critical: 'red',
    fresh: 'green',
    tired: 'yellow',
    exhausted: 'red',
  };

  const statusLabelMap: Record<string, string> = {
    full: '充足',
    normal: '正常',
    low: '偏低',
    critical: '告急',
    fresh: '精神饱满',
    tired: '疲惫',
    exhausted: '精疲力竭',
  };

  const shotsRemaining = Math.floor(logisticsState.projectileStock);

  const estimatedShots = siegeState.wallCurrentDurability > 0 && siegeState.impactHistory.length > 0
    ? Math.ceil(siegeState.wallCurrentDurability / (siegeState.totalDamageScore / Math.max(1, siegeState.impactHistory.length)))
    : null;

  const resourceEstimate = estimatedShots
    ? estimateSiegeResourceUsage(params, environmentParams, estimatedShots)
    : null;

  const handleResupply = () => {
    resupplyLogistics(projectileAmount, counterweightAmount, materialsAmount);
    setResupplyModalOpen(false);
  };

  const handleRest = () => {
    restSoldiers(restMinutes);
    setRestModalOpen(false);
  };

  const ResourceBar = ({
    icon,
    label,
    current,
    max,
    status,
    color,
  }: {
    icon: React.ReactNode;
    label: string;
    current: number;
    max: number;
    status: string;
    color: string;
  }) => (
    <Box>
      <Group justify="space-between" mb={4}>
        <Group gap="xs" wrap="nowrap">
          {icon}
          <Text size="xs" fw={500}>
            {label}
          </Text>
        </Group>
        <Badge size="xs" variant="light" color={statusColorMap[status] || 'gray'}>
          {statusLabelMap[status] || status}
        </Badge>
      </Group>
      <Progress value={(current / max) * 100} color={color} size="sm" />
      <Text size="xs" c="dimmed" ta="right" mt={2}>
        {Math.round(current)} / {max}
      </Text>
    </Box>
  );

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
                background: 'linear-gradient(135deg, #10B981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconPackage size={20} color="white" />
            </div>
            <div>
              <Title order={4} size="h5">
                后勤补给
              </Title>
              <Text size="xs" c="dimmed">
                弹丸 · 配重 · 维修 · 体力
              </Text>
            </div>
          </Group>
          <Group gap="xs">
            <Tooltip label="重置后勤">
              <ActionIcon variant="subtle" onClick={resetLogistics} size="sm">
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        <Divider />

        <Paper
          p="sm"
          withBorder
          style={{
            backgroundColor: status.overallReadiness > 60 ? '#F0FDF4' : status.overallReadiness > 30 ? '#FEFCE8' : '#FEF2F2',
          }}
        >
          <Group justify="space-between">
            <Group gap="xs" wrap="nowrap">
              <IconMilitaryRank size={18} color={status.overallReadiness > 60 ? '#16A34A' : status.overallReadiness > 30 ? '#CA8A04' : '#DC2626'} />
              <Text size="sm" fw={600}>
                作战准备度
              </Text>
            </Group>
            <Text
              size="lg"
              fw={700}
              c={status.overallReadiness > 60 ? 'green' : status.overallReadiness > 30 ? 'yellow' : 'red'}
            >
              {status.overallReadiness}%
            </Text>
          </Group>
          <Progress
            value={status.overallReadiness}
            color={status.overallReadiness > 60 ? 'green' : status.overallReadiness > 30 ? 'yellow' : 'red'}
            size="md"
            mt="xs"
          />
        </Paper>

        <Stack gap="sm">
          <ResourceBar
            icon={<IconTarget size={14} color="#2563EB" />}
            label="弹丸库存"
            current={logisticsState.projectileStock}
            max={logisticsState.maxProjectileStock}
            status={status.projectileStatus}
            color="blue"
          />
          <ResourceBar
            icon={<IconWeight size={14} color="#9333EA" />}
            label="配重储备"
            current={logisticsState.counterweightStock}
            max={logisticsState.maxCounterweightStock}
            status={status.counterweightStatus}
            color="violet"
          />
          <ResourceBar
            icon={<IconTool size={14} color="#D97706" />}
            label="维修材料"
            current={logisticsState.repairMaterials}
            max={logisticsState.maxRepairMaterials}
            status={status.materialsStatus}
            color="orange"
          />
          <ResourceBar
            icon={<IconHeartbeat size={14} color="#DC2626" />}
            label="士兵体力"
            current={logisticsState.soldierStamina}
            max={logisticsState.maxSoldierStamina}
            status={status.staminaStatus}
            color="red"
          />
        </Stack>

        <SimpleGrid cols={2} spacing="xs">
          <Paper p="xs" withBorder style={{ backgroundColor: '#EFF6FF' }}>
            <Group gap="xs" wrap="nowrap">
              <IconBolt size={16} color="#2563EB" />
              <Stack gap={0}>
                <Text size="xs" c="dimmed">
                  剩余可发射
                </Text>
                <Text fw={700} size="sm">
                  {shotsRemaining} 发
                </Text>
              </Stack>
            </Group>
          </Paper>
          <Paper p="xs" withBorder style={{ backgroundColor: '#FEF3C7' }}>
            <Group gap="xs" wrap="nowrap">
              <IconTrendingUp size={16} color="#D97706" />
              <Stack gap={0}>
                <Text size="xs" c="dimmed">
                  本轮发射
                </Text>
                <Text fw={700} size="sm">
                  {logisticsState.shotsFiredInSession} 发
                </Text>
              </Stack>
            </Group>
          </Paper>
        </SimpleGrid>

        {resourceEstimate && !siegeState.isDestroyed && (
          <Paper p="sm" withBorder style={{ backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }}>
            <Group gap="xs" wrap="nowrap" mb="xs">
              <IconClock size={16} color="#16A34A" />
              <Text size="xs" fw={600}>
                按当前效率预计破城资源
              </Text>
            </Group>
            <SimpleGrid cols={2} spacing="xs">
              <Text size="xs">
                弹丸: <Text fw={600} span>{resourceEstimate.projectilesNeeded} 发</Text>
              </Text>
              <Text size="xs">
                配重: <Text fw={600} span>{resourceEstimate.counterweightNeeded} kg</Text>
              </Text>
              <Text size="xs">
                体力: <Text fw={600} span>{resourceEstimate.totalStaminaNeeded}</Text>
              </Text>
              <Text size="xs">
                时间: <Text fw={600} span>{resourceEstimate.estimatedTimeMinutes} 分</Text>
              </Text>
            </SimpleGrid>
          </Paper>
        )}

        {logisticsState.projectileStock < 10 && (
          <Paper p="xs" withBorder style={{ backgroundColor: '#FEF2F2' }}>
            <Group gap="xs" wrap="nowrap">
              <IconAlertTriangle size={16} color="#DC2626" />
              <Text size="xs" c="red" fw={500}>
                警告：弹丸库存不足！
              </Text>
            </Group>
          </Paper>
        )}

        <Divider />

        <SimpleGrid cols={2} spacing="xs">
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setResupplyModalOpen(true)}
            variant="light"
            color="blue"
            size="sm"
          >
            补充物资
          </Button>
          <Button
            leftSection={<IconMoodEmpty size={16} />}
            onClick={() => setRestModalOpen(true)}
            variant="light"
            color="teal"
            size="sm"
          >
            士兵休整
          </Button>
        </SimpleGrid>

        <SimpleGrid cols={2} spacing="xs">
          <Paper p="xs" withBorder>
            <Text size="xs" c="dimmed">
              累计疲劳
            </Text>
            <Text size="sm" fw={600}>
              {logisticsState.totalFatigueAccumulated.toFixed(1)}
            </Text>
          </Paper>
          <Paper p="xs" withBorder>
            <Text size="xs" c="dimmed">
              维修次数
            </Text>
            <Text size="sm" fw={600}>
              {logisticsState.totalRepairCount} 次
            </Text>
          </Paper>
        </SimpleGrid>
      </Stack>

      <Modal opened={resupplyModalOpen} onClose={() => setResupplyModalOpen(false)} title="补充物资" centered size="sm">
        <Stack gap="md">
          <NumberInput
            label="弹丸数量"
            value={projectileAmount}
            onChange={(v) => typeof v === 'number' && setProjectileAmount(Math.max(0, v))}
            min={0}
            size="sm"
          />
          <NumberInput
            label="配重 (kg)"
            value={counterweightAmount}
            onChange={(v) => typeof v === 'number' && setCounterweightAmount(Math.max(0, v))}
            min={0}
            size="sm"
          />
          <NumberInput
            label="维修材料"
            value={materialsAmount}
            onChange={(v) => typeof v === 'number' && setMaterialsAmount(Math.max(0, v))}
            min={0}
            size="sm"
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setResupplyModalOpen(false)} size="sm">
              取消
            </Button>
            <Button color="blue" onClick={handleResupply} size="sm">
              确认补充
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={restModalOpen} onClose={() => setRestModalOpen(false)} title="士兵休整" centered size="sm">
        <Stack gap="md">
          <NumberInput
            label="休整时间 (分钟)"
            value={restMinutes}
            onChange={(v) => typeof v === 'number' && setRestMinutes(Math.max(0, Math.min(480, v)))}
            min={0}
            max={480}
            step={5}
            size="sm"
          />
          <Text size="xs" c="dimmed">
            预计恢复体力: +{restMinutes * 2} 点
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setRestModalOpen(false)} size="sm">
              取消
            </Button>
            <Button color="teal" onClick={handleRest} size="sm">
              开始休整
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
