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

  const dispatch = createEventDispatcher();

  let canvas;
  let ctx;
  let noise;
  let seed = 42;

  // Pre-defined curved trail paths - spread far apart so you need to explore
  const trailPaths = {
    cv: [
      { x: 0, y: 0 },
      { x: 800, y: -400 },
      { x: 1600, y: 200 },
      { x: 2400, y: 800 },
      { x: 3200, y: 1600 }
    ],
    projects: [
      { x: 0, y: 0 },
      { x: -600, y: 800 },
      { x: -1200, y: 1400 },
      { x: -2000, y: 2000 },
      { x: -2400, y: 2800 }
    ],
    contact: [
      { x: 0, y: 0 },
      { x: 400, y: -600 },
      { x: 1000, y: -1200 },
      { x: 1600, y: -2000 }
    ]
  };

  // Perlin noise implementation
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

  function draw() {
    if (!canvas || !ctx || !noise) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    // Balanced terrain density
    const scale = 0.0035;
    const levels = 16;
    const step = 6;
    const cols = Math.ceil(w / step) + 1;
    const rows = Math.ceil(h / step) + 1;

    // Build height map with offset
    const hmap = [];
    for (let j = 0; j < rows; j++) {
      hmap[j] = [];
      for (let i = 0; i < cols; i++) {
        const worldX = (i * step + offsetX) * scale;
        const worldY = (j * step + offsetY) * scale;
        hmap[j][i] = fbm(noise, worldX, worldY);
      }
    }

    // Draw contours - thinner, more subtle
    ctx.strokeStyle = '#282828';
    ctx.lineWidth = 0.8;

    for (let lv = 0; lv < levels; lv++) {
      const t = -0.6 + (lv / levels) * 1.2;
      ctx.beginPath();

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

          function mix(a, b) {
            const d = b - a;
            if (Math.abs(d) < 0.001) return 0.5;
            return (t - a) / d;
          }

          const n = px + mix(hmap[y][x], hmap[y][x + 1]) * step;
          const e = py + mix(hmap[y][x + 1], hmap[y + 1][x + 1]) * step;
          const s = px + mix(hmap[y + 1][x], hmap[y + 1][x + 1]) * step;
          const we = py + mix(hmap[y][x], hmap[y + 1][x]) * step;

          switch (state) {
            case 1: case 14:
              ctx.moveTo(px, we); ctx.lineTo(s, py + step); break;
            case 2: case 13:
              ctx.moveTo(s, py + step); ctx.lineTo(px + step, e); break;
            case 3: case 12:
              ctx.moveTo(px, we); ctx.lineTo(px + step, e); break;
            case 4: case 11:
              ctx.moveTo(n, py); ctx.lineTo(px + step, e); break;
            case 5:
              ctx.moveTo(n, py); ctx.lineTo(px, we);
              ctx.moveTo(s, py + step); ctx.lineTo(px + step, e); break;
            case 6: case 9:
              ctx.moveTo(n, py); ctx.lineTo(s, py + step); break;
            case 7: case 8:
              ctx.moveTo(n, py); ctx.lineTo(px, we); break;
            case 10:
              ctx.moveTo(n, py); ctx.lineTo(px + step, e);
              ctx.moveTo(px, we); ctx.lineTo(s, py + step); break;
          }
        }
      }
      ctx.stroke();
    }

    // Helper to convert world coords to screen coords
    const centerX = w / 2;
    const centerY = h / 2;
    function worldToScreen(wx, wy) {
      return {
        x: centerX + (wx - offsetX) * 0.12,
        y: centerY + (wy - offsetY) * 0.12
      };
    }

    // Draw curved trail paths
    ctx.setLineDash([6, 10]);
    for (const [name, path] of Object.entries(trailPaths)) {
      if (path.length < 2) continue;

      ctx.strokeStyle = '#2a2a2a';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const firstPt = worldToScreen(path[0].x, path[0].y);
      ctx.moveTo(firstPt.x, firstPt.y);

      // Draw smooth curve through points using quadratic bezier
      for (let i = 1; i < path.length - 1; i++) {
        const curr = worldToScreen(path[i].x, path[i].y);
        const next = worldToScreen(path[i + 1].x, path[i + 1].y);
        const midX = (curr.x + next.x) / 2;
        const midY = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
      }

      // Final segment
      const lastPt = worldToScreen(path[path.length - 1].x, path[path.length - 1].y);
      ctx.lineTo(lastPt.x, lastPt.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Store marker positions for click detection
    markerPositions = [];

    // Draw waypoint markers
    for (const [name, coords] of Object.entries(waypoints)) {
      const screen = worldToScreen(coords.x, coords.y);
      const isCurrentLocation = name === currentLocation;
      const markerSize = isCurrentLocation ? 8 : 6;

      // Store for click detection
      markerPositions.push({ name, x: screen.x, y: screen.y, size: markerSize + 15 });

      // Outer ring
      ctx.strokeStyle = isCurrentLocation ? '#666' : '#444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, markerSize + 4, 0, Math.PI * 2);
      ctx.stroke();

      // Inner dot
      ctx.fillStyle = isCurrentLocation ? '#888' : '#555';
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, markerSize, 0, Math.PI * 2);
      ctx.fill();

      // Label (only in explore mode)
      if (exploreMode) {
        ctx.fillStyle = '#666';
        ctx.font = '11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        const label = name === 'home' ? 'Home' : name === 'cv' ? 'CV' : name.charAt(0).toUpperCase() + name.slice(1);
        ctx.fillText(label, screen.x, screen.y + markerSize + 18);
      }
    }

    // Draw animated trail marker during navigation
    if (trailFrom && trailTo && trailProgress > 0 && trailProgress < 1) {
      // Find the path we're traversing
      let activePath = null;
      let reversed = false;

      for (const [name, path] of Object.entries(trailPaths)) {
        const endCoords = waypoints[name];
        if (trailTo.x === endCoords?.x && trailTo.y === endCoords?.y) {
          activePath = path;
          break;
        }
        if (trailFrom.x === endCoords?.x && trailFrom.y === endCoords?.y) {
          activePath = path;
          reversed = true;
          break;
        }
      }

      if (activePath) {
        // Interpolate along the curved path
        const pathProgress = reversed ? 1 - trailProgress : trailProgress;
        const totalSegments = activePath.length - 1;
        const segmentFloat = pathProgress * totalSegments;
        const segmentIndex = Math.min(Math.floor(segmentFloat), totalSegments - 1);
        const segmentProgress = segmentFloat - segmentIndex;

        const p1 = activePath[segmentIndex];
        const p2 = activePath[segmentIndex + 1];
        const markerWorld = {
          x: p1.x + (p2.x - p1.x) * segmentProgress,
          y: p1.y + (p2.y - p1.y) * segmentProgress
        };
        const marker = worldToScreen(markerWorld.x, markerWorld.y);

        // Draw traveled path
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        ctx.beginPath();
        const startPt = worldToScreen(activePath[0].x, activePath[0].y);
        ctx.moveTo(reversed ? marker.x : startPt.x, reversed ? marker.y : startPt.y);

        for (let i = (reversed ? segmentIndex : 1); i <= (reversed ? activePath.length - 1 : segmentIndex); i++) {
          const pt = worldToScreen(activePath[i].x, activePath[i].y);
          ctx.lineTo(pt.x, pt.y);
        }
        if (!reversed) ctx.lineTo(marker.x, marker.y);
        ctx.stroke();

        // Moving marker
        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        ctx.arc(marker.x, marker.y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(marker.x, marker.y, 12, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  let markerPositions = [];
  let isDragging = false;
  let dragStart = { x: 0, y: 0 };
  let offsetAtDragStart = { x: 0, y: 0 };

  function handleCanvasClick(e) {
    if (!exploreMode) return;
    // Don't trigger click if we just finished dragging
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

  let wasDragging = false;

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

    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      wasDragging = true;
    }

    // Multiply by a factor to make panning feel responsive
    const newX = offsetAtDragStart.x - dx * 6;
    const newY = offsetAtDragStart.y - dy * 6;

    dispatch('pan', { x: newX, y: newY });
  }

  function handleMouseUp() {
    isDragging = false;
  }

  onMount(() => {
    ctx = canvas.getContext('2d');
    noise = createNoise(seed);
    draw();

    let timeout;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(draw, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  });

  // Redraw when any prop changes
  $: if (ctx && noise) {
    offsetX, offsetY, trailProgress, exploreMode, currentLocation;
    draw();
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
    z-index: -1;
    pointer-events: none;
  }

  canvas.explore {
    pointer-events: auto;
    cursor: grab;
  }

  canvas.explore:active {
    cursor: grabbing;
  }
</style>
