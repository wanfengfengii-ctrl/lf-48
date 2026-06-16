import { useRef, useCallback } from 'react';
import { Container, Grid, Title, Text, Group, Paper, Badge, Stack, Tabs } from '@mantine/core';
import { IconCat, IconWind, IconShield, IconChartBar } from '@tabler/icons-react';
import ControlPanel from '@/components/ControlPanel';
import WindControlPanel from '@/components/WindControlPanel';
import SimulationCanvas from '@/components/SimulationCanvas';
import ResultPanel from '@/components/ResultPanel';
import SchemesPanel from '@/components/SchemesPanel';
import BatchExperimentPanel from '@/components/BatchExperimentPanel';
import ExperimentsPanel from '@/components/ExperimentsPanel';
import WallConfigPanel from '@/components/WallConfigPanel';
import SiegeResultPanel from '@/components/SiegeResultPanel';
import SiegeComparePanel from '@/components/SiegeComparePanel';
import { useCatapultStore } from '@/store/catapultStore';
import { CatapultEngine } from '@/lib/catapultEngine';
import { runSimulation } from '@/lib/physics';

export default function Home() {
  const {
    params,
    windParams,
    targetParams,
    setIsSimulating,
    setCurrentResult,
    isSimulating,
    processSimulationForSiege,
  } = useCatapultStore();
  const engineRef = useRef<CatapultEngine | null>(null);
  const paramsSnapshotRef = useRef(params);
  const windSnapshotRef = useRef(windParams);
  const targetSnapshotRef = useRef(targetParams);

  const handleSimulationComplete = useCallback(() => {
    const result = runSimulation(
      paramsSnapshotRef.current,
      windSnapshotRef.current,
      targetSnapshotRef.current
    );
    setCurrentResult(result);
    processSimulationForSiege(result);
    setIsSimulating(false);
  }, [setCurrentResult, setIsSimulating, processSimulationForSiege]);

  const handleLaunch = useCallback(() => {
    if (!engineRef.current || isSimulating) return;

    paramsSnapshotRef.current = { ...params };
    windSnapshotRef.current = { ...windParams };
    targetSnapshotRef.current = { ...targetParams };

    // 发射前同步更新 engine 的参数（确保物理引擎使用的参数与破坏计算完全一致）
    engineRef.current.updateParams(params);
    engineRef.current.updateWindParams(windParams);

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
                  古代抛石机模拟器 · 攻城破坏评估系统
                </Title>
                <Text size="sm" c="dimmed">
                  风场调节 · 批量发射精度统计 · 城防破坏评估 · 多方案效率对比
                </Text>
              </div>
            </Group>
            <Group gap="sm">
              <Badge size="lg" color="green" variant="light" leftSection={<IconShield size={12} />}>
                攻城破坏评估 v2.0
              </Badge>
              <Badge
                size="lg"
                color="sky"
                variant="light"
                leftSection={<IconWind size={12} />}
              >
                {windParams.windSpeed > 0 ? `${windParams.windSpeed}m/s` : '无风'}
              </Badge>
              <Badge size="lg" color="orange" variant="light">
                Matter.js 物理引擎
              </Badge>
            </Group>
          </Group>
        </Paper>

        <Tabs defaultValue="precision" variant="pills" radius="md" mb="md">
          <Tabs.List grow>
            <Tabs.Tab value="precision" leftSection={<IconChartBar size={16} />}>
              命中精度实验
            </Tabs.Tab>
            <Tabs.Tab value="siege" leftSection={<IconShield size={16} />}>
              攻城破坏评估
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="precision" pt="md">
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
                  windParams={windParams}
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
          </Tabs.Panel>

          <Tabs.Panel value="siege" pt="md">
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6, lg: 3 }}>
                <Stack gap="md">
                  <WallConfigPanel />
                  <ControlPanel
                    onLaunch={handleLaunch}
                    onReset={handleReset}
                    disabled={isSimulating}
                  />
                </Stack>
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6, lg: 2 }}>
                <WindControlPanel disabled={isSimulating} />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 12, lg: 4 }}>
                <SimulationCanvas
                  params={params}
                  windParams={windParams}
                  isSimulating={isSimulating}
                  onLaunch={handleLaunch}
                  onSimulationComplete={handleSimulationComplete}
                  engineRef={engineRef}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 12, lg: 3 }}>
                <SiegeResultPanel />
              </Grid.Col>
            </Grid>

            <Grid gutter="md" mt="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <BatchExperimentPanel />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <SiegeComparePanel />
              </Grid.Col>
            </Grid>

            <Grid gutter="md" mt="md">
              <Grid.Col span={12}>
                <SchemesPanel />
              </Grid.Col>
            </Grid>
          </Tabs.Panel>
        </Tabs>

        <Text size="xs" c="dimmed" ta="center" mt="xl" pb="md">
          古代抛石机模拟器 · 风场与命中精度实验 · 攻城破坏评估系统 · 基于 React + TypeScript +
          Mantine + Matter.js + Recharts 构建
        </Text>
      </Container>
    </div>
  );
}
