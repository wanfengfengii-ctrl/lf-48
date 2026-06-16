import { useRef, useCallback } from 'react';
import { Container, Grid, Title, Text, Group, Paper, Badge, Stack } from '@mantine/core';
import { IconCat, IconWind } from '@tabler/icons-react';
import ControlPanel from '@/components/ControlPanel';
import WindControlPanel from '@/components/WindControlPanel';
import SimulationCanvas from '@/components/SimulationCanvas';
import ResultPanel from '@/components/ResultPanel';
import SchemesPanel from '@/components/SchemesPanel';
import BatchExperimentPanel from '@/components/BatchExperimentPanel';
import ExperimentsPanel from '@/components/ExperimentsPanel';
import { useCatapultStore } from '@/store/catapultStore';
import { CatapultEngine } from '@/lib/catapultEngine';
import { runSimulation } from '@/lib/physics';

export default function Home() {
  const { params, windParams, targetParams, setIsSimulating, setCurrentResult, isSimulating } = useCatapultStore();
  const engineRef = useRef<CatapultEngine | null>(null);
  const paramsSnapshotRef = useRef(params);
  const windSnapshotRef = useRef(windParams);
  const targetSnapshotRef = useRef(targetParams);

  const handleSimulationComplete = useCallback(() => {
    const result = runSimulation(paramsSnapshotRef.current, windSnapshotRef.current, targetSnapshotRef.current);
    setCurrentResult(result);
    setIsSimulating(false);
  }, [setCurrentResult, setIsSimulating]);

  const handleLaunch = useCallback(() => {
    if (!engineRef.current || isSimulating) return;

    paramsSnapshotRef.current = { ...params };
    windSnapshotRef.current = { ...windParams };
    targetSnapshotRef.current = { ...targetParams };
    setIsSimulating(true);
    setCurrentResult(null);
    engineRef.current.launch();
  }, [params, windParams, targetParams, isSimulating, setCurrentResult, setIsSimulating]);

  const handleReset = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
    }
    setCurrentResult(null);
    setIsSimulating(false);
  }, [setCurrentResult, setIsSimulating]);

  return (
    <div style={{ minHeight: '100vh', padding: '20px 0' }}>
      <Container size="xl">
        <Paper p="md" mb="md" radius="md" withBorder>
          <Group justify="space-between" wrap="nowrap">
            <Group gap="md" wrap="nowrap">
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #F97316, #EA580C)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconCat size={28} color="white" />
              </div>
              <div>
                <Title order={2} size="h3" c="orange.7">
                  风场与命中精度实验系统
                </Title>
                <Text size="sm" c="dimmed">
                  古代抛石机模拟器 · 支持风场调节 · 批量发射精度统计 · 多方案对比
                </Text>
              </div>
            </Group>
            <Group gap="sm">
              <Badge size="lg" color="green" variant="light">
                靶区: 80-150m
              </Badge>
              <Badge size="lg" color="sky" variant="light" leftSection={<IconWind size={12} />}>
                {windParams.windSpeed > 0 ? `${windParams.windSpeed}m/s` : '无风'}
              </Badge>
              <Badge size="lg" color="orange" variant="light">
                Matter.js 物理引擎
              </Badge>
            </Group>
          </Group>
        </Paper>

        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 3, lg: 2 }}>
            <Stack gap="md">
              <ControlPanel
                onLaunch={handleLaunch}
                onReset={handleReset}
                disabled={isSimulating}
              />
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 3, lg: 2 }}>
            <WindControlPanel disabled={isSimulating} />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6, lg: 5 }}>
            <SimulationCanvas
              params={params}
              isSimulating={isSimulating}
              onLaunch={handleLaunch}
              onSimulationComplete={handleSimulationComplete}
              engineRef={engineRef}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 12, lg: 3 }}>
            <ResultPanel />
          </Grid.Col>
        </Grid>

        <Grid gutter="md" mt="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <BatchExperimentPanel />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <ExperimentsPanel />
          </Grid.Col>
        </Grid>

        <Grid gutter="md" mt="md">
          <Grid.Col span={12}>
            <SchemesPanel />
          </Grid.Col>
        </Grid>

        <Text size="xs" c="dimmed" ta="center" mt="xl" pb="md">
          抛石机模拟器 · 风场与命中精度实验系统 · 基于 React + TypeScript + Mantine + Matter.js + Recharts 构建
        </Text>
      </Container>
    </div>
  );
}
