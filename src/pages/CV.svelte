<script>
  export let navigate;

  const experience = [
    {
      role: 'Senior Software Engineer',
      company: 'Fleet Operations',
      period: '2022 — Present',
      description: 'Building monitoring pipelines and operator interfaces for electric vehicle fleet management.'
    },
    {
      role: 'Software Engineer',
      company: 'Energy Startup',
      period: '2019 — 2022',
      description: 'Developed deploy rituals and documentation systems. Focused on humane defaults and team workflows.'
    },
    {
      role: 'Full Stack Developer',
      company: 'Consulting',
      period: '2016 — 2019',
      description: 'Client work across web applications, data pipelines, and internal tools.'
    }
  ];

  const skills = ['Python', 'TypeScript', 'Go', 'Rust', 'PostgreSQL', 'Redis', 'Kafka', 'Kubernetes', 'Terraform', 'AWS'];
</script>

<header>
  <button class="back" on:click={() => navigate('home')}>← alexogeny.dev</button>
  <h1>Curriculum Vitae</h1>
</header>

<section>
  <h2>Experience</h2>
  <div class="jobs">
    {#each experience as job}
      <div class="job">
        <div class="job-header">
          <h3>{job.role}</h3>
          <span class="period">{job.period}</span>
        </div>
        <p class="company">{job.company}</p>
        <p class="desc">{job.description}</p>
      </div>
    {/each}
  </div>
</section>

<section>
  <h2>Skills</h2>
  <div class="skills">
    {#each skills as skill}
      <span class="skill">{skill}</span>
    {/each}
  </div>
</section>

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

  section {
    margin-bottom: 1.5rem;
  }

  h2 {
    font-size: 0.7rem;
    letter-spacing: 0.2em;
    color: var(--text-accent);
    margin-bottom: 1rem;
    text-transform: uppercase;
  }

  .jobs {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .job {
    border-left: 1px solid var(--panel-border);
    padding-left: 1rem;
  }

  .job-header {
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

  .period {
    font-size: 0.75rem;
    color: var(--text-accent);
    white-space: nowrap;
  }

  .company {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-bottom: 0.25rem;
  }

  .desc {
    font-size: 0.875rem;
    color: var(--text-muted);
    line-height: 1.5;
  }

  .skills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .skill {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    background: rgba(255, 255, 255, 0.05);
    color: var(--text-muted);
    border: 1px solid var(--panel-border);
  }
</style>
