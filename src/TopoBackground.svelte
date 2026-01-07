<script>
  import { onMount } from 'svelte';

  let canvas;
  let ctx;

  // Perlin noise implementation
  function createNoise(seed) {
    const perm = [];

    // Seeded RNG
    function rng(s) {
      return function() {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        return s / 0x7fffffff;
      };
    }

    const random = rng(seed);
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

  function fbm(noise, x, y) {
    let val = 0, amp = 1, freq = 1;
    for (let i = 0; i < 4; i++) {
      val += amp * noise(x * freq, y * freq);
      amp *= 0.5;
      freq *= 2;
    }
    return val;
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

    // Black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    const seed = Date.now() % 100000;
    const noise = createNoise(seed);
    const scale = 0.005;
    const levels = 20;
    const step = 5;
    const cols = Math.ceil(w / step) + 1;
    const rows = Math.ceil(h / step) + 1;

    // Build height map
    const hmap = [];
    for (let j = 0; j < rows; j++) {
      hmap[j] = [];
      for (let i = 0; i < cols; i++) {
        hmap[j][i] = fbm(noise, i * step * scale, j * step * scale);
      }
    }

    // Marching squares for contours
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    for (let lv = 0; lv < levels; lv++) {
      const t = -0.8 + (lv / levels) * 1.6;
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
  }

  onMount(() => {
    ctx = canvas.getContext('2d');
    draw();

    let timeout;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(draw, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });
</script>

<canvas bind:this={canvas}></canvas>

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
</style>
