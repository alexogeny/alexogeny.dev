<script>
  export let navigate;
</script>

<header>
  <p class="site-name">ALEXOGENY.DEV</p>
  <h1>Alex Mack</h1>
</header>

<div class="content">
  <p>
    Software engineer based in Brisbane. I build systems that work quietly in the background
    — fleet operations tools, monitoring pipelines, and interfaces that feel familiar to the
    people who depend on them.
  </p>
  <p>
    When I'm not writing code, I'm tending personal infrastructure, archiving family memories,
    or thinking about how to keep software soft.
  </p>
</div>

<div class="links">
  <a href="mailto:hello@alexogeny.dev">hello@alexogeny.dev</a>
  <span class="dot">·</span>
  <a href="https://github.com/alexogeny" target="_blank" rel="noopener">github</a>
</div>

<style>
  header {
    margin-bottom: 1.5rem;
  }

  .site-name {
    font-size: 0.7rem;
    letter-spacing: 0.3em;
    color: var(--text-accent);
    margin-bottom: 0.5rem;
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 600;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .content p {
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--text-muted);
  }

  .links {
    margin-top: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.875rem;
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
</style>
