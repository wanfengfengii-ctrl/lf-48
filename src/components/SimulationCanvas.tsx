import { useEffect, useRef, useCallback } from 'react';
import { Paper, Box, Group, Badge } from '@mantine/core';
import { CatapultEngine } from '@/lib/catapultEngine';
import { CatapultParams, WindParams, WALL_MATERIAL_PROPERTIES } from '@/types/catapult';
import { TARGET_MIN_DISTANCE, TARGET_MAX_DISTANCE } from '@/types/catapult';
import { useCatapultStore } from '@/store/catapultStore';
import { IconShield, IconTarget } from '@tabler/icons-react';

interface SimulationCanvasProps {
  params: CatapultParams;
  windParams: WindParams;
  isSimulating: boolean;
  onLaunch: () => void;
  onSimulationComplete: () => void;
  engineRef: React.MutableRefObject<CatapultEngine | null>;
}

const SCALE = 3;
const PIVOT_X = 120;
const WALL_CENTER_X = 115;

export default function SimulationCanvas({
  params,
  windParams,
  isSimulating,
  onSimulationComplete,
  engineRef,
}: SimulationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const prevParamsRef = useRef(params);
  const prevWindParamsRef = useRef(windParams);
  const { targetParams, wallParams, siegeState, currentImpactResult } = useCatapultStore();
  const wallMaterial = WALL_MATERIAL_PROPERTIES[wallParams.material];

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new CatapultEngine(containerRef.current, params, windParams, {
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
    const windChanged =
      prevWindParamsRef.current.windSpeed !== windParams.windSpeed ||
      prevWindParamsRef.current.windDirection !== windParams.windDirection ||
      prevWindParamsRef.current.dragCoefficient !== windParams.dragCoefficient;

    if (windChanged && engineRef.current) {
      engineRef.current.updateWindParams(windParams);
      prevWindParamsRef.current = windParams;
    }
  }, [windParams, engineRef]);

  const drawWall = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      groundY: number
    ) => {
    const wallX = PIVOT_X + WALL_CENTER_X * SCALE;
    const wallHeightPx = wallParams.height * SCALE;
    const wallThicknessPx = wallParams.thickness * SCALE;
    const wallTopY = groundY - wallHeightPx;
    const inclineRad = (wallParams.inclineAngle * Math.PI) / 180;
    const inclineOffset = wallHeightPx * Math.tan(inclineRad);

    const wallFrontLeft = wallX - wallThicknessPx / 2;
    const wallFrontRight = wallX + wallThicknessPx / 2;
    const wallBackLeft = wallFrontLeft - inclineOffset;
    const wallBackRight = wallFrontRight + inclineOffset;

    // 损伤热区
    siegeState.allHeatZones.forEach((zone) => {
      const zoneCenterX = wallX + zone.centerX * SCALE;
      const zoneCenterY = groundY - zone.centerY * SCALE;
      const zoneRadius = zone.radius * SCALE;
      const gradient = ctx.createRadialGradient(
        zoneCenterX,
        zoneCenterY,
        0,
        zoneCenterX,
        zoneCenterY,
        zoneRadius
      );
      const alpha = Math.min(0.6, zone.intensity * 0.45);
      gradient.addColorStop(0, `rgba(239, 68, 68, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(249, 115, 22, ${alpha * 0.6})`);
      gradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(zoneCenterX, zoneCenterY, zoneRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 城墙主体（梯形）
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(wallFrontLeft, groundY);
    ctx.lineTo(wallFrontRight, groundY);
    ctx.lineTo(wallBackRight, wallTopY);
    ctx.lineTo(wallBackLeft, wallTopY);
    ctx.closePath();

    // 基础材质渐变
    const wallGradient = ctx.createLinearGradient(wallFrontLeft, 0, wallFrontRight, 0);
    const durabilityRatio = siegeState.wallCurrentDurability / siegeState.wallMaxDurability;
    const damagedTint = durabilityRatio < 0.5;
    wallGradient.addColorStop(0, adjustColor(wallMaterial.color, -15));
    wallGradient.addColorStop(0.5, wallMaterial.color);
    wallGradient.addColorStop(1, adjustColor(wallMaterial.color, -20));
    if (damagedTint) {
      ctx.globalAlpha = 0.7 + durabilityRatio * 0.3;
    }
    ctx.fillStyle = wallGradient;
    ctx.fill();
    ctx.globalAlpha = 1;

    // 城墙纹理（砖石缝）
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    const brickH = 18;
    const brickW = 36;
    let y = groundY - brickH;
    let rowOffset = 0;
    while (y > wallTopY) {
      const rowIncline = (groundY - y) * Math.tan(inclineRad);
      const leftEdge = wallFrontLeft - rowIncline;
      const rightEdge = wallFrontRight + rowIncline;
      for (let bx = leftEdge + (rowOffset % brickW); bx < rightEdge; bx += brickW) {
        ctx.strokeRect(bx, y, brickW, brickH);
      }
      y -= brickH;
      rowOffset += brickW / 2;
    }
    ctx.globalAlpha = 1;

    // 损伤效果 - 弹坑
    siegeState.impactHistory.forEach((impact) => {
      const craterX = wallX;
      const craterY = groundY - impact.impactParams.impactHeight * SCALE;
      const craterR = Math.max(4, impact.craterRadius * SCALE * 1.5);
      const craterD = Math.max(2, impact.craterDepth * SCALE);

      const craterGrad = ctx.createRadialGradient(craterX, craterY, 0, craterX, craterY, craterR);
      craterGrad.addColorStop(0, `rgba(0,0,0,${Math.min(0.6, 0.15 + impact.damageScore / 500)})`);
      craterGrad.addColorStop(0.7, `rgba(60,40,20,${Math.min(0.5, 0.1 + impact.damageScore / 600)})`);
      craterGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = craterGrad;
      ctx.beginPath();
      ctx.ellipse(craterX, craterY, craterR, craterD, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // 描边
    ctx.strokeStyle = adjustColor(wallMaterial.color, -40);
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // 防护层
    if (wallParams.armorLayer !== 'none') {
      ctx.save();
      const armorColors: Record<string, string> = {
        hide: '#8B4513',
        wicker: '#D2691E',
        metal_plate: '#71797E',
        earth_berm: '#654321',
      };
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = armorColors[wallParams.armorLayer] || '#8B4513';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(wallFrontLeft + 3, groundY - 2);
      ctx.lineTo(wallFrontRight - 3, groundY - 2);
      ctx.lineTo(wallBackRight - 1, wallTopY + 3);
      ctx.lineTo(wallBackLeft + 1, wallTopY + 3);
      ctx.stroke();
      ctx.restore();
    }

    // 裂纹
    if (siegeState.allCracks.length > 0) {
      ctx.save();
      siegeState.allCracks.forEach((crack, idx) => {
        const cx = wallX + crack.x * SCALE;
        const cy = groundY - crack.y * SCALE;
        const angleRad = (crack.angle * Math.PI) / 180;
        const length = crack.length * SCALE;
        const endX = cx + Math.cos(angleRad) * length;
        const endY = cy - Math.sin(angleRad) * length;

        const ageFactor = Math.max(0.3, 1 - idx / siegeState.allCracks.length * 0.4);
        const widthFactor = Math.max(0.8, crack.width * 150);

        ctx.strokeStyle = `rgba(20, 10, 0, ${0.5 * ageFactor + 0.2})`;
        ctx.lineWidth = widthFactor;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const segments = 3;
        for (let s = 1; s <= segments; s++) {
          const t = s / segments;
          const wobble = (Math.sin(idx * 13.7 + s * 7.3) * 0.15) * length * t;
          const px = cx + (endX - cx) * t + Math.sin(angleRad + Math.PI / 2) * wobble;
          const py = cy + (endY - cy) * t + Math.cos(angleRad + Math.PI / 2) * wobble;
          ctx.lineTo(px, py);
        }
        ctx.stroke();

        if (crack.length > 1) {
          ctx.strokeStyle = `rgba(200, 180, 150, ${0.15 * ageFactor})`;
          ctx.lineWidth = widthFactor * 0.5;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      });
      ctx.restore();
    }

    // 城墙顶部女儿墙/城垛
    const merlonW = 14;
    const merlonH = 10;
    const crenelW = 10;
    ctx.save();
    ctx.fillStyle = adjustColor(wallMaterial.color, -10);
    const topIncline = wallHeightPx * Math.tan(inclineRad);
    const topLeft = wallFrontLeft - topIncline;
    const topRight = wallFrontRight + topIncline;
    let mx = topLeft;
    let drawMerlon = true;
    while (mx < topRight) {
      if (drawMerlon) {
        const mw = Math.min(merlonW, topRight - mx);
        ctx.beginPath();
        const leftTaper = (wallTopY - (wallTopY - merlonH)) * Math.tan(inclineRad);
        ctx.moveTo(mx, wallTopY);
        ctx.lineTo(mx + mw, wallTopY);
        ctx.lineTo(mx + mw - leftTaper * 0.3, wallTopY - merlonH);
        ctx.lineTo(mx + leftTaper * 0.3, wallTopY - merlonH);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = adjustColor(wallMaterial.color, -30);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      mx += drawMerlon ? merlonW : crenelW;
      drawMerlon = !drawMerlon;
    }
    ctx.restore();

    // 当前命中高亮
    if (currentImpactResult && isImpactRecent(currentImpactResult.timestamp)) {
      const hitX = wallX;
      const hitY = groundY - currentImpactResult.impactParams.impactHeight * SCALE;
      const pulse = (Math.sin(Date.now() / 80) + 1) / 2;
      ctx.save();
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.7 + pulse * 0.3})`;
      ctx.lineWidth = 3 + pulse * 2;
      ctx.beginPath();
      ctx.arc(hitX, hitY, 12 + pulse * 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(251, 191, 36, ${0.8 + pulse * 0.2})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const innerR = 18 + pulse * 4;
        const outerR = 30 + pulse * 8;
        ctx.beginPath();
        ctx.moveTo(hitX + Math.cos(a) * innerR, hitY + Math.sin(a) * innerR);
        ctx.lineTo(hitX + Math.cos(a) * outerR, hitY + Math.sin(a) * outerR);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 倒塌效果
    if (siegeState.isDestroyed) {
      ctx.save();
      ctx.globalAlpha = 0.7;
      for (let i = 0; i < 25; i++) {
        const rx = wallX + (Math.random() - 0.5) * (wallThicknessPx + inclineOffset + 30);
        const ry = groundY - Math.random() * wallHeightPx * 0.7;
        const rs = 3 + Math.random() * 10;
        ctx.fillStyle = adjustColor(wallMaterial.color, -10 - Math.random() * 30);
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx + rs * Math.cos(0.5), ry + rs * Math.sin(0.3));
        ctx.lineTo(rx + rs * Math.cos(1.5), ry + rs * Math.sin(1.2));
        ctx.lineTo(rx - rs * 0.4, ry + rs * 0.8);
        ctx.closePath();
        ctx.fill();
      }
      // 尘雾
      const dustGradient = ctx.createRadialGradient(
        wallX,
        groundY - wallHeightPx * 0.2,
        5,
        wallX,
        groundY - wallHeightPx * 0.2,
        wallHeightPx
      );
      dustGradient.addColorStop(0, 'rgba(180, 160, 130, 0.5)');
      dustGradient.addColorStop(1, 'rgba(180, 160, 130, 0)');
      ctx.fillStyle = dustGradient;
      ctx.fillRect(wallX - wallHeightPx, wallTopY - 20, wallHeightPx * 2, wallHeightPx + 40);
      ctx.restore();
    }

    // 标签
    ctx.save();
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${wallMaterial.label} ${wallParams.thickness}m×${wallParams.height}m`,
      wallX,
      wallTopY - 16
    );
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#475569';
    const durPct = Math.round(durabilityRatio * 100);
    ctx.fillText(`耐久 ${durPct}%`, wallX, wallTopY - 2);
    ctx.restore();
  },
    [wallParams, siegeState, currentImpactResult, wallMaterial]
  );

  useEffect(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;

    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const drawOverlay = () => {
      ctx.clearRect(0, 0, overlay.width, overlay.height);

      const engine = engineRef.current;
      if (!engine) {
        animationId = requestAnimationFrame(drawOverlay);
        return;
      }

      const { groundY } = engine.getPivotInfo();

      // 网格距离标尺
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

      // 靶区
      const targetMinX = PIVOT_X + TARGET_MIN_DISTANCE * SCALE;
      const targetMaxX = PIVOT_X + TARGET_MAX_DISTANCE * SCALE;

      ctx.fillStyle = 'rgba(46, 204, 113, 0.08)';
      ctx.fillRect(targetMinX, 0, targetMaxX - targetMinX, groundY);

      ctx.strokeStyle = '#22C55E';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(targetMinX, 0);
      ctx.lineTo(targetMinX, groundY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(targetMaxX, 0);
      ctx.lineTo(targetMaxX, groundY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#22C55E';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('靶区', (targetMinX + targetMaxX) / 2, 16);

      // 画城墙
      drawWall(ctx, groundY);

      // 高度标尺
      for (let h = 0; h <= 100; h += 25) {
        const y = groundY - h * SCALE;
        if (y < 20) break;
        ctx.fillStyle = '#64748B';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${h}m`, PIVOT_X - 8, y + 4);
      }

      // 风矢
      if (windParams.windSpeed > 0) {
        const windDirRad = (windParams.windDirection * Math.PI) / 180;
        const windArrowLen = Math.min(60, 20 + windParams.windSpeed * 3);
        const arrowX = overlay.width - 60;
        const arrowY = 50;

        ctx.strokeStyle = '#0EA5E9';
        ctx.fillStyle = '#0EA5E9';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);

        const endX = arrowX + Math.sin(windDirRad) * windArrowLen;
        const endY = arrowY - Math.cos(windDirRad) * windArrowLen;

        ctx.beginPath();
        ctx.moveTo(
          arrowX - Math.sin(windDirRad) * windArrowLen * 0.3,
          arrowY + Math.cos(windDirRad) * windArrowLen * 0.3
        );
        ctx.lineTo(endX, endY);
        ctx.stroke();

        const headLen = 10;
        const headAngle = Math.PI / 6;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLen * Math.sin(windDirRad - headAngle),
          endY + headLen * Math.cos(windDirRad - headAngle)
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headLen * Math.sin(windDirRad + headAngle),
          endY + headLen * Math.cos(windDirRad + headAngle)
        );
        ctx.stroke();

        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${windParams.windSpeed} m/s`, (arrowX + endX) / 2, (arrowY + endY) / 2 - 8);

        const windLabels = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
        const windDirIndex = Math.round(((windParams.windDirection % 360) / 45)) % 8;
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#64748B';
        ctx.fillText(
          windLabels[windDirIndex] + '风',
          (arrowX + endX) / 2,
          (arrowY + endY) / 2 + 14
        );
      }

      animationId = requestAnimationFrame(drawOverlay);
    };

    animationId = requestAnimationFrame(drawOverlay);
    return () => cancelAnimationFrame(animationId);
  }, [engineRef, windParams, targetParams, drawWall, wallMaterial]);

  return (
    <Paper p="md" radius="md" withBorder shadow="sm" style={{ height: '100%' }}>
      <Group justify="space-between" mb="sm">
        <Group gap="md" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <IconShield size={18} color={wallMaterial.color} />
            <Badge color="gray" variant="light" size="sm">
              城防: {wallMaterial.label} {wallParams.thickness}m×{wallParams.height}m
            </Badge>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <IconTarget size={18} color="#22C55E" />
            <Badge color="green" variant="light" size="sm">
              靶心 {targetParams.targetDistance}m (±{targetParams.targetRadius}m)
            </Badge>
          </Group>
        </Group>
        <Group gap="xs">
          <Badge
            color={
              siegeState.wallCurrentDurability / siegeState.wallMaxDurability > 0.5
                ? 'green'
                : siegeState.wallCurrentDurability / siegeState.wallMaxDurability > 0.2
                ? 'yellow'
                : 'red'
            }
            variant="filled"
            size="sm"
          >
            耐久: {Math.round((siegeState.wallCurrentDurability / siegeState.wallMaxDurability) * 100)}%
          </Badge>
          {siegeState.isDestroyed && (
            <Badge color="red" variant="filled" size="sm">
              ⚠ 已摧毁
            </Badge>
          )}
        </Group>
      </Group>

      <Box
        style={{
          position: 'relative',
          width: '100%',
          height: 500,
          borderRadius: 8,
          overflow: 'hidden',
          background:
            'linear-gradient(to bottom, #E0F2FE 0%, #F0F9FF 50%, #FEF3C7 100%)',
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

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function isImpactRecent(timestamp: number): boolean {
  return Date.now() - timestamp < 3000;
}
