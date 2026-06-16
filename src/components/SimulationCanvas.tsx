import { useEffect, useRef } from 'react';
import { Paper, Box } from '@mantine/core';
import { CatapultEngine } from '@/lib/catapultEngine';
import { CatapultParams } from '@/types/catapult';
import { TARGET_MIN_DISTANCE, TARGET_MAX_DISTANCE } from '@/types/catapult';

interface SimulationCanvasProps {
  params: CatapultParams;
  isSimulating: boolean;
  onLaunch: () => void;
  onSimulationComplete: () => void;
  engineRef: React.MutableRefObject<CatapultEngine | null>;
}

const SCALE = 3;
const PIVOT_X = 120;

export default function SimulationCanvas({
  params,
  isSimulating,
  onSimulationComplete,
  engineRef,
}: SimulationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const prevParamsRef = useRef(params);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new CatapultEngine(containerRef.current, params, {
      onSimulationComplete,
    });
    engine.start();
    engineRef.current = engine;

    const canvas = containerRef.current.querySelector('canvas');
    if (canvas && overlayCanvasRef.current) {
      overlayCanvasRef.current.style.position = 'absolute';
      overlayCanvasRef.current.style.top = canvas.style.top || '0';
      overlayCanvasRef.current.style.left = canvas.style.left || '0';
      overlayCanvasRef.current.width = canvas.width;
      overlayCanvasRef.current.height = canvas.height;
    }

    return () => {
      engine.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const paramsChanged =
      prevParamsRef.current.armLength !== params.armLength ||
      prevParamsRef.current.counterweight !== params.counterweight ||
      prevParamsRef.current.projectileWeight !== params.projectileWeight ||
      prevParamsRef.current.releaseAngle !== params.releaseAngle;

    if (paramsChanged && engineRef.current && !isSimulating) {
      engineRef.current.updateParams(params);
      prevParamsRef.current = params;
    }
  }, [params, isSimulating, engineRef]);

  useEffect(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;

    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    const drawOverlay = () => {
      ctx.clearRect(0, 0, overlay.width, overlay.height);

      const engine = engineRef.current;
      if (!engine) return;

      const { groundY } = engine.getPivotInfo();

      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      for (let i = 0; i <= 250; i += 25) {
        const x = PIVOT_X + i * SCALE;
        if (x > overlay.width) break;
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x, groundY);
        ctx.stroke();

        ctx.fillStyle = '#64748B';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${i}m`, x, groundY + 18);
      }

      ctx.setLineDash([]);

      const targetMinX = PIVOT_X + TARGET_MIN_DISTANCE * SCALE;
      const targetMaxX = PIVOT_X + TARGET_MAX_DISTANCE * SCALE;

      ctx.fillStyle = 'rgba(46, 204, 113, 0.15)';
      ctx.fillRect(targetMinX, 0, targetMaxX - targetMinX, groundY);

      ctx.strokeStyle = '#22C55E';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(targetMinX, 0);
      ctx.lineTo(targetMinX, groundY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(targetMaxX, 0);
      ctx.lineTo(targetMaxX, groundY);
      ctx.stroke();

      ctx.fillStyle = '#22C55E';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('靶区', (targetMinX + targetMaxX) / 2, 18);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${TARGET_MIN_DISTANCE}m`, targetMinX + 4, groundY - 4);
      ctx.fillText(`${TARGET_MAX_DISTANCE}m`, targetMaxX + 4, groundY - 4);

      for (let h = 0; h <= 100; h += 25) {
        const y = groundY - h * SCALE;
        if (y < 20) break;
        ctx.fillStyle = '#64748B';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${h}m`, PIVOT_X - 8, y + 4);
      }
    };

    drawOverlay();
    const interval = setInterval(drawOverlay, 100);
    return () => clearInterval(interval);
  }, [engineRef]);

  return (
    <Paper p="md" radius="md" withBorder shadow="sm" style={{ height: '100%' }}>
      <Box
        style={{
          position: 'relative',
          width: '100%',
          height: 500,
          borderRadius: 8,
          overflow: 'hidden',
          background: 'linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 60%, #FEF3C7 100%)',
        }}
      >
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        <canvas
          ref={overlayCanvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
      </Box>
    </Paper>
  );
}
