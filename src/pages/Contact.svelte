<script>
  export let navigate;

  const links = [
    { label: 'Email', value: 'hello@alexogeny.dev', href: 'mailto:hello@alexogeny.dev' },
    { label: 'GitHub', value: 'github.com/alexogeny', href: 'https://github.com/alexogeny' },
    { label: 'X / Twitter', value: '@alexogeny', href: 'https://x.com/alexogeny' },
    { label: 'Discord', value: 'alexogeny', href: 'https://discord.com/users/305879281580638228' }
  ];
</script>

<header>
  <button class="back" on:click={() => navigate('home')}>← alexogeny.dev</button>
  <h1>Contact</h1>
</header>

<p class="intro">Happy to hear from you. Whether it's about work, open source, or just to say hi.</p>

<div class="links">
  {#each links as link}
    <a href={link.href} target={link.href.startsWith('http') ? '_blank' : null} rel={link.href.startsWith('http') ? 'noopener noreferrer' : null}>
      <span class="label">{link.label}</span>
      <span class="value">{link.value}</span>
    </a>
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

  .intro {
    font-size: 0.875rem;
    color: var(--text-muted);
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }

  .links {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .links a {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    border-left: 1px solid var(--panel-border);
    padding: 0.25rem 0 0.25rem 1rem;
    text-decoration: none;
    transition: border-color 0.2s;
  }

  .links a:hover {
    border-color: var(--text-muted);
  }

  .label {
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    color: var(--text-accent);
    text-transform: uppercase;
  }

  .value {
    font-size: 0.875rem;
    color: var(--text-muted);
    transition: color 0.2s;
  }

  .links a:hover .value {
    color: var(--text-primary);
  }
</style>
