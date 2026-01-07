<script>
  import TopoBackground from './TopoBackground.svelte';
  import Home from './pages/Home.svelte';
  import CV from './pages/CV.svelte';
  import Projects from './pages/Projects.svelte';
  import Contact from './pages/Contact.svelte';

  let currentPage = 'home';
  let isNavigating = false;
  let exploreMode = false;
  let visited = new Set(['home']);

  // All waypoints including sub-locations
  const pageCoords = {
    home: { x: 0, y: 0 },
    cv: { x: 16000, y: 8000 },
    'cv-fleet': { x: 20000, y: 10000 },
    'cv-energy': { x: 19000, y: 5000 },
    'cv-consulting': { x: 21000, y: 8500 },
    projects: { x: -12000, y: 14000 },
    'proj-fleet': { x: -15500, y: 16500 },
    'proj-home': { x: -9500, y: 17500 },
    'proj-weather': { x: -15000, y: 11500 },
    'proj-oss': { x: -10000, y: 10500 },
    contact: { x: 8000, y: -10000 }
  };

  // Map sub-waypoints to their parent page
  const waypointToPage = {
    home: 'home',
    cv: 'cv',
    'cv-fleet': 'cv',
    'cv-energy': 'cv',
    'cv-consulting': 'cv',
    projects: 'projects',
    'proj-fleet': 'projects',
    'proj-home': 'projects',
    'proj-weather': 'projects',
    'proj-oss': 'projects',
    contact: 'contact'
  };

  const bounds = { minX: -18000, maxX: 24000, minY: -12000, maxY: 20000 };

  let offsetX = 0;
  let offsetY = 0;
  let trailProgress = 0;
  let trailFrom = null;
  let trailTo = null;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function animateToPage(targetWaypoint, duration = 2000) {
    const startCoords = pageCoords[currentPage] || { x: offsetX, y: offsetY };
    const endCoords = pageCoords[targetWaypoint];
    const startX = offsetX;
    const startY = offsetY;
    const endX = endCoords.x;
    const endY = endCoords.y;
    const startTime = performance.now();

    isNavigating = true;
    exploreMode = false;
    trailFrom = startCoords;
    trailTo = endCoords;
    trailProgress = 0;

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);

      offsetX = startX + (endX - startX) * eased;
      offsetY = startY + (endY - startY) * eased;
      trailProgress = progress;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        isNavigating = false;
        currentPage = waypointToPage[targetWaypoint];
        visited.add(targetWaypoint);
        visited = visited; // Trigger reactivity
        trailProgress = 0;
        trailFrom = null;
        trailTo = null;
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

  // Group waypoints for the checklist
  const waypointGroups = [
    { label: 'Main', items: ['home', 'cv', 'projects', 'contact'] },
    { label: 'Experience', items: ['cv-fleet', 'cv-energy', 'cv-consulting'] },
    { label: 'Projects', items: ['proj-fleet', 'proj-home', 'proj-weather', 'proj-oss'] }
  ];

  const labels = {
    home: 'Home',
    cv: 'Experience',
    projects: 'Projects',
    contact: 'Contact',
    'cv-fleet': 'Fleet Operations',
    'cv-energy': 'Energy Startup',
    'cv-consulting': 'Consulting',
    'proj-fleet': 'Telemetry Pipeline',
    'proj-home': 'Home Server',
    'proj-weather': 'Weather Station',
    'proj-oss': 'Open Source'
  };

  $: visitedCount = visited.size;
  $: totalCount = Object.keys(pageCoords).length;

  const components = { home: Home, cv: CV, projects: Projects, contact: Contact };
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
    <svelte:component this={components[currentPage]} />

    <div class="panel-footer">
      <button class="explore-btn" on:click={enterExploreMode}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
        </svg>
        Explore Map
      </button>
      <span class="progress">{visitedCount}/{totalCount} discovered</span>
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

  .panel-footer {
    margin-top: 2rem;
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
    max-width: 200px;
  }

  .checklist h4 {
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    color: var(--text-accent);
    text-transform: uppercase;
    margin: 0 0 0.75rem 0;
  }

  .checklist-group {
    margin-bottom: 0.75rem;
  }

  .checklist-group:last-child {
    margin-bottom: 0;
  }

  .group-label {
    font-size: 0.65rem;
    color: var(--text-accent);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    display: block;
    margin-bottom: 0.25rem;
  }

  .checklist-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--text-muted);
    opacity: 0.5;
    padding: 0.15rem 0;
  }

  .checklist-item.visited {
    opacity: 1;
    color: var(--text-primary);
  }

  .check {
    font-size: 0.6rem;
  }

  .checklist-item.visited .check {
    color: var(--text-accent);
  }
</style>
