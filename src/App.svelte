<script>
  import TopoBackground from './TopoBackground.svelte';
  import Home from './pages/Home.svelte';
  import CV from './pages/CV.svelte';
  import Projects from './pages/Projects.svelte';
  import Contact from './pages/Contact.svelte';

  const pages = ['home', 'cv', 'projects', 'contact'];
  let currentPage = 'home';
  let isNavigating = false;

  // Map coordinates for each page location on the topography
  const pageCoords = {
    home: { x: 0, y: 0 },
    cv: { x: 800, y: 400 },
    projects: { x: -600, y: 700 },
    contact: { x: 400, y: -500 }
  };

  let offsetX = 0;
  let offsetY = 0;
  let trailProgress = 0;
  let trailFrom = null;
  let trailTo = null;

  // Easing function for smooth animation
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function animateToPage(targetPage, duration = 3000) {
    const startCoords = pageCoords[currentPage];
    const endCoords = pageCoords[targetPage];
    const startX = offsetX;
    const startY = offsetY;
    const endX = endCoords.x;
    const endY = endCoords.y;
    const startTime = performance.now();

    isNavigating = true;
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

  function navigate(page) {
    if (isNavigating || page === currentPage) return;
    animateToPage(page);
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
/>

<main>
  <div class="panel" class:navigating={isNavigating}>
    <svelte:component this={components[currentPage]} {navigate} />

    <nav class="trail-nav">
      {#if currentPage === 'home'}
        {#each pages.filter(p => p !== 'home') as page}
          <button
            class="trail-link"
            on:click={() => navigate(page)}
          >
            <span class="trail-marker"></span>
            {page === 'cv' ? 'CV' : page.charAt(0).toUpperCase() + page.slice(1)}
          </button>
        {/each}
      {:else}
        <button
          class="trail-link"
          on:click={() => navigate('home')}
        >
          <span class="trail-marker"></span>
          ← Back to Home
        </button>
      {/if}
    </nav>
  </div>
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

  .panel.navigating {
    transform: scale(0.1);
    opacity: 0;
    pointer-events: none;
  }

  .trail-nav {
    display: flex;
    gap: 0.5rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--panel-border);
    flex-wrap: wrap;
  }

  .trail-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-muted);
    background: none;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .trail-link:hover {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.05);
    border-color: var(--panel-border);
  }

  .trail-marker {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.5;
  }

  .trail-link:hover .trail-marker {
    opacity: 1;
  }
</style>
