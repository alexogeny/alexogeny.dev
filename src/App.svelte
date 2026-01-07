<script>
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import TopoBackground from './TopoBackground.svelte';
  import Home from './pages/Home.svelte';
  import CV from './pages/CV.svelte';
  import Projects from './pages/Projects.svelte';
  import Contact from './pages/Contact.svelte';

  const pages = ['home', 'cv', 'projects', 'contact'];
  let currentPage = 'home';
  let transitionDirection = { x: 100, y: 0 };

  function navigate(page) {
    const fromIdx = pages.indexOf(currentPage);
    const toIdx = pages.indexOf(page);

    // Randomize direction based on navigation
    const directions = [
      { x: 100, y: 0 },   // from right
      { x: -100, y: 0 },  // from left
      { x: 0, y: 100 },   // from bottom
      { x: 0, y: -100 }   // from top
    ];

    if (toIdx > fromIdx) {
      // Forward: right or bottom
      transitionDirection = Math.random() > 0.5 ? directions[0] : directions[2];
    } else {
      // Back: left or top
      transitionDirection = Math.random() > 0.5 ? directions[1] : directions[3];
    }

    currentPage = page;
  }

  const components = { home: Home, cv: CV, projects: Projects, contact: Contact };
</script>

<TopoBackground />

<main>
  {#key currentPage}
    <div
      class="panel"
      in:fly={{ x: transitionDirection.x, y: transitionDirection.y, duration: 250, delay: 50 }}
      out:fly={{ x: -transitionDirection.x, y: -transitionDirection.y, duration: 200 }}
    >
      <svelte:component this={components[currentPage]} {navigate} />

      <nav class="trail-nav">
        {#each pages as page}
          <button
            class="trail-link"
            class:active={currentPage === page}
            on:click={() => navigate(page)}
          >
            <span class="trail-marker"></span>
            {page === 'home' ? 'Home' : page === 'cv' ? 'CV' : page.charAt(0).toUpperCase() + page.slice(1)}
          </button>
        {/each}
      </nav>
    </div>
  {/key}
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
  }

  .trail-nav {
    display: flex;
    gap: 0.5rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--panel-border);
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

  .trail-link.active {
    color: var(--text-primary);
    background: rgba(255, 255, 255, 0.08);
  }

  .trail-marker {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.5;
  }

  .trail-link:hover .trail-marker,
  .trail-link.active .trail-marker {
    opacity: 1;
  }
</style>
