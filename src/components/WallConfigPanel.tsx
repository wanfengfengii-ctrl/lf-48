import { Paper, Stack, Title, Text, Group, Slider, NumberInput, Select, Badge, Divider, Tooltip, ActionIcon, SimpleGrid, Progress } from '@mantine/core';
import { IconRotate, IconShield, IconRuler, IconMountain, IconArrowUpRight, IconStack } from '@tabler/icons-react';
import { useCatapultStore } from '@/store/catapultStore';
import { WALL_MATERIAL_PROPERTIES, ARMOR_LAYER_PROPERTIES } from '@/types/catapult';
import { calculateWallMaxDurability } from '@/lib/siegePhysics';

export default function WallConfigPanel() {
  const { wallParams, setWallParams, resetWallParams, siegeState } = useCatapultStore();

  const materialOptions = Object.entries(WALL_MATERIAL_PROPERTIES).map(([value, props]) => ({
    value,
    label: props.label,
  }));

  const armorOptions = Object.entries(ARMOR_LAYER_PROPERTIES).map(([value, props]) => ({
    value,
    label: props.label,
  }));

  const maxDurability = calculateWallMaxDurability(wallParams);
  const durabilityPercent = (siegeState.wallCurrentDurability / maxDurability) * 100;
  const durabilityColor =
    durabilityPercent > 75 ? 'green' : durabilityPercent > 50 ? 'lime' : durabilityPercent > 25 ? 'yellow' : durabilityPercent > 10 ? 'orange' : 'red';

  const currentMaterial = WALL_MATERIAL_PROPERTIES[wallParams.material];
  const currentArmor = ARMOR_LAYER_PROPERTIES[wallParams.armorLayer];

  const validateAndSetThickness = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(num) && num > 0) {
      setWallParams({ thickness: Math.min(num, 15) });
    }
  };

  const validateAndSetHeight = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(num) && num > 0) {
      setWallParams({ height: Math.min(num, 30) });
    }
  };

  const validateAndSetIncline = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(num) && num >= 0 && num <= 30) {
      setWallParams({ inclineAngle: num });
    }
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
                background: `linear-gradient(135deg, ${currentMaterial.color}, ${currentMaterial.color}CC)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconShield size={20} color="white" />
            </div>
            <div>
              <Title order={4} size="h5">
                城防配置
              </Title>
              <Text size="xs" c="dimmed">
                攻城破坏评估系统
              </Text>
            </div>
          </Group>
          <Tooltip label="重置城墙参数">
            <ActionIcon variant="subtle" onClick={resetWallParams} size="sm">
              <IconRotate size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Divider />

        <div>
          <Group justify="space-between" mb="xs">
            <Group gap="xs" wrap="nowrap">
              <IconShield size={16} color={durabilityColor === 'green' ? '#16A34A' : durabilityColor === 'red' ? '#DC2626' : '#CA8A04'} />
              <Text size="sm" fw={500}>
                城墙耐久
              </Text>
            </Group>
            <Text size="sm" fw={700}>
              {Math.round(siegeState.wallCurrentDurability)} / {maxDurability}
            </Text>
          </Group>
          <Progress
            value={durabilityPercent}
            color={durabilityColor}
            size="md"
            radius="sm"
            striped={siegeState.isDestroyed}
            animated={!siegeState.isDestroyed && durabilityPercent < 50}
          />
          {siegeState.isDestroyed && (
            <Badge color="red" size="sm" mt="xs" fullWidth variant="light">
              ⚠ 城墙已被摧毁！
            </Badge>
          )}
        </div>

        <Divider />

        <div>
          <Text size="sm" fw={500} mb="xs">
            城墙材质
          </Text>
          <Select
            data={materialOptions}
            value={wallParams.material}
            onChange={(v) => v && setWallParams({ material: v as typeof wallParams.material })}
            size="sm"
            allowDeselect={false}
            checkIconPosition="right"
          />
          <SimpleGrid cols={2} mt="xs" spacing="xs">
            <Badge color="gray" variant="light" size="sm">
              硬度 {currentMaterial.hardness}/10
            </Badge>
            <Badge color="gray" variant="light" size="sm">
              强度 {currentMaterial.compressiveStrength}MPa
            </Badge>
          </SimpleGrid>
        </div>

        <div>
          <Group gap="xs" wrap="nowrap" mb="xs">
            <IconRuler size={16} color="#64748B" />
            <Text size="sm" fw={500}>
              城墙厚度 (m)
            </Text>
          </Group>
          <Group gap="md">
            <Slider
              style={{ flex: 1 }}
              min={0.5}
              max={15}
              step={0.1}
              value={wallParams.thickness}
              onChange={(v) => setWallParams({ thickness: v })}
              color="blue"
            />
            <NumberInput
              w={80}
              min={0.5}
              max={15}
              step={0.1}
              value={wallParams.thickness}
              onChange={validateAndSetThickness}
              allowNegative={false}
              size="sm"
            />
          </Group>
        </div>

        <div>
          <Group gap="xs" wrap="nowrap" mb="xs">
            <IconMountain size={16} color="#64748B" />
            <Text size="sm" fw={500}>
              城墙高度 (m)
            </Text>
          </Group>
          <Group gap="md">
            <Slider
              style={{ flex: 1 }}
              min={2}
              max={30}
              step={0.5}
              value={wallParams.height}
              onChange={(v) => setWallParams({ height: v })}
              color="blue"
            />
            <NumberInput
              w={80}
              min={2}
              max={30}
              step={0.5}
              value={wallParams.height}
              onChange={validateAndSetHeight}
              allowNegative={false}
              size="sm"
            />
          </Group>
        </div>

        <div>
          <Group gap="xs" wrap="nowrap" mb="xs">
            <IconArrowUpRight size={16} color="#64748B" />
            <Text size="sm" fw={500}>
              墙体倾角 (°)
            </Text>
          </Group>
          <Group gap="md">
            <Slider
              style={{ flex: 1 }}
              min={0}
              max={30}
              step={0.5}
              value={wallParams.inclineAngle}
              onChange={(v) => setWallParams({ inclineAngle: v })}
              color="blue"
            />
            <NumberInput
              w={80}
              min={0}
              max={30}
              step={0.5}
              value={wallParams.inclineAngle}
              onChange={validateAndSetIncline}
              allowNegative={false}
              size="sm"
            />
          </Group>
        </div>

        <Divider />

        <div>
          <Group gap="xs" wrap="nowrap" mb="xs">
            <IconStack size={16} color="#64748B" />
            <Text size="sm" fw={500}>
              防护层
            </Text>
          </Group>
          <Select
            data={armorOptions}
            value={wallParams.armorLayer}
            onChange={(v) => v && setWallParams({ armorLayer: v as typeof wallParams.armorLayer })}
            size="sm"
            allowDeselect={false}
            checkIconPosition="right"
          />
          <SimpleGrid cols={2} mt="xs" spacing="xs">
            <Badge color="cyan" variant="light" size="sm">
              吸能 {currentArmor.energyAbsorption}%
            </Badge>
            <Badge color="cyan" variant="light" size="sm">
              耐久×{currentArmor.durabilityMultiplier}
            </Badge>
          </SimpleGrid>
        </div>

        <Divider />

        <SimpleGrid cols={2} spacing="xs">
          <Paper p="xs" withBorder style={{ backgroundColor: '#F8FAFC' }}>
            <Text size="xs" color="dimmed">
              累计损伤
            </Text>
            <Text fw={700} size="md" c="orange">
              {Math.round(siegeState.totalDamageScore)}
            </Text>
          </Paper>
          <Paper p="xs" withBorder style={{ backgroundColor: '#FEF2F2' }}>
            <Text size="xs" color="dimmed">
              倒塌风险
            </Text>
            <Text fw={700} size="md" c="red">
              {siegeState.collapseProbability.toFixed(1)}%
            </Text>
          </Paper>
          <Paper p="xs" withBorder style={{ backgroundColor: '#FFF7ED' }}>
            <Text size="xs" color="dimmed">
              命中次数
            </Text>
            <Text fw={700} size="md" c="orange.7">
              {siegeState.impactHistory.length}
            </Text>
          </Paper>
          <Paper p="xs" withBorder style={{ backgroundColor: '#F0F9FF' }}>
            <Text size="xs" color="dimmed">
              裂纹数量
            </Text>
            <Text fw={700} size="md" c="sky.7">
              {siegeState.allCracks.length}
            </Text>
          </Paper>
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}
