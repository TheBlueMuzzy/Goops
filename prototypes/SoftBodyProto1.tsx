import { useRef, useEffect, useState, useCallback } from 'react';

// ============================================================================
// PROTO-1: Single Blob Soft Body Physics
// ============================================================================
// Tests: Verlet integration + springs + pressure + Catmull-Rom rendering
// Success: Blob feels "gummy", not bouncy or dead
// ============================================================================

interface Vec2 {
  x: number;
  y: number;
}

interface Vertex {
  pos: Vec2;
  oldPos: Vec2;
  mass: number;
}

interface Spring {
  a: number; // vertex index
  b: number; // vertex index
  restLength: number;
}

interface Blob {
  vertices: Vertex[];
  ringsprings: Spring[];
  crossSprings: Spring[];
  restArea: number;
  centerX: number;
  centerY: number;
  radius: number;
}

// Physics constants (tunable via sliders)
interface PhysicsParams {
  damping: number;      // Verlet damping (velocity retention) - 0.99 default
  gravity: number;      // Gravity strength in pixels/s
  stiffness: number;    // k - Spring stiffness - 100-150 default
  pressure: number;     // Pressure multiplier
  iterations: number;   // Constraint solver iterations
}

// Proto-1 findings: "gummy jello" feel
// - Damping 0.975: slight air resistance, oscillations die naturally
// - Gravity 30: gentle (in game, simulated by piece drop speed)
// - Stiffness 20: soft but holds shape
// - Pressure 2.5: minimal visible effect at this scale
// - Iterations 3+: stable enough without being expensive
const DEFAULT_PARAMS: PhysicsParams = {
  damping: 0.975,
  gravity: 30,
  stiffness: 20,
  pressure: 2.5,
  iterations: 3,
};

const UNIT_SIZE = 40; // Size of each tetromino block

// ============================================================================
// PHYSICS ENGINE
// ============================================================================

function createBlob(centerX: number, centerY: number): Blob {
  const vertices: Vertex[] = [];
  const ringsprings: Spring[] = [];
  const crossSprings: Spring[] = [];

  // T-tetromino shape (centered at centerX, centerY)
  // Shape:  ███
  //          █
  // Using unit size for each block
  const u = UNIT_SIZE;

  // Define perimeter vertices clockwise, starting top-left
  // Adding extra vertices along edges for smoother deformation
  const perimeterPoints: Vec2[] = [
    // Top edge (left to right)
    { x: -1.5 * u, y: -1 * u },   // 0: top-left corner
    { x: -0.5 * u, y: -1 * u },   // 1: top edge mid-left
    { x: 0.5 * u, y: -1 * u },    // 2: top edge mid-right
    { x: 1.5 * u, y: -1 * u },    // 3: top-right corner
    // Right edge of top bar
    { x: 1.5 * u, y: 0 * u },     // 4: right side
    // Inner corner going to stem
    { x: 0.5 * u, y: 0 * u },     // 5: inner top-right
    // Right edge of stem
    { x: 0.5 * u, y: 1 * u },     // 6: stem right
    // Bottom of stem
    { x: -0.5 * u, y: 1 * u },    // 7: stem left
    // Left edge of stem going up
    { x: -0.5 * u, y: 0 * u },    // 8: inner top-left
    // Left edge of top bar
    { x: -1.5 * u, y: 0 * u },    // 9: left side
  ];

  // Create vertices from perimeter points
  for (const pt of perimeterPoints) {
    vertices.push({
      pos: { x: centerX + pt.x, y: centerY + pt.y },
      oldPos: { x: centerX + pt.x, y: centerY + pt.y },
      mass: 1.0,
    });
  }

  const n = vertices.length;

  // Ring springs - connect adjacent vertices around perimeter
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const dx = vertices[next].pos.x - vertices[i].pos.x;
    const dy = vertices[next].pos.y - vertices[i].pos.y;
    const restLength = Math.sqrt(dx * dx + dy * dy);
    ringsprings.push({ a: i, b: next, restLength });
  }

  // Cross springs - connect vertices across the shape for rigidity
  // Connect corners and key structural points
  const crossPairs = [
    [0, 4],  // top-left to right side
    [0, 5],  // top-left to inner right
    [3, 9],  // top-right to left side
    [3, 8],  // top-right to inner left
    [1, 8],  // top mid-left to inner left
    [2, 5],  // top mid-right to inner right
    [5, 8],  // inner corners
    [6, 9],  // stem right to left side
    [7, 4],  // stem left to right side
    [0, 7],  // diagonal across
    [3, 6],  // diagonal across
  ];

  for (const [a, b] of crossPairs) {
    const dx = vertices[b].pos.x - vertices[a].pos.x;
    const dy = vertices[b].pos.y - vertices[a].pos.y;
    const restLength = Math.sqrt(dx * dx + dy * dy);
    crossSprings.push({ a, b, restLength });
  }

  // Calculate rest area using shoelace formula
  const restArea = calculateArea(vertices);

  return {
    vertices,
    ringsprings,
    crossSprings,
    restArea,
    centerX,
    centerY,
    radius: UNIT_SIZE * 1.5, // Approximate radius for reference
  };
}

function calculateArea(vertices: Vertex[]): number {
  let area = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].pos.x * vertices[j].pos.y;
    area -= vertices[j].pos.x * vertices[i].pos.y;
  }
  return Math.abs(area) / 2;
}

function calculateCentroid(vertices: Vertex[]): Vec2 {
  let cx = 0, cy = 0;
  for (const v of vertices) {
    cx += v.pos.x;
    cy += v.pos.y;
  }
  return { x: cx / vertices.length, y: cy / vertices.length };
}

function verletIntegrate(blob: Blob, dt: number, params: PhysicsParams): void {
  for (const v of blob.vertices) {
    const vx = (v.pos.x - v.oldPos.x) * params.damping;
    const vy = (v.pos.y - v.oldPos.y) * params.damping;

    v.oldPos.x = v.pos.x;
    v.oldPos.y = v.pos.y;

    // Verlet: pos += velocity + acceleration * dt
    v.pos.x += vx;
    v.pos.y += vy + params.gravity * dt;
  }
}

function applySpringConstraints(blob: Blob, params: PhysicsParams): void {
  // Position-based dynamics: directly correct positions to satisfy constraints
  // This is much more stable than force-based springs in Verlet
  const stiffness = params.stiffness / 100; // Normalize to 0-1 range for constraint solving

  const allSprings = [...blob.ringsprings, ...blob.crossSprings];

  for (const spring of allSprings) {
    const a = blob.vertices[spring.a];
    const b = blob.vertices[spring.b];

    const dx = b.pos.x - a.pos.x;
    const dy = b.pos.y - a.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.0001) continue;

    // How much the spring is stretched/compressed
    const error = dist - spring.restLength;

    // Correction vector (normalized direction * error * stiffness)
    const correction = (error / dist) * stiffness * 0.5;
    const cx = dx * correction;
    const cy = dy * correction;

    // Move vertices toward each other (or apart)
    a.pos.x += cx;
    a.pos.y += cy;
    b.pos.x -= cx;
    b.pos.y -= cy;
  }
}

function applyPressure(blob: Blob, params: PhysicsParams): void {
  const currentArea = calculateArea(blob.vertices);
  if (currentArea < 1) return;

  // Pressure force: push outward when compressed, pull inward when expanded
  // Using a gentler approach: small correction toward rest area
  const areaRatio = blob.restArea / currentArea;
  const centroid = calculateCentroid(blob.vertices);

  // Only apply pressure if significantly different from rest
  if (Math.abs(areaRatio - 1) < 0.001) return;

  for (const v of blob.vertices) {
    const dx = v.pos.x - centroid.x;
    const dy = v.pos.y - centroid.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 0.0001) continue;

    // Gentle pressure correction (clamped to prevent explosion)
    const pressureStrength = Math.max(-0.5, Math.min(0.5, (areaRatio - 1) * params.pressure * 0.1));
    v.pos.x += (dx / dist) * pressureStrength;
    v.pos.y += (dy / dist) * pressureStrength;
  }
}

function applyBoundaryConstraints(blob: Blob, width: number, height: number): void {
  const margin = 10;
  const bounce = 0.5;

  for (const v of blob.vertices) {
    if (v.pos.y > height - margin) {
      v.pos.y = height - margin;
      v.oldPos.y = v.pos.y + (v.pos.y - v.oldPos.y) * bounce;
    }
    if (v.pos.y < margin) {
      v.pos.y = margin;
      v.oldPos.y = v.pos.y + (v.pos.y - v.oldPos.y) * bounce;
    }
    if (v.pos.x < margin) {
      v.pos.x = margin;
      v.oldPos.x = v.pos.x + (v.pos.x - v.oldPos.x) * bounce;
    }
    if (v.pos.x > width - margin) {
      v.pos.x = width - margin;
      v.oldPos.x = v.pos.x + (v.pos.x - v.oldPos.x) * bounce;
    }
  }
}

// ============================================================================
// CATMULL-ROM TO BEZIER RENDERING
// ============================================================================

function catmullRomToBezier(
  p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2
): { cp1: Vec2; cp2: Vec2 } {
  return {
    cp1: {
      x: p1.x + (p2.x - p0.x) / 6,
      y: p1.y + (p2.y - p0.y) / 6,
    },
    cp2: {
      x: p2.x - (p3.x - p1.x) / 6,
      y: p2.y - (p3.y - p1.y) / 6,
    },
  };
}

function renderBlob(
  ctx: CanvasRenderingContext2D,
  blob: Blob,
  showDebug: boolean
): void {
  const { vertices } = blob;
  const n = vertices.length;

  // Draw smooth membrane using Catmull-Rom splines
  ctx.beginPath();

  // Move to first point
  const first = vertices[0].pos;
  ctx.moveTo(first.x, first.y);

  // Draw bezier curves for each segment
  for (let i = 0; i < n; i++) {
    const p0 = vertices[(i - 1 + n) % n].pos;
    const p1 = vertices[i].pos;
    const p2 = vertices[(i + 1) % n].pos;
    const p3 = vertices[(i + 2) % n].pos;

    const { cp1, cp2 } = catmullRomToBezier(p0, p1, p2, p3);
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
  }

  ctx.closePath();

  // Fill with gradient
  const centroid = calculateCentroid(vertices);
  const gradient = ctx.createRadialGradient(
    centroid.x - 20, centroid.y - 20, 0,
    centroid.x, centroid.y, 100
  );
  gradient.addColorStop(0, '#6fcf97');
  gradient.addColorStop(1, '#27ae60');
  ctx.fillStyle = gradient;
  ctx.fill();

  // Stroke outline
  ctx.strokeStyle = '#1e8449';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Debug visualization
  if (showDebug) {
    // Draw vertices
    for (let i = 0; i < n; i++) {
      const v = vertices[i];
      ctx.beginPath();
      ctx.arc(v.pos.x, v.pos.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#e74c3c';
      ctx.fill();

      // Vertex index
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText(String(i), v.pos.x - 3, v.pos.y + 3);
    }

    // Draw ring springs
    ctx.strokeStyle = 'rgba(52, 152, 219, 0.5)';
    ctx.lineWidth = 1;
    for (const s of blob.ringsprings) {
      ctx.beginPath();
      ctx.moveTo(vertices[s.a].pos.x, vertices[s.a].pos.y);
      ctx.lineTo(vertices[s.b].pos.x, vertices[s.b].pos.y);
      ctx.stroke();
    }

    // Draw cross springs
    ctx.strokeStyle = 'rgba(155, 89, 182, 0.3)';
    for (const s of blob.crossSprings) {
      ctx.beginPath();
      ctx.moveTo(vertices[s.a].pos.x, vertices[s.a].pos.y);
      ctx.lineTo(vertices[s.b].pos.x, vertices[s.b].pos.y);
      ctx.stroke();
    }

    // Draw centroid
    ctx.beginPath();
    ctx.arc(centroid.x, centroid.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#f39c12';
    ctx.fill();
  }
}

// ============================================================================
// REACT COMPONENT
// ============================================================================

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 400;

export function SoftBodyProto1() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Initialize blob immediately with known canvas dimensions
  const blobRef = useRef<Blob>(createBlob(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3));
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(-1); // -1 means "first frame, skip physics"
  const dragRef = useRef<{ active: boolean; vertexIndex: number }>({
    active: false,
    vertexIndex: -1,
  });

  const [params, setParams] = useState<PhysicsParams>(DEFAULT_PARAMS);
  const [showDebug, setShowDebug] = useState(true);
  const [fps, setFps] = useState(0);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;
    let lastFpsTime = performance.now();

    const animate = (time: number) => {
      // FPS counter
      frameCount++;
      if (time - lastFpsTime > 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastFpsTime = time;
      }

      const blob = blobRef.current;

      // Skip physics on first frame to avoid explosion from bad dt
      if (lastTimeRef.current >= 0) {
        const dt = Math.min((time - lastTimeRef.current) / 1000, 0.033); // Cap at 30fps equivalent

        // Physics step
        verletIntegrate(blob, dt, params);

        // Constraint solving iterations
        for (let i = 0; i < params.iterations; i++) {
          applySpringConstraints(blob, params);
          applyPressure(blob, params);
        }

        applyBoundaryConstraints(blob, canvas.width, canvas.height);
      }
      lastTimeRef.current = time;

      // Handle drag
      if (dragRef.current.active && dragRef.current.vertexIndex >= 0) {
        // Vertex is held in place by mouse - handled in mouse move
      }

      // Render
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw floor
      ctx.fillStyle = '#34495e';
      ctx.fillRect(0, canvas.height - 10, canvas.width, 10);

      renderBlob(ctx, blob, showDebug);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [params, showDebug]);

  // Mouse interaction
  const findNearestVertex = useCallback((x: number, y: number): number => {
    const blob = blobRef.current;
    if (!blob) return -1;

    let minDist = Infinity;
    let nearest = -1;

    for (let i = 0; i < blob.vertices.length; i++) {
      const v = blob.vertices[i];
      const dx = v.pos.x - x;
      const dy = v.pos.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist && dist < 50) {
        minDist = dist;
        nearest = i;
      }
    }

    return nearest;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nearest = findNearestVertex(x, y);
    if (nearest >= 0) {
      dragRef.current = { active: true, vertexIndex: nearest };
    }
  }, [findNearestVertex]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const blob = blobRef.current;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const v = blob.vertices[dragRef.current.vertexIndex];
    v.pos.x = x;
    v.pos.y = y;
    v.oldPos.x = x;
    v.oldPos.y = y;
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current = { active: false, vertexIndex: -1 };
  }, []);

  const handleReset = useCallback(() => {
    blobRef.current = createBlob(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    lastTimeRef.current = -1; // Reset timing to avoid physics explosion
  }, []);

  const handlePoke = useCallback(() => {
    const blob = blobRef.current;

    // Apply random impulse to all vertices
    for (const v of blob.vertices) {
      v.oldPos.x = v.pos.x + (Math.random() - 0.5) * 30;
      v.oldPos.y = v.pos.y + (Math.random() - 0.5) * 30;
    }
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: '#1a252f',
      minHeight: '100vh',
      color: '#ecf0f1',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <h1 style={{ margin: '0 0 10px 0' }}>Proto-1: Soft Body Blob</h1>
      <p style={{ margin: '0 0 20px 0', opacity: 0.7 }}>
        Click and drag vertices to poke the blob
      </p>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            border: '2px solid #34495e',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        />

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          padding: '20px',
          backgroundColor: '#34495e',
          borderRadius: '8px',
          minWidth: '250px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>FPS: {fps}</span>
            <span>Vertices: 10</span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #4a6278', margin: '5px 0' }} />

          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span>Damping (velocity): {params.damping.toFixed(3)}</span>
            <input
              type="range"
              min="0.9"
              max="1"
              step="0.001"
              value={params.damping}
              onChange={(e) => setParams(p => ({ ...p, damping: parseFloat(e.target.value) }))}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span>Gravity: {params.gravity}</span>
            <input
              type="range"
              min="-25"
              max="50"
              step="5"
              value={params.gravity}
              onChange={(e) => setParams(p => ({ ...p, gravity: parseFloat(e.target.value) }))}
            />
            <span style={{ fontSize: '11px', opacity: 0.6 }}>
              -25 = floats up, 0 = zero-g, 50 = gentle fall
            </span>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span>Stiffness (k): {params.stiffness}</span>
            <input
              type="range"
              min="10"
              max="300"
              step="10"
              value={params.stiffness}
              onChange={(e) => setParams(p => ({ ...p, stiffness: parseFloat(e.target.value) }))}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span>Pressure: {params.pressure.toFixed(2)}</span>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={params.pressure}
              onChange={(e) => setParams(p => ({ ...p, pressure: parseFloat(e.target.value) }))}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span>Constraint Iterations: {params.iterations}</span>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={params.iterations}
              onChange={(e) => setParams(p => ({ ...p, iterations: parseInt(e.target.value) }))}
            />
          </label>

          <hr style={{ border: 'none', borderTop: '1px solid #4a6278', margin: '5px 0' }} />

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={showDebug}
              onChange={(e) => setShowDebug(e.target.checked)}
            />
            <span>Show Debug (vertices, springs)</span>
          </label>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePoke}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#3498db',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Poke!
            </button>
            <button
              onClick={handleReset}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#e74c3c',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Reset
            </button>
          </div>

          <button
            onClick={() => setParams(DEFAULT_PARAMS)}
            style={{
              padding: '10px',
              backgroundColor: '#95a5a6',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Reset Parameters
          </button>
        </div>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#34495e',
        borderRadius: '8px',
        maxWidth: '760px',
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Proto-1 Goals:</h3>
        <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.6 }}>
          <li>Verlet integration with position-based constraints</li>
          <li>T-tetromino shape with 10 perimeter vertices</li>
          <li>Ring springs (perimeter) + cross springs (structural)</li>
          <li>Pressure force for volume preservation</li>
          <li>Catmull-Rom to Bezier for smooth rendering</li>
        </ul>
      </div>
    </div>
  );
}

export default SoftBodyProto1;
