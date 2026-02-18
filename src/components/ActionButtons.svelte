<script lang="ts">
  let { onInfoClick }: { onInfoClick: () => void } = $props()
</script>

<a 
  href="https://www.youtube.com/@make_stuff_with_me?sub_confirmation=1" 
  target="_blank" 
  rel="noopener noreferrer" 
  class="credit-cta inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-[#ff0000]/40 bg-[#ff0000]/15 px-2 py-1 text-[11px] font-medium text-white/95 no-underline transition-all duration-200 hover:border-[#ff0000]/70 hover:bg-[#ff0000]/25 hover:scale-[1.02] hover:shadow-[0_0_12px_rgba(255,0,0,0.25)]" 
  title="subscribe on youtube"
>
  <span class="credit-cta-icon" aria-hidden="true">
    <svg width="14" height="10" viewBox="0 0 24 17" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.498 2.69a2.99 2.99 0 0 0-2.122-2.12C19.505 0 12 0 12 0S4.495 0 2.622.57a2.99 2.99 0 0 0-2.122 2.12A31.3 31.3 0 0 0 0 8.5a31.3 31.3 0 0 0 .5 5.81 2.99 2.99 0 0 0 2.122 2.12C4.495 17 12 17 12 17s7.505 0 9.378-.57a2.99 2.99 0 0 0 2.122-2.12 31.3 31.3 0 0 0 .5-5.81 31.3 31.3 0 0 0-.5-5.81Z"/>
      <path fill="#0d0d0d" d="M9.545 12.427V4.573L15.818 8.5 9.545 12.427Z"/>
    </svg>
  </span>
  <span>subscribe on youtube</span>
</a>
<button 
  type="button" 
  onclick={onInfoClick}
  class="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 transition-all duration-200 hover:bg-white/20 hover:text-white/95 hover:border-white/40" 
  title="About this project" 
  aria-label="About this project"
>
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16v-4"/>
    <path d="M12 8h.01"/>
  </svg>
</button>
