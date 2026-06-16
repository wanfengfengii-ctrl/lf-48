import { Group, Slider, NumberInput, Stack, Title, Text, Button, ActionIcon, Tooltip, Divider, Paper, TextInput, Modal } from '@mantine/core';
import { IconPlayerPlay, IconRefresh, IconDeviceFloppy, IconRotate, IconPlayerPlayFilled } from '@tabler/icons-react';
import { useCatapultStore } from '@/store/catapultStore';
import { useState } from 'react';

interface ControlPanelProps {
  onLaunch: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export default function ControlPanel({ onLaunch, onReset, disabled }: ControlPanelProps) {
  const { params, setParams, resetParams, saveScheme, currentResult, runSingleSimulation, isBatchSimulating } = useCatapultStore();
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [schemeName, setSchemeName] = useState('');

  const validateAndSetArmLength = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(num) && num > 0) {
      setParams({ armLength: Math.min(num, 10) });
    }
  };

  const validateAndSetCounterweight = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(num) && num > 0) {
      setParams({ counterweight: Math.min(num, 500) });
    }
  };

  const validateAndSetProjectileWeight = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(num) && num > 0) {
      setParams({ projectileWeight: Math.min(num, 50) });
    }
  };

  const validateAndSetReleaseAngle = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(num) && num >= 0 && num <= 90) {
      setParams({ releaseAngle: num });
    }
  };

  const handleSave = () => {
    if (schemeName.trim() && currentResult) {
      saveScheme(schemeName.trim());
      setSchemeName('');
      setSaveModalOpen(false);
    }
  };

  const handleQuickSimulate = () => {
    runSingleSimulation();
  };

  return (
    <Paper p="md" radius="md" withBorder shadow="sm" style={{ height: '100%' }}>
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={4} size="h5">
            参数控制
          </Title>
          <Tooltip label="重置为默认值">
            <ActionIcon variant="subtle" onClick={resetParams} size="sm">
              <IconRotate size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Divider />

        <Stack gap="md">
          <div>
            <Text size="sm" fw={500} mb="xs">
              臂长 (m)
            </Text>
            <Group gap="md">
              <Slider
                style={{ flex: 1 }}
                min={0.1}
                max={10}
                step={0.1}
                value={params.armLength}
                onChange={(v) => setParams({ armLength: v })}
                disabled={disabled}
                color="orange"
              />
              <NumberInput
                w={90}
                min={0.1}
                max={10}
                step={0.1}
                value={params.armLength}
                onChange={validateAndSetArmLength}
                disabled={disabled}
                allowNegative={false}
              />
            </Group>
          </div>

          <div>
            <Text size="sm" fw={500} mb="xs">
              配重 (kg)
            </Text>
            <Group gap="md">
              <Slider
                style={{ flex: 1 }}
                min={1}
                max={500}
                step={1}
                value={params.counterweight}
                onChange={(v) => setParams({ counterweight: v })}
                disabled={disabled}
                color="orange"
              />
              <NumberInput
                w={90}
                min={1}
                max={500}
                step={1}
                value={params.counterweight}
                onChange={validateAndSetCounterweight}
                disabled={disabled}
                allowNegative={false}
              />
            </Group>
          </div>

          <div>
            <Text size="sm" fw={500} mb="xs">
              弹丸重量 (kg)
            </Text>
            <Group gap="md">
              <Slider
                style={{ flex: 1 }}
                min={0.5}
                max={50}
                step={0.5}
                value={params.projectileWeight}
                onChange={(v) => setParams({ projectileWeight: v })}
                disabled={disabled}
                color="orange"
              />
              <NumberInput
                w={90}
                min={0.5}
                max={50}
                step={0.5}
                value={params.projectileWeight}
                onChange={validateAndSetProjectileWeight}
                disabled={disabled}
                allowNegative={false}
              />
            </Group>
          </div>

          <div>
            <Text size="sm" fw={500} mb="xs">
              释放角度 (°)
            </Text>
            <Group gap="md">
              <Slider
                style={{ flex: 1 }}
                min={0}
                max={90}
                step={1}
                value={params.releaseAngle}
                onChange={(v) => setParams({ releaseAngle: v })}
                disabled={disabled}
                color="orange"
              />
              <NumberInput
                w={90}
                min={0}
                max={90}
                step={1}
                value={params.releaseAngle}
                onChange={validateAndSetReleaseAngle}
                disabled={disabled}
                allowNegative={false}
              />
            </Group>
          </div>
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Button
            leftSection={<IconPlayerPlay size={18} />}
            onClick={onLaunch}
            disabled={disabled}
            fullWidth
            color="orange"
            size="md"
          >
            发射模拟 (动画)
          </Button>

          <Button
            leftSection={<IconPlayerPlayFilled size={18} />}
            onClick={handleQuickSimulate}
            disabled={isBatchSimulating}
            fullWidth
            variant="light"
            color="orange"
            size="sm"
          >
            快速计算 (无动画)
          </Button>

          <Group grow>
            <Button
              leftSection={<IconRefresh size={16} />}
              onClick={onReset}
              variant="light"
              size="sm"
            >
              重置场景
            </Button>
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={() => setSaveModalOpen(true)}
              variant="light"
              size="sm"
              disabled={!currentResult}
            >
              保存方案
            </Button>
          </Group>
        </Stack>
      </Stack>

      <Modal
        opened={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="保存实验方案"
        centered
      >
        <Stack gap="md">
          <TextInput
            label="方案名称"
            placeholder="输入方案名称"
            value={schemeName}
            onChange={(e) => setSchemeName(e.currentTarget.value)}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setSaveModalOpen(false)}>
              取消
            </Button>
            <Button color="orange" onClick={handleSave} disabled={!schemeName.trim()}>
              保存
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
