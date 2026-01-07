<script>
  import { onMount, createEventDispatcher } from 'svelte';

  export let offsetX = 0;
  export let offsetY = 0;
  export let trailProgress = 0;
  export let trailFrom = null;
  export let trailTo = null;
  export let waypoints = {};
  export let exploreMode = false;
  export let currentLocation = 'home';
  export let visited = new Set();

  const dispatch = createEventDispatcher();

  let canvas;
  let terrainCanvas;
  let ctx;
  let terrainCtx;
  let noise;
  let seed = 42;
  let lastTerrainOffset = { x: null, y: null };
  let animationId = null;

  // Trail paths with branches for sub-items
  const trailPaths = {
    cv: {
      main: [
        { x: 0, y: 0 },
        { x: 3000, y: -1500 },
        { x: 7000, y: 500 },
        { x: 11000, y: 3000 },
        { x: 16000, y: 8000 }
      ],
      branches: {
        'cv-fleet': [
          { x: 16000, y: 8000 },
          { x: 18000, y: 9500 },
          { x: 20000, y: 10000 }
        ],
        'cv-energy': [
          { x: 16000, y: 8000 },
          { x: 17500, y: 6000 },
          { x: 19000, y: 5000 }
        ],
        'cv-consulting': [
          { x: 16000, y: 8000 },
          { x: 18500, y: 7500 },
          { x: 21000, y: 8500 }
        ]
      }
    },
    projects: {
      main: [
        { x: 0, y: 0 },
        { x: -2500, y: 3500 },
        { x: -5000, y: 6000 },
        { x: -8500, y: 9000 },
        { x: -12000, y: 14000 }
      ],
      branches: {
        'proj-fleet': [
          { x: -12000, y: 14000 },
          { x: -14000, y: 15500 },
          { x: -15500, y: 16500 }
        ],
        'proj-home': [
          { x: -12000, y: 14000 },
          { x: -10500, y: 16000 },
          { x: -9500, y: 17500 }
        ],
        'proj-weather': [
          { x: -12000, y: 14000 },
          { x: -13500, y: 12500 },
          { x: -15000, y: 11500 }
        ],
        'proj-oss': [
          { x: -12000, y: 14000 },
          { x: -11000, y: 12000 },
          { x: -10000, y: 10500 }
        ]
      }
    },
    contact: {
      main: [
        { x: 0, y: 0 },
        { x: 1500, y: -2500 },
        { x: 4000, y: -5000 },
        { x: 8000, y: -10000 }
      ],
      branches: {}
    }
  };

  function createNoise(s) {
    const perm = [];
    function rng(seed) {
      return function() {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
      };
    }

    const random = rng(s);
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    for (let i = 0; i < 256; i++) perm[256 + i] = perm[i];

    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(a, b, t) { return a + t * (b - a); }
    function grad(hash, x, y) {
      switch (hash & 3) {
        case 0: return x + y;
        case 1: return -x + y;
        case 2: return x - y;
        default: return -x - y;
      }
    }

    return function(x, y) {
      const xi = Math.floor(x) & 255;
      const yi = Math.floor(y) & 255;
      const xf = x - Math.floor(x);
      const yf = y - Math.floor(y);
      const u = fade(xf);
      const v = fade(yf);
      const aa = perm[perm[xi] + yi];
      const ab = perm[perm[xi] + yi + 1];
      const ba = perm[perm[xi + 1] + yi];
      const bb = perm[perm[xi + 1] + yi + 1];
      return lerp(
        lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
        lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u),
        v
      );
    };
  }

  function fbm(n, x, y) {
    let val = 0, amp = 1, freq = 1;
    for (let i = 0; i < 3; i++) {
      val += amp * n(x * freq, y * freq);
      amp *= 0.5;
      freq *= 2;
    }
    return val;
  }

  // Draw terrain to offscreen canvas (expensive, done infrequently)
  function drawTerrain(w, h, panX, panY) {
    if (!terrainCanvas || !terrainCtx || !noise) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    terrainCanvas.width = w * dpr;
    terrainCanvas.height = h * dpr;
    terrainCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    terrainCtx.fillStyle = '#000';
    terrainCtx.fillRect(0, 0, w, h);

    const scale = 0.004;
    const step = 10;
    const terrainPanScale = 0.04;
    const cols = Math.ceil(w / step) + 1;
    const rows = Math.ceil(h / step) + 1;

    const hmap = [];
    for (let j = 0; j < rows; j++) {
      hmap[j] = [];
      for (let i = 0; i < cols; i++) {
        const worldX = (i * step + panX * terrainPanScale) * scale;
        const worldY = (j * step + panY * terrainPanScale) * scale;
        hmap[j][i] = fbm(noise, worldX, worldY);
      }
    }

    const levels = 12;
    terrainCtx.strokeStyle = '#222';
    terrainCtx.lineWidth = 0.6;

    for (let lv = 0; lv < levels; lv++) {
      const t = -0.5 + (lv / levels) * 1.0;
      terrainCtx.beginPath();

      for (let y = 0; y < rows - 1; y++) {
        for (let x = 0; x < cols - 1; x++) {
          const nw = hmap[y][x] > t ? 1 : 0;
          const ne = hmap[y][x + 1] > t ? 1 : 0;
          const se = hmap[y + 1][x + 1] > t ? 1 : 0;
          const sw = hmap[y + 1][x] > t ? 1 : 0;
          const state = nw * 8 + ne * 4 + se * 2 + sw;

          if (state === 0 || state === 15) continue;

          const px = x * step;
          const py = y * step;

          const mix = (a, b) => {
            const d = b - a;
            return Math.abs(d) < 0.001 ? 0.5 : (t - a) / d;
          };

          const n = px + mix(hmap[y][x], hmap[y][x + 1]) * step;
          const e = py + mix(hmap[y][x + 1], hmap[y + 1][x + 1]) * step;
          const s = px + mix(hmap[y + 1][x], hmap[y + 1][x + 1]) * step;
          const we = py + mix(hmap[y][x], hmap[y + 1][x]) * step;

          switch (state) {
            case 1: case 14: terrainCtx.moveTo(px, we); terrainCtx.lineTo(s, py + step); break;
            case 2: case 13: terrainCtx.moveTo(s, py + step); terrainCtx.lineTo(px + step, e); break;
            case 3: case 12: terrainCtx.moveTo(px, we); terrainCtx.lineTo(px + step, e); break;
            case 4: case 11: terrainCtx.moveTo(n, py); terrainCtx.lineTo(px + step, e); break;
            case 5: terrainCtx.moveTo(n, py); terrainCtx.lineTo(px, we); terrainCtx.moveTo(s, py + step); terrainCtx.lineTo(px + step, e); break;
            case 6: case 9: terrainCtx.moveTo(n, py); terrainCtx.lineTo(s, py + step); break;
            case 7: case 8: terrainCtx.moveTo(n, py); terrainCtx.lineTo(px, we); break;
            case 10: terrainCtx.moveTo(n, py); terrainCtx.lineTo(px + step, e); terrainCtx.moveTo(px, we); terrainCtx.lineTo(s, py + step); break;
          }
        }
      }
      terrainCtx.stroke();
    }

    lastTerrainOffset = { x: panX, y: panY };
  }

  function draw() {
    if (!canvas || !ctx) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Check if we need to redraw terrain
    const needsTerrainRedraw = lastTerrainOffset.x === null ||
      Math.abs(offsetX - lastTerrainOffset.x) > 500 ||
      Math.abs(offsetY - lastTerrainOffset.y) > 500;

    if (needsTerrainRedraw && noise) {
      drawTerrain(w, h, offsetX, offsetY);
    }

    // Copy terrain to main canvas
    if (terrainCanvas) {
      ctx.drawImage(terrainCanvas, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);
    }

    const centerX = w / 2;
    const centerY = h / 2;
    const worldScale = 0.035;

    function worldToScreen(wx, wy) {
      return {
        x: centerX + (wx - offsetX) * worldScale,
        y: centerY + (wy - offsetY) * worldScale
      };
    }

    // Draw all trail paths (main + branches)
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const [name, pathData] of Object.entries(trailPaths)) {
      // Draw main path
      drawPath(pathData.main, '#1a1a1a', 2.5);

      // Draw branches
      for (const [branchName, branchPath] of Object.entries(pathData.branches || {})) {
        drawPath(branchPath, '#181818', 1.5);
      }
    }

    function drawPath(path, color, width) {
      if (path.length < 2) return;

      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash([5, 8]);
      ctx.beginPath();

      const first = worldToScreen(path[0].x, path[0].y);
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < path.length; i++) {
        const pt = worldToScreen(path[i].x, path[i].y);
        const prev = worldToScreen(path[i-1].x, path[i-1].y);
        const cpX = (prev.x + pt.x) / 2;
        const cpY = (prev.y + pt.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, cpX, cpY);
      }

      const last = worldToScreen(path[path.length - 1].x, path[path.length - 1].y);
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw waypoint markers
    markerPositions = [];

    for (const [name, coords] of Object.entries(waypoints)) {
      const screen = worldToScreen(coords.x, coords.y);
      const isCurrent = name === currentLocation;
      const isVisited = visited.has(name);
      const isMain = !name.includes('-');
      const size = isCurrent ? 10 : isMain ? 7 : 5;

      markerPositions.push({ name, x: screen.x, y: screen.y, size: size + 20 });

      // Outer glow for visited
      if (isVisited && !isCurrent) {
        ctx.fillStyle = 'rgba(80, 80, 80, 0.3)';
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, size + 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ring
      ctx.strokeStyle = isCurrent ? '#777' : isVisited ? '#555' : '#333';
      ctx.lineWidth = isCurrent ? 2.5 : 2;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, size + 3, 0, Math.PI * 2);
      ctx.stroke();

      // Dot
      ctx.fillStyle = isCurrent ? '#999' : isVisited ? '#666' : '#444';
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, size, 0, Math.PI * 2);
      ctx.fill();

      // Label in explore mode
      if (exploreMode) {
        ctx.fillStyle = isVisited ? '#777' : '#555';
        ctx.font = `${isMain ? 12 : 10}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        const label = getLabel(name);
        ctx.fillText(label, screen.x, screen.y + size + 16);
      }
    }

    // Navigation animation
    if (trailFrom && trailTo && trailProgress > 0 && trailProgress < 1) {
      const fromX = trailFrom.x + (trailTo.x - trailFrom.x) * trailProgress;
      const fromY = trailFrom.y + (trailTo.y - trailFrom.y) * trailProgress;
      const marker = worldToScreen(fromX, fromY);

      ctx.fillStyle = '#bbb';
      ctx.beginPath();
      ctx.arc(marker.x, marker.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(marker.x, marker.y, 13, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function getLabel(name) {
    const labels = {
      home: 'Home',
      cv: 'Experience',
      projects: 'Projects',
      contact: 'Contact',
      'cv-fleet': 'Fleet Ops',
      'cv-energy': 'Energy',
      'cv-consulting': 'Consulting',
      'proj-fleet': 'Telemetry',
      'proj-home': 'Home Server',
      'proj-weather': 'Weather',
      'proj-oss': 'Open Source'
    };
    return labels[name] || name;
  }

  let markerPositions = [];
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let offsetAtDragStart = { x: 0, y: 0 };
  let wasDragging = false;

  function handleCanvasClick(e) {
    if (!exploreMode) return;
    if (wasDragging) {
      wasDragging = false;
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const marker of markerPositions) {
      const dist = Math.sqrt((x - marker.x) ** 2 + (y - marker.y) ** 2);
      if (dist < marker.size) {
        dispatch('waypointClick', { name: marker.name });
        return;
      }
    }
  }

  function handleMouseDown(e) {
    if (!exploreMode) return;
    isDragging = true;
    wasDragging = false;
    dragStart = { x: e.clientX, y: e.clientY };
    offsetAtDragStart = { x: offsetX, y: offsetY };
  }

  function handleMouseMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      wasDragging = true;
    }

    const newX = offsetAtDragStart.x - dx * 28;
    const newY = offsetAtDragStart.y - dy * 28;
    dispatch('pan', { x: newX, y: newY });
  }

  function handleMouseUp() {
    isDragging = false;
  }

  onMount(() => {
    ctx = canvas.getContext('2d');
    terrainCanvas = document.createElement('canvas');
    terrainCtx = terrainCanvas.getContext('2d');
    noise = createNoise(seed);
    draw();

    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      lastTerrainOffset = { x: null, y: null };
      resizeTimeout = setTimeout(draw, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animationId) cancelAnimationFrame(animationId);
    };
  });

  function scheduleDraw() {
    if (animationId) return;
    animationId = requestAnimationFrame(() => {
      animationId = null;
      draw();
    });
  }

  $: if (ctx) {
    offsetX, offsetY, trailProgress, exploreMode, currentLocation, visited;
    scheduleDraw();
  }
</script>

<canvas
  bind:this={canvas}
  on:click={handleCanvasClick}
  on:mousedown={handleMouseDown}
  class:explore={exploreMode}
></canvas>

<style>
  canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 0;
    pointer-events: none;
  }

  canvas.explore {
    pointer-events: auto;
    cursor: grab;
    z-index: 10;
  }

  canvas.explore:active {
    cursor: grabbing;
  }
</style>
