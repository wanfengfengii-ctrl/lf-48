import { useRef } from 'react';
import { Container, Grid, Title, Text, Group, Paper, Badge } from '@mantine/core';
import { IconCat } from '@tabler/icons-react';
import ControlPanel from '@/components/ControlPanel';
import SimulationCanvas from '@/components/SimulationCanvas';
import ResultPanel from '@/components/ResultPanel';
import SchemesPanel from '@/components/SchemesPanel';
import { useCatapultStore } from '@/store/catapultStore';
import { CatapultEngine } from '@/lib/catapultEngine';
import { runSimulation } from '@/lib/physics';
import { useCallback } from 'react';

export default function Home() {
  const { params, setIsSimulating, setCurrentResult, isSimulating } = useCatapultStore();
  const engineRef = useRef<CatapultEngine | null>(null);

  const handleLaunch = useCallback(() => {
    if (!engineRef.current || isSimulating) return;

    setIsSimulating(true);
    engineRef.current.launch();

    setTimeout(() => {
      const result = runSimulation(params);
      setCurrentResult(result);
      setIsSimulating(false);
    }, 1500);
  }, [params, isSimulating, setCurrentResult, setIsSimulating]);

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
                  古代抛石机模拟器
                </Title>
                <Text size="sm" c="dimmed">
                  调整参数模拟投射效果 · 保存方案对比射程与稳定性
                </Text>
              </div>
            </Group>
            <Group gap="sm">
              <Badge size="lg" color="green" variant="light">
                靶区: 80-150m
              </Badge>
              <Badge size="lg" color="orange" variant="light">
                Matter.js 物理引擎
              </Badge>
            </Group>
          </Group>
        </Paper>

        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 3, lg: 3 }}>
            <ControlPanel
              onLaunch={handleLaunch}
              onReset={handleReset}
              disabled={isSimulating}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6, lg: 6 }}>
            <SimulationCanvas
              params={params}
              isSimulating={isSimulating}
              onLaunch={handleLaunch}
              onSimulationComplete={() => {}}
              engineRef={engineRef}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 3, lg: 3 }}>
            <ResultPanel />
          </Grid.Col>
        </Grid>

        <Grid gutter="md" mt="md">
          <Grid.Col span={12}>
            <SchemesPanel />
          </Grid.Col>
        </Grid>

        <Text size="xs" c="dimmed" ta="center" mt="xl" pb="md">
          抛石机模拟器 · 基于 React + TypeScript + Mantine + Matter.js + Recharts 构建
        </Text>
      </Container>
    </div>
  );
}
