import { useEffect, useRef } from 'react';

export default function Hero3DBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Handle high-DPI crisp 1px hairline rendering
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Smooth, damped cursor 3D camera tilt (factor: 0.03)
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      targetMouseY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 3D Tilted Architectural Grid Configuration (~38 degree perspective tilt)
    const basePitch = (38 * Math.PI) / 180; // ~38 degrees architectural tilt
    const camHeight = 250;
    const fov = 480;

    const cols = 44;
    const rows = 34;
    const spacingX = 46;
    const spacingZ = 42;
    const speed = 0.25; // Subtle, dignified laminar glide

    let time = 0;

    const render = () => {
      time += 0.016;

      // Executive weighted damping
      mouseX += (targetMouseX - mouseX) * 0.03;
      mouseY += (targetMouseY - mouseY) * 0.03;

      ctx.clearRect(0, 0, width, height);

      // Subtle diagonal/forward laminar glide
      const glideZ = (time * speed * 50) % spacingZ;
      const glideX = (time * speed * 22) % spacingX;

      const pitch = basePitch + mouseY * 0.04;
      const yaw = mouseX * 0.05;
      const cosPitch = Math.cos(pitch);
      const sinPitch = Math.sin(pitch);
      const cosYaw = Math.cos(yaw);
      const sinYaw = Math.sin(yaw);

      const centerX = width / 2 + mouseX * 24;
      const centerY = height * 0.62 + mouseY * 14;

      // Compute projected 2D coordinates for grid vertices
      const points: ({ x: number; y: number; alpha: number } | null)[][] = [];

      for (let r = 0; r < rows; r++) {
        points[r] = [];
        const depthRatio = r / (rows - 1);

        // Depth fog: fades smoothly into the background towards the horizon
        const nearFade = Math.min(1, r / 2.5);
        const farFog = Math.max(0, Math.pow(1 - depthRatio, 1.25));

        for (let c = 0; c < cols; c++) {
          const lateralRatio = Math.abs(c - cols / 2) / (cols / 2);
          const lateralFade = Math.max(0, 1 - Math.pow(lateralRatio, 2));
          const alpha = nearFade * farFog * lateralFade;

          // Local plane coordinates
          const xGrid = (c - cols / 2) * spacingX - glideX;
          const zGrid = r * spacingZ - glideZ;

          // Yaw rotation around vertical axis
          const xYaw = xGrid * cosYaw - zGrid * sinYaw;
          const zYaw = xGrid * sinYaw + zGrid * cosYaw;

          // Pitch rotation (tilt down ~38 degrees)
          const pz = zYaw + 110;
          const rotatedY = camHeight * cosPitch - pz * sinPitch;
          const rotatedZ = camHeight * sinPitch + pz * cosPitch;

          if (rotatedZ <= 10) {
            points[r][c] = null;
            continue;
          }

          const scale = fov / rotatedZ;
          const px = centerX + xYaw * scale;
          const py = centerY + rotatedY * scale;

          points[r][c] = { x: px, y: py, alpha };
        }
      }

      ctx.lineWidth = 1;

      // 1. Draw transverse lines (warm espresso tones, 0.22 opacity)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const p1 = points[r][c];
          const p2 = points[r][c + 1];
          if (!p1 || !p2) continue;

          const avgAlpha = (p1.alpha + p2.alpha) * 0.5;
          if (avgAlpha <= 0.01) continue;

          // Crisp 1px strokes in warm espresso (rgba(109, 76, 65, 0.22)) with depth fog
          const opacity = 0.22 * avgAlpha;
          ctx.strokeStyle = `rgba(109, 76, 65, ${opacity.toFixed(3)})`;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      // 2. Draw longitudinal perspective lines (muted bronze tones, 0.18 opacity)
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows - 1; r++) {
          const p1 = points[r][c];
          const p2 = points[r + 1][c];
          if (!p1 || !p2) continue;

          const avgAlpha = (p1.alpha + p2.alpha) * 0.5;
          if (avgAlpha <= 0.01) continue;

          // Crisp 1px strokes in muted bronze (rgba(161, 136, 127, 0.18)) with depth fog
          const opacity = 0.18 * avgAlpha;
          ctx.strokeStyle = `rgba(161, 136, 127, ${opacity.toFixed(3)})`;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Subtle depth fog overlay fading smoothly into the warm cream background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, #FAF6F2 0%, rgba(250, 246, 242, 0.4) 18%, transparent 40%, transparent 75%, #FAF6F2 100%)',
        }}
      />
    </div>
  );
}
