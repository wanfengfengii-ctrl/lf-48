import Matter from 'matter-js';
import { CatapultParams, WindParams } from '@/types/catapult';
import { calculateInitialVelocity } from './physics';

const { Engine, Render, Runner, Bodies, Composite, Body, Events } = Matter;

export interface EngineCallbacks {
  onTrajectoryUpdate?: (point: { x: number; y: number }) => void;
  onSimulationComplete?: () => void;
  onProjectileLand?: (x: number) => void;
}

const AIR_DENSITY = 1.225;
const PROJECTILE_RADIUS_M = 0.05;

export class CatapultEngine {
  private engine: Matter.Engine;
  private render: Matter.Render;
  private runner: Matter.Runner;
  private container: HTMLElement;
  private params: CatapultParams;
  private windParams: WindParams;
  private callbacks: EngineCallbacks;

  private projectile: Matter.Body | null = null;
  private arm: Matter.Body | null = null;
  private base: Matter.Body | null = null;

  private scale = 3;
  private groundY = 0;
  private pivotX = 0;
  private pivotY = 0;
  private isLaunched = false;
  private hasLanded = false;
  private trajectoryPoints: { x: number; y: number }[] = [];

  constructor(container: HTMLElement, params: CatapultParams, windParams: WindParams, callbacks: EngineCallbacks = {}) {
    this.container = container;
    this.params = params;
    this.windParams = windParams;
    this.callbacks = callbacks;

    const width = container.clientWidth || 900;
    const height = container.clientHeight || 500;

    this.engine = Engine.create();
    this.engine.gravity.y = 0.8;

    this.render = Render.create({
      element: container,
      engine: this.engine,
      options: {
        width,
        height,
        wireframes: false,
        background: 'transparent',
        pixelRatio: window.devicePixelRatio || 1,
      },
    });

    this.runner = Runner.create();
    this.groundY = height - 40;
    this.pivotX = 120;
    this.pivotY = this.groundY - 80;

    this.setupScene();
  }

  private setupScene() {
    const { width } = this.render.options;

    const ground = Bodies.rectangle(width! / 2, this.groundY + 20, width! + 100, 40, {
      isStatic: true,
      render: { fillStyle: '#8B7355' },
      friction: 0.8,
    });

    const pivot = Bodies.circle(this.pivotX, this.pivotY, 14, {
      isStatic: true,
      render: { fillStyle: '#5D4E37' },
    });

    const baseBody = Bodies.rectangle(this.pivotX, this.groundY - 12, 180, 56, {
      isStatic: true,
      render: { fillStyle: '#6B4423' },
    });

    const wheel1 = Bodies.circle(this.pivotX - 70, this.groundY - 5, 22, {
      isStatic: true,
      render: { fillStyle: '#3E2723' },
    });

    const wheel2 = Bodies.circle(this.pivotX + 70, this.groundY - 5, 22, {
      isStatic: true,
      render: { fillStyle: '#3E2723' },
    });

    const armLengthPx = this.params.armLength * 50;
    const angleRad = (this.params.releaseAngle * Math.PI) / 180;

    this.arm = Bodies.rectangle(
      this.pivotX + Math.cos(angleRad) * armLengthPx * 0.35,
      this.pivotY - Math.sin(angleRad) * armLengthPx * 0.35,
      armLengthPx,
      14,
      {
        isStatic: true,
        render: { fillStyle: '#A0522D' },
        angle: -angleRad,
      }
    );

    const basketX = this.pivotX + Math.cos(angleRad) * armLengthPx;
    const basketY = this.pivotY - Math.sin(angleRad) * armLengthPx;

    const basket = Bodies.rectangle(basketX, basketY + 12, 40, 26, {
      isStatic: true,
      render: { fillStyle: '#8B4513' },
      angle: -angleRad,
    });

    const cwSize = Math.min(55, 22 + this.params.counterweight / 4);
    const cwX = this.pivotX - Math.cos(angleRad) * armLengthPx * 0.25;
    const cwY = this.pivotY + Math.sin(angleRad) * armLengthPx * 0.25 + 30;

    const counterweight = Bodies.rectangle(cwX, cwY, cwSize, cwSize, {
      isStatic: true,
      render: { fillStyle: '#2C3E50' },
    });

    const projectileRadius = Math.max(10, Math.min(26, 7 + this.params.projectileWeight));
    const projX = basketX;
    const projY = basketY - 5;

    this.projectile = Bodies.circle(projX, projY, projectileRadius, {
      isStatic: true,
      render: { fillStyle: '#E74C3C' },
      friction: 0.01,
      frictionAir: 0.008,
      restitution: 0.3,
    });

    const targetMin = 80 * this.scale;
    const targetMax = 150 * this.scale;

    const targetZone = Bodies.rectangle(
      this.pivotX + (targetMin + targetMax) / 2,
      this.groundY - 3,
      targetMax - targetMin,
      6,
      {
        isStatic: true,
        isSensor: true,
        render: { fillStyle: 'rgba(46, 204, 113, 0.6)' },
      }
    );

    Composite.add(this.engine.world, [
      ground,
      pivot,
      baseBody,
      wheel1,
      wheel2,
      this.arm,
      basket,
      counterweight,
      this.projectile,
      targetZone,
    ]);

    this.base = baseBody;

    Events.on(this.engine, 'beforeUpdate', () => {
      if (this.projectile && this.isLaunched && !this.hasLanded) {
        const { windSpeed, windDirection, dragCoefficient } = this.windParams;
        const projectile = this.projectile;

        if (windSpeed > 0 || dragCoefficient > 0) {
          const v = projectile.velocity;
          const windDirRad = (windDirection * Math.PI) / 180;
          const crossSectionalArea = Math.PI * PROJECTILE_RADIUS_M * PROJECTILE_RADIUS_M;

          const windVx = windSpeed * Math.cos(windDirRad);
          const windVy = 0;

          const relVx = (v.x / (this.scale * 0.35)) - windVx;
          const relVy = (v.y / (this.scale * 0.35)) - windVy;
          const relSpeed = Math.sqrt(relVx * relVx + relVy * relVy);

          let dragForce = 0;
          if (relSpeed > 0.001 && dragCoefficient > 0) {
            dragForce = 0.5 * dragCoefficient * AIR_DENSITY * crossSectionalArea * relSpeed * relSpeed;
          }

          const mass = this.params.projectileWeight;
          let ax = -dragForce * relVx / (mass * (relSpeed || 1));
          let ay = -dragForce * relVy / (mass * (relSpeed || 1));

          if (windSpeed > 0) {
            const windForce = 0.5 * Math.max(dragCoefficient, 0.1) * AIR_DENSITY * crossSectionalArea * windSpeed * windSpeed;
            ax += windForce * Math.cos(windDirRad) / mass;
            ay += windForce * Math.sin(windDirRad) / mass * 0.1;
          }

          const dt = 1000 / 60 / 1000;
          Body.setVelocity(projectile, {
            x: v.x + ax * dt * this.scale * 0.35,
            y: v.y + ay * dt * this.scale * 0.35,
          });
        }
      }
    });

    Events.on(this.engine, 'afterUpdate', () => {
      if (this.projectile && this.isLaunched && !this.hasLanded) {
        const pos = this.projectile.position;
        const worldX = (pos.x - this.pivotX) / this.scale;
        const worldY = (this.groundY - pos.y) / this.scale;

        if (worldY >= -1) {
          this.trajectoryPoints.push({ x: worldX, y: Math.max(0, worldY) });
          this.callbacks.onTrajectoryUpdate?.({ x: worldX, y: Math.max(0, worldY) });
        }

        if (pos.y >= this.groundY - 5 || worldX >= 250) {
          this.hasLanded = true;
          const finalX = Math.min(worldX, 250);
          this.callbacks.onProjectileLand?.(finalX);
          this.callbacks.onSimulationComplete?.();
        }
      }
    });
  }

  public start() {
    Render.run(this.render);
    Runner.run(this.runner, this.engine);
  }

  public launch() {
    if (!this.projectile || this.isLaunched) return;

    this.isLaunched = true;
    this.hasLanded = false;
    this.trajectoryPoints = [];

    Body.setStatic(this.projectile, false);

    const v0 = calculateInitialVelocity(this.params);
    const angleRad = (this.params.releaseAngle * Math.PI) / 180;
    const vx = v0 * Math.cos(angleRad) * this.scale * 0.35;
    const vy = -v0 * Math.sin(angleRad) * this.scale * 0.35;

    Body.setVelocity(this.projectile, { x: vx, y: vy });
  }

  public reset() {
    Composite.clear(this.engine.world, false, true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Events.off(this.engine, 'afterUpdate', null as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Events.off(this.engine, 'beforeUpdate', null as any);
    this.isLaunched = false;
    this.hasLanded = false;
    this.trajectoryPoints = [];
    this.setupScene();
  }

  public updateParams(params: CatapultParams) {
    this.params = params;
    this.reset();
  }

  public updateWindParams(windParams: WindParams) {
    this.windParams = windParams;
  }

  public resize(width: number, height: number) {
    this.render.canvas.width = width;
    this.render.canvas.height = height;
    this.render.options.width = width;
    this.render.options.height = height;
  }

  public getScale() {
    return this.scale;
  }

  public getPivotInfo() {
    return { x: this.pivotX, y: this.pivotY, groundY: this.groundY };
  }

  public destroy() {
    Render.stop(this.render);
    Runner.stop(this.runner);
    if (this.render.canvas && this.render.canvas.parentNode) {
      this.render.canvas.parentNode.removeChild(this.render.canvas);
    }
    Composite.clear(this.engine.world, true, true);
    Engine.clear(this.engine);
  }
}
