<script>
  import TopoBackground, { trailPaths } from './TopoBackground.svelte';
  import Home from './pages/Home.svelte';

  let currentPage = 'home';
  let isNavigating = false;
  let exploreMode = false;
  let visited = new Set(['home']);

  // All waypoints - endpoints of each trail
  const pageCoords = {
    home: { x: 0, y: 0 },
    cv: { x: 16000, y: 8000 },
    'cv-fleet': { x: 30000, y: 18000 },
    'cv-energy': { x: 30000, y: -2000 },
    'cv-consulting': { x: 34000, y: 12000 },
    projects: { x: -12000, y: 14000 },
    'proj-fleet': { x: -24000, y: 26000 },
    'proj-home': { x: 0, y: 26000 },
    'proj-weather': { x: -30000, y: 8000 },
    'proj-oss': { x: -18000, y: -4000 },
    contact: { x: 12000, y: -16000 }
  };

  // Content for each waypoint
  const nodeContent = {
    home: { component: Home },
    cv: {
      title: 'Experience',
      subtitle: 'Career journey',
      description: 'Senior engineer focused on fleet operations, monitoring systems, and developer tooling. Explore the branches to see specific roles.',
      type: 'hub'
    },
    'cv-fleet': {
      title: 'Fleet Operations',
      subtitle: 'Senior Software Engineer · 2022 — Present',
      description: 'Building monitoring pipelines and operator interfaces for electric vehicle fleet management. Real-time telemetry processing, alerting systems, and operational dashboards.',
      type: 'detail'
    },
    'cv-energy': {
      title: 'Energy Startup',
      subtitle: 'Software Engineer · 2019 — 2022',
      description: 'Developed deploy rituals and documentation systems. Focused on humane defaults, team workflows, and making complex systems approachable.',
      type: 'detail'
    },
    'cv-consulting': {
      title: 'Consulting',
      subtitle: 'Full Stack Developer · 2016 — 2019',
      description: 'Client work across web applications, data pipelines, and internal tools. Learned to translate business needs into working software.',
      type: 'detail'
    },
    projects: {
      title: 'Projects',
      subtitle: 'Things I\'ve built',
      description: 'Personal and professional projects. Infrastructure, monitoring, and quiet utilities. Explore the branches to see individual work.',
      type: 'hub'
    },
    'proj-fleet': {
      title: 'Fleet Telemetry Pipeline',
      subtitle: 'Active',
      description: 'Rebuilt monitoring so every event arrives as a story beat. Operators annotate like dramaturgs. Real-time data flows through Kafka into queryable time-series.',
      type: 'detail'
    },
    'proj-home': {
      title: 'Home Server',
      subtitle: 'Maintained',
      description: 'Personal infrastructure hosting generational memories and family archives. ZFS, automated backups, media streaming, and home automation.',
      type: 'detail'
    },
    'proj-weather': {
      title: 'Weather Station',
      subtitle: 'Running',
      description: 'A small device that texts before storms form. Quiet utility for the people around me. Raspberry Pi, sensors, and a simple notification system.',
      type: 'detail'
    },
    'proj-oss': {
      title: 'Open Source',
      subtitle: 'Ongoing',
      description: 'Various contributions to tools I depend on. Patches, docs, and the occasional feature. Giving back to the ecosystem that enables my work.',
      type: 'detail'
    },
    contact: {
      title: 'Contact',
      subtitle: 'Get in touch',
      description: 'For work inquiries, collaborations, or just to say hello.',
      email: 'hello@alexogeny.dev',
      github: 'alexogeny',
      type: 'contact'
    }
  };

  const bounds = { minX: -35000, maxX: 40000, minY: -20000, maxY: 30000 };

  let offsetX = 0;
  let offsetY = 0;
  let trailProgress = 0;
  let trailFrom = null;
  let trailTo = null;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // Find the path between two waypoints
  function findPath(from, to) {
    const fromCoord = pageCoords[from];
    const toCoord = pageCoords[to];

    // Check if going to a main destination from home
    if (from === 'home') {
      if (trailPaths[to]?.main) {
        return trailPaths[to].main;
      }
      // Going to a sub-node from home - combine main + branch
      for (const [mainName, pathData] of Object.entries(trailPaths)) {
        if (pathData.branches?.[to]) {
          return [...pathData.main, ...pathData.branches[to].slice(1)];
        }
      }
    }

    // Check if going from a main node to its sub-node
    for (const [mainName, pathData] of Object.entries(trailPaths)) {
      if (from === mainName && pathData.branches?.[to]) {
        return pathData.branches[to];
      }
    }

    // Check if going back to home
    if (to === 'home') {
      if (trailPaths[from]?.main) {
        return [...trailPaths[from].main].reverse();
      }
      // From a sub-node back to home
      for (const [mainName, pathData] of Object.entries(trailPaths)) {
        if (pathData.branches?.[from]) {
          const branchReversed = [...pathData.branches[from]].reverse();
          const mainReversed = [...pathData.main].reverse();
          return [...branchReversed, ...mainReversed.slice(1)];
        }
      }
    }

    // Going from sub-node to parent
    for (const [mainName, pathData] of Object.entries(trailPaths)) {
      if (pathData.branches?.[from] && to === mainName) {
        return [...pathData.branches[from]].reverse();
      }
    }

    // Default: straight line
    return [fromCoord, toCoord];
  }

  // Interpolate position along a path
  function getPositionOnPath(path, progress) {
    if (path.length < 2) return path[0] || { x: 0, y: 0 };

    const totalLength = path.length - 1;
    const scaledProgress = progress * totalLength;
    const index = Math.min(Math.floor(scaledProgress), totalLength - 1);
    const localProgress = scaledProgress - index;

    const p1 = path[index];
    const p2 = path[index + 1];

    return {
      x: p1.x + (p2.x - p1.x) * localProgress,
      y: p1.y + (p2.y - p1.y) * localProgress
    };
  }

  let currentPath = [];

  function animateToPage(targetWaypoint, duration = 2500) {
    currentPath = findPath(currentPage, targetWaypoint);
    const startTime = performance.now();

    isNavigating = true;
    exploreMode = false;
    trailFrom = currentPath[0];
    trailTo = currentPath[currentPath.length - 1];
    trailProgress = 0;

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);

      const pos = getPositionOnPath(currentPath, eased);
      offsetX = pos.x;
      offsetY = pos.y;
      trailProgress = eased;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        isNavigating = false;
        currentPage = targetWaypoint;
        visited.add(targetWaypoint);
        visited = visited;
        trailProgress = 0;
        trailFrom = null;
        trailTo = null;
        currentPath = [];
      }
    }

    requestAnimationFrame(step);
  }

  function handleWaypointClick(e) {
    const { name } = e.detail;
    if (!isNavigating) {
      animateToPage(name);
    }
  }

  function enterExploreMode() {
    exploreMode = true;
  }

  function exitExploreMode() {
    exploreMode = false;
    const target = pageCoords[currentPage];
    if (!target) return;

    const startX = offsetX;
    const startY = offsetY;
    const startTime = performance.now();
    const duration = 600;

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);

      offsetX = startX + (target.x - startX) * eased;
      offsetY = startY + (target.y - startY) * eased;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  function handlePan(e) {
    const { x, y } = e.detail;
    offsetX = Math.max(bounds.minX, Math.min(bounds.maxX, x));
    offsetY = Math.max(bounds.minY, Math.min(bounds.maxY, y));
  }

  function goBack() {
    // Determine where to go back to
    if (currentPage.startsWith('cv-')) {
      animateToPage('cv');
    } else if (currentPage.startsWith('proj-')) {
      animateToPage('projects');
    } else if (currentPage !== 'home') {
      animateToPage('home');
    }
  }

  const waypointGroups = [
    { label: 'Main', items: ['home', 'cv', 'projects', 'contact'] },
    { label: 'Experience', items: ['cv-fleet', 'cv-energy', 'cv-consulting'] },
    { label: 'Projects', items: ['proj-fleet', 'proj-home', 'proj-weather', 'proj-oss'] }
  ];

  const labels = {
    home: 'Home', cv: 'Experience', projects: 'Projects', contact: 'Contact',
    'cv-fleet': 'Fleet Operations', 'cv-energy': 'Energy Startup', 'cv-consulting': 'Consulting',
    'proj-fleet': 'Telemetry', 'proj-home': 'Home Server', 'proj-weather': 'Weather', 'proj-oss': 'Open Source'
  };

  $: visitedCount = visited.size;
  $: totalCount = Object.keys(pageCoords).length;
  $: content = nodeContent[currentPage];
  $: canGoBack = currentPage !== 'home';
</script>

<TopoBackground
  {offsetX}
  {offsetY}
  {trailProgress}
  {trailFrom}
  {trailTo}
  waypoints={pageCoords}
  {exploreMode}
  currentLocation={currentPage}
  {visited}
  on:waypointClick={handleWaypointClick}
  on:pan={handlePan}
/>

<main>
  <div class="panel" class:hidden={isNavigating || exploreMode}>
    {#if content?.component}
      <svelte:component this={content.component} />
    {:else if content}
      <header>
        {#if canGoBack}
          <button class="back" on:click={goBack}>← Back</button>
        {:else}
          <p class="site-name">ALEXOGENY.DEV</p>
        {/if}
        <h1>{content.title}</h1>
        {#if content.subtitle}
          <p class="subtitle">{content.subtitle}</p>
        {/if}
      </header>

      <div class="content">
        <p>{content.description}</p>
      </div>

      {#if content.type === 'contact'}
        <div class="links">
          <a href="mailto:{content.email}">{content.email}</a>
          <span class="dot">·</span>
          <a href="https://github.com/{content.github}" target="_blank" rel="noopener">github</a>
        </div>
      {/if}
    {/if}

    <div class="panel-footer">
      <button class="explore-btn" on:click={enterExploreMode}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
        </svg>
        Explore
      </button>
      <span class="progress">{visitedCount}/{totalCount}</span>
    </div>
  </div>

  {#if exploreMode}
    <div class="explore-ui">
      <div class="explore-hint">
        <p>Drag to explore · Click markers to travel</p>
        <button class="close-btn" on:click={exitExploreMode}>← Return</button>
      </div>

      <div class="checklist">
        <h4>Discoveries</h4>
        {#each waypointGroups as group}
          <div class="checklist-group">
            <span class="group-label">{group.label}</span>
            {#each group.items as item}
              <div class="checklist-item" class:visited={visited.has(item)}>
                <span class="check">{visited.has(item) ? '◆' : '◇'}</span>
                <span class="label">{labels[item]}</span>
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</main>

<style>
  main {
    position: relative;
    width: 100%;
    max-width: 480px;
  }

  .panel {
    background: var(--panel-bg);
    border: 1px solid var(--panel-border);
    border-radius: 1rem;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    width: 100%;
    padding: 2.5rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  .panel.hidden {
    transform: scale(0.1);
    opacity: 0;
    pointer-events: none;
  }

  header {
    margin-bottom: 1.5rem;
  }

  .site-name {
    font-size: 0.7rem;
    letter-spacing: 0.3em;
    color: var(--text-accent);
    margin-bottom: 0.5rem;
  }

  .back {
    background: none;
    border: none;
    font-size: 0.75rem;
    color: var(--text-accent);
    cursor: pointer;
    padding: 0;
    margin-bottom: 0.5rem;
    transition: color 0.2s;
    font-family: inherit;
  }

  .back:hover {
    color: var(--text-muted);
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0;
  }

  .subtitle {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
  }

  .content {
    margin-bottom: 1.5rem;
  }

  .content p {
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--text-muted);
  }

  .links {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.875rem;
    margin-bottom: 1rem;
  }

  .links a {
    color: var(--text-muted);
    text-decoration: none;
    transition: color 0.2s;
  }

  .links a:hover {
    color: var(--text-primary);
  }

  .dot {
    color: var(--text-accent);
  }

  .panel-footer {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--panel-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .explore-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-muted);
    background: none;
    border: 1px solid var(--panel-border);
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .explore-btn:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.05);
  }

  .progress {
    font-size: 0.75rem;
    color: var(--text-accent);
  }

  .explore-ui {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding: 1.5rem;
    pointer-events: none;
  }

  .explore-hint {
    background: var(--panel-bg);
    border: 1px solid var(--panel-border);
    border-radius: 0.75rem;
    padding: 0.875rem 1.25rem;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    gap: 1.25rem;
    pointer-events: auto;
  }

  .explore-hint p {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin: 0;
  }

  .close-btn {
    padding: 0.4rem 0.75rem;
    border-radius: 0.4rem;
    font-size: 0.8rem;
    color: var(--text-muted);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--panel-border);
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .close-btn:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.1);
  }

  .checklist {
    background: var(--panel-bg);
    border: 1px solid var(--panel-border);
    border-radius: 0.75rem;
    padding: 1rem 1.25rem;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    pointer-events: auto;
    max-width: 180px;
  }

  .checklist h4 {
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    color: var(--text-accent);
    text-transform: uppercase;
    margin: 0 0 0.75rem 0;
  }

  .checklist-group {
    margin-bottom: 0.5rem;
  }

  .checklist-group:last-child {
    margin-bottom: 0;
  }

  .group-label {
    font-size: 0.6rem;
    color: var(--text-accent);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    display: block;
    margin-bottom: 0.2rem;
  }

  .checklist-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    color: var(--text-muted);
    opacity: 0.5;
    padding: 0.1rem 0;
  }

  .checklist-item.visited {
    opacity: 1;
    color: var(--text-primary);
  }

  .check {
    font-size: 0.55rem;
  }

  .checklist-item.visited .check {
    color: var(--text-accent);
  }
</style>
