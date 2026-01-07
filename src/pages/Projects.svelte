<script>
  export let navigate;

  const projects = [
    {
      name: 'Fleet Telemetry Pipeline',
      description: 'Rebuilt monitoring so every event arrives as a story beat. Operators annotate like dramaturgs.',
      status: 'Active'
    },
    {
      name: 'Home Server',
      description: 'Personal infrastructure hosting generational memories and family archives.',
      status: 'Maintained'
    },
    {
      name: 'Weather Station',
      description: 'A small device that texts before storms form. Quiet utility for the people around me.',
      status: 'Running'
    },
    {
      name: 'Open Source',
      description: 'Various contributions to tools I depend on. Patches, docs, and the occasional feature.',
      status: 'Ongoing'
    }
  ];
</script>

<header>
  <button class="back" on:click={() => navigate('home')}>← alexogeny.dev</button>
  <h1>Projects</h1>
</header>

<div class="projects">
  {#each projects as project}
    <div class="project">
      <div class="project-header">
        <h3>{project.name}</h3>
        <span class="status">{project.status}</span>
      </div>
      <p>{project.description}</p>
    </div>
  {/each}
</div>

<style>
  header {
    margin-bottom: 1.5rem;
  }

  .back {
    background: none;
    border: none;
    font-size: 0.7rem;
    letter-spacing: 0.3em;
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
  }

  .projects {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .project {
    border-left: 1px solid var(--panel-border);
    padding-left: 1rem;
  }

  .project-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    margin-bottom: 0.25rem;
  }

  h3 {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .status {
    font-size: 0.75rem;
    color: var(--text-accent);
  }

  p {
    font-size: 0.875rem;
    color: var(--text-muted);
    line-height: 1.5;
  }
</style>
