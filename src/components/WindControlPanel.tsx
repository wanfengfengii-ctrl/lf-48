import { Group, Slider, NumberInput, Stack, Title, Text, ActionIcon, Tooltip, Divider, Paper } from '@mantine/core';
import { IconWind, IconTarget, IconRotate } from '@tabler/icons-react';
import { useCatapultStore } from '@/store/catapultStore';

interface WindControlPanelProps {
  disabled?: boolean;
}

function getWindDirectionLabel(deg: number): string {
  const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  const index = Math.round(((deg % 360) / 45)) % 8;
  return directions[index];
}

export default function WindControlPanel({ disabled }: WindControlPanelProps) {
  const { windParams, targetParams, setWindParams, resetWindParams, setTargetParams, resetTargetParams } = useCatapultStore();

  const validateAndSetWindSpeed = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(num) && num >= 0) {
      setWindParams({ windSpeed: Math.min(num, 50) });
    }
  };

  const validateAndSetWindDirection = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(num)) {
      let normalized = num % 360;
      if (normalized < 0) normalized += 360;
      setWindParams({ windDirection: normalized });
    }
  };

  const validateAndSetDragCoefficient = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(num) && num >= 0) {
      setWindParams({ dragCoefficient: Math.min(num, 2) });
    }
  };

  const validateAndSetTargetDistance = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(num) && num > 0) {
      setTargetParams({ targetDistance: Math.min(Math.max(num, 50), 200) });
    }
  };

  const validateAndSetTargetRadius = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(num) && num > 0) {
      setTargetParams({ targetRadius: Math.min(num, 50) });
    }
  };

  return (
    <Paper p="md" radius="md" withBorder shadow="sm" style={{ height: '100%' }}>
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <IconWind size={20} color="#0EA5E9" />
            <Title order={4} size="h5">
              风场与目标
            </Title>
          </Group>
          <Tooltip label="重置风场与目标">
            <ActionIcon variant="subtle" onClick={() => { resetWindParams(); resetTargetParams(); }} size="sm">
              <IconRotate size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Divider />

        <Stack gap="md">
          <div>
            <Text size="sm" fw={500} mb="xs">
              风速 (m/s)
            </Text>
            <Group gap="md">
              <Slider
                style={{ flex: 1 }}
                min={0}
                max={50}
                step={0.5}
                value={windParams.windSpeed}
                onChange={(v) => setWindParams({ windSpeed: v })}
                disabled={disabled}
                color="sky"
              />
              <NumberInput
                w={90}
                min={0}
                max={50}
                step={0.5}
                value={windParams.windSpeed}
                onChange={validateAndSetWindSpeed}
                disabled={disabled}
                allowNegative={false}
              />
            </Group>
            {windParams.windSpeed > 0 && (
              <Text size="xs" color="dimmed" mt={4}>
              {windParams.windSpeed < 5 ? '微风' :
               windParams.windSpeed < 10 ? '轻风' :
               windParams.windSpeed < 15 ? '和风' :
               windParams.windSpeed < 20 ? '清风' :
               windParams.windSpeed < 25 ? '强风' : '大风以上'}
            </Text>
            )}
          </div>

          <div>
            <Text size="sm" fw={500} mb="xs">
              风向 (°) — {getWindDirectionLabel(windParams.windDirection)}
            </Text>
            <Group gap="md">
              <Slider
                style={{ flex: 1 }}
                min={0}
                max={360}
                step={5}
                value={windParams.windDirection}
                onChange={(v) => setWindParams({ windDirection: v })}
                disabled={disabled}
                color="sky"
              />
              <NumberInput
                w={90}
                min={0}
                max={360}
                step={5}
                value={windParams.windDirection}
                onChange={validateAndSetWindDirection}
                disabled={disabled}
              />
            </Group>
            <Group gap="xs" mt={4} wrap="nowrap">
              <Text size="xs" color="dimmed">
                0°=北, 90°=东, 180°=南, 270°=西
              </Text>
            </Group>
          </div>

          <div>
            <Text size="sm" fw={500} mb="xs">
              空气阻力系数 (Cd)
            </Text>
            <Group gap="md">
              <Slider
                style={{ flex: 1 }}
                min={0}
                max={2}
                step={0.01}
                value={windParams.dragCoefficient}
                onChange={(v) => setWindParams({ dragCoefficient: v })}
                disabled={disabled}
                color="sky"
              />
              <NumberInput
                w={90}
                min={0}
                max={2}
                step={0.01}
                value={windParams.dragCoefficient}
                onChange={validateAndSetDragCoefficient}
                disabled={disabled}
                allowNegative={false}
              />
            </Group>
            <Text size="xs" color="dimmed" mt={4}>
              球体约0.47 · 立方体约1.05 · 流线型约0.04
            </Text>
          </div>
        </Stack>

        <Divider />

        <Group gap="xs" mt="xs">
          <IconTarget size={20} color="#EF4444" />
          <Title order={5} size="h6">
            目标参数
          </Title>
        </Group>

        <div>
          <Text size="sm" fw={500} mb="xs">
            目标距离 (m)
          </Text>
          <Group gap="md">
            <Slider
              style={{ flex: 1 }}
              min={50}
              max={200}
              step={1}
              value={targetParams.targetDistance}
              onChange={(v) => setTargetParams({ targetDistance: v })}
              disabled={disabled}
              color="red"
            />
            <NumberInput
              w={90}
              min={50}
              max={200}
              step={1}
              value={targetParams.targetDistance}
              onChange={validateAndSetTargetDistance}
              disabled={disabled}
              allowNegative={false}
            />
          </Group>
        </div>

        <div>
          <Text size="sm" fw={500} mb="xs">
            目标半径 (m)
          </Text>
          <Group gap="md">
            <Slider
              style={{ flex: 1 }}
              min={1}
              max={50}
              step={0.5}
              value={targetParams.targetRadius}
              onChange={(v) => setTargetParams({ targetRadius: v })}
              disabled={disabled}
              color="red"
            />
            <NumberInput
              w={90}
              min={1}
              max={50}
              step={0.5}
              value={targetParams.targetRadius}
              onChange={validateAndSetTargetRadius}
              disabled={disabled}
              allowNegative={false}
            />
          </Group>
        </div>
      </Stack>
    </Paper>
  );
}
