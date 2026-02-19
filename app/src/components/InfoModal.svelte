<script lang="ts">
  let { open = false, onClose }: { open?: boolean; onClose: () => void } = $props()

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose()
    }
  }
</script>

<!-- Always in DOM for SSG/SEO; visibility toggled with .open -->
<div
  class="info-modal fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
  class:open
  onclick={handleBackdropClick}
  onkeydown={handleKeydown}
  role="dialog"
  aria-modal="true"
  aria-hidden={!open}
  tabindex="-1"
>
  <div class="info-modal-content relative mx-4 flex max-h-[90vh] max-w-2xl flex-col rounded-lg border border-white/10 bg-[rgba(26,26,26,0.95)] text-white/90 shadow-2xl">
    <div class="flex items-start justify-between px-6 pt-6 pb-3">
      <h2 class="text-2xl font-semibold text-white/95">about this project</h2>
      <button
        type="button"
        onclick={onClose}
        class="ml-4 inline-flex h-7 w-7 flex-shrink-0 cursor-pointer items-center justify-center rounded border border-white/20 bg-white/10 text-lg leading-none text-white/70 transition-colors duration-150 hover:bg-white/20 hover:text-white/95"
        title="Close"
        aria-label="Close"
      >
        ×
      </button>
    </div>
    <div class="overflow-y-auto px-6 pb-6">
      <div class="space-y-2 text-sm leading-relaxed">
        <p>i think stella montis is a gatdamn masterpiece. the first few dozen times i played it, i struggled to understand the 2D maps. i looked for a 3D map and i couldn't find one, so i decided to make it.</p>
        <p>there's ziplines, ladders, extracts, hatches, and all the passageways between each area. but it's still super simplified and is missing lots of things like breach doors, battery doors, windows, boxes, and just a bunch of detail in general.</p>
        <p>my hope is that this helps you create a mental model of the map faster than i did by just running around in-game.</p>
      </div>
      <h2 class="my-3 text-2xl font-semibold text-white/95">about me</h2>
      <div class="space-y-2 text-sm leading-relaxed">
        <p>i like to make lil tools like this and then create engineering video tutorials to show how they were made. i'm thinking about making one for this, which would be some blender tips, three.js basics, how to deploy to github pages, and moving the 3D model to a CDN.</p>
        <p>if that sounds like something you'd be interested in, consider <a href="https://www.youtube.com/@make_stuff_with_me?sub_confirmation=1" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-600 transition-colors duration-150">subscribing on youtube</a> to know when it comes out. the source code is also all available on <a href="https://github.com/makestuffwithme/stella-montis-3d-map-reference" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-600 transition-colors duration-150">github</a>.</p>
        <p>thanks for stopping by raider o7</p>
      </div>
    </div>
  </div>
</div>

<style>
  .info-modal {
    visibility: hidden;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease, visibility 0.2s ease;
  }
  .info-modal.open {
    visibility: visible;
    pointer-events: auto;
    opacity: 1;
  }
</style>
