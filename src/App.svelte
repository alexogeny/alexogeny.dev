<script>
  import TopoBackground from './TopoBackground.svelte';
  import Home from './pages/Home.svelte';
  import CV from './pages/CV.svelte';
  import Projects from './pages/Projects.svelte';
  import Contact from './pages/Contact.svelte';

  let currentPage = 'home';
  let isNavigating = false;
  let exploreMode = false;

  const pageCoords = {
    home: { x: 0, y: 0 },
    cv: { x: 16000, y: 8000 },
    projects: { x: -12000, y: 14000 },
    contact: { x: 8000, y: -10000 }
  };

  // Pan bounds - wide enough to explore all waypoints
  const bounds = { minX: -15000, maxX: 20000, minY: -12000, maxY: 16000 };

  let offsetX = 0;
  let offsetY = 0;
  let trailProgress = 0;
  let trailFrom = null;
  let trailTo = null;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function animateToPage(targetPage, duration = 2500) {
    const startCoords = pageCoords[currentPage];
    const endCoords = pageCoords[targetPage];
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
        currentPage = targetPage;
        trailProgress = 0;
        trailFrom = null;
        trailTo = null;
      }
    }

    requestAnimationFrame(step);
  }

  function handleWaypointClick(e) {
    const { name } = e.detail;
    if (name !== currentPage && !isNavigating) {
      animateToPage(name);
    }
  }

  function enterExploreMode() {
    exploreMode = true;
  }

  function exitExploreMode() {
    exploreMode = false;
    // Animate back to current page location
    const target = pageCoords[currentPage];
    if (offsetX !== target.x || offsetY !== target.y) {
      const startX = offsetX;
      const startY = offsetY;
      const startTime = performance.now();
      const duration = 800;

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
  }

  function handlePan(e) {
    const { x, y } = e.detail;
    offsetX = Math.max(bounds.minX, Math.min(bounds.maxX, x));
    offsetY = Math.max(bounds.minY, Math.min(bounds.maxY, y));
  }

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
    </div>
  </div>

  {#if exploreMode}
    <div class="explore-hint">
      <p>Drag to explore · Click a marker to travel there</p>
      <button class="close-explore" on:click={exitExploreMode}>
        ← Return
      </button>
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
    transition: transform 0.4s ease, opacity 0.4s ease;
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

  .explore-hint {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background: var(--panel-bg);
    border: 1px solid var(--panel-border);
    border-radius: 0.75rem;
    padding: 1rem 1.5rem;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .explore-hint p {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin: 0;
  }

  .close-explore {
    padding: 0.4rem 0.8rem;
    border-radius: 0.4rem;
    font-size: 0.8rem;
    color: var(--text-muted);
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--panel-border);
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .close-explore:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.1);
  }
</style>
