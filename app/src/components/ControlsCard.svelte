<script lang="ts">
  import { onMount } from 'svelte'
  import ActionButtons from './ActionButtons.svelte'
  
  let { 
    isMobile,
    onInfoClick
  }: { 
    isMobile: boolean;
    onInfoClick: () => void
  } = $props()
  
  let minimized = $state(false)
  let invertMouse = $state(false)
  
  onMount(() => {
    invertMouse = localStorage.getItem('stella-montis-invert-mouse') === 'true'
  })
  
  function toggleMinimize() {
    minimized = !minimized
  }
  
  function handleInvertMouseChange(e: Event) {
    const target = e.target as HTMLInputElement
    invertMouse = target.checked
    localStorage.setItem('stella-montis-invert-mouse', String(invertMouse))
  }
</script>

<div 
  class="controls-card fixed top-3 left-1/2 z-10 -translate-x-1/2 rounded-lg border border-white/10 bg-[rgba(26,26,26,0.88)] px-3.5 py-2 text-xs leading-relaxed text-white/90 backdrop-blur-sm transition-[padding,min-width] duration-200"
  class:controls-card--minimized={minimized}
>
  <div class="controls-card-header flex items-center justify-between gap-4">
    <h3 class="m-0 text-[11px] font-semibold uppercase tracking-widest text-white/60">Controls</h3>
    <button 
      type="button" 
      class="controls-card-toggle inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border border-white/10 bg-white/10 text-lg font-light leading-none text-white/70 transition-colors duration-150 hover:bg-white/20 hover:text-white/95" 
      onclick={toggleMinimize}
      title={minimized ? 'Expand' : 'Minimize'}
      aria-label={minimized ? 'Expand' : 'Minimize'}
    >
      {minimized ? '+' : '−'}
    </button>
  </div>
  <div class="controls-card-body mt-2">
    {#if !isMobile}
      <ul class="m-0 list-none p-0">
        <li class="mb-1 last:mb-0">
          <kbd class="mr-1 inline-block rounded border border-white/10 bg-white/10 px-1 py-0 font-sans text-[11px]">w</kbd>
          <kbd class="mr-1 inline-block rounded border border-white/10 bg-white/10 px-1 py-0 font-sans text-[11px]">a</kbd>
          <kbd class="mr-1 inline-block rounded border border-white/10 bg-white/10 px-1 py-0 font-sans text-[11px]">s</kbd>
          <kbd class="mr-1 inline-block rounded border border-white/10 bg-white/10 px-1 py-0 font-sans text-[11px]">d</kbd> move
        </li>
        <li class="mb-1 last:mb-0">
          <kbd class="mr-1 inline-block rounded border border-white/10 bg-white/10 px-1 py-0 font-sans text-[11px]">space</kbd> up 
          <kbd class="mr-1 inline-block rounded border border-white/10 bg-white/10 px-1 py-0 font-sans text-[11px]">c</kbd> down
        </li>
        <li class="mb-1 last:mb-0">
          <kbd class="mr-1 inline-block rounded border border-white/10 bg-white/10 px-1 py-0 font-sans text-[11px]">shift</kbd> sprint
        </li>
        <li class="mb-1 last:mb-0">
          <kbd class="mr-1 inline-block rounded border border-white/10 bg-white/10 px-1 py-0 font-sans text-[11px]">left click</kbd> toggle mouselook
        </li>
        <li class="mb-1 last:mb-0">
          <label class="controls-option inline-flex cursor-pointer items-center gap-1.5">
            <input 
              type="checkbox" 
              bind:checked={invertMouse}
              onchange={handleInvertMouseChange}
              class="cursor-pointer" 
            />
            <span>invert mouselook</span>
          </label>
        </li>
        <li class="mb-0 mt-2 flex justify-center items-center gap-2">
          <ActionButtons {onInfoClick} />
        </li>
      </ul>
    {:else}
      <ul class="m-0 list-none p-0">
        <li class="mb-1 last:mb-0">one finger to rotate</li>
        <li class="mb-1 last:mb-0">two fingers to pan</li>
        <li class="mb-1 last:mb-0">pinch to zoom</li>
        <li class="mb-0 mt-2 flex justify-center items-center gap-2">
          <ActionButtons {onInfoClick} />
        </li>
      </ul>
    {/if}
  </div>
</div>
