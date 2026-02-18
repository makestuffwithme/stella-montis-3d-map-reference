<script lang="ts">
  import { onMount } from 'svelte'
  
  let hidden = $state(false)
  const disclaimerKey = 'stella-montis-disclaimer-hidden'
  
  onMount(() => {
    hidden = localStorage.getItem(disclaimerKey) === 'true'
  })
  
  function hideDisclaimer() {
    hidden = true
    localStorage.setItem(disclaimerKey, 'true')
  }
</script>

{#if !hidden}
  <div class="disclaimer-card fixed bottom-3 left-1/2 z-10 -translate-x-1/2 flex items-center gap-2 rounded-lg border border-white/10 bg-[rgba(26,26,26,0.88)] px-2 py-1 text-[10px] leading-relaxed text-white/70 backdrop-blur-sm">
    <span class="whitespace-nowrap">
      This is an unofficial fan-made project for educational purposes only. Arc Raiders and Stella Montis are the property of Embark Studios.
    </span>
    <button 
      type="button" 
      onclick={hideDisclaimer}
      class="shrink-0 cursor-pointer rounded border border-white/10 bg-white/10 px-1 py-0 text-[10px] text-white/70 transition-colors hover:bg-white/20 hover:text-white/90" 
      title="Hide disclaimer"
    >
      hide
    </button>
  </div>
{/if}
