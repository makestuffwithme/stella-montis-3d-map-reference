<script lang="ts">
  import { onMount } from 'svelte'
  import { initApp } from '../main'
  import InfoModal from '../components/InfoModal.svelte'
  import ControlsCard from '../components/ControlsCard.svelte'
  import DisclaimerCard from '../components/DisclaimerCard.svelte'

  let appContainer: HTMLDivElement
  let infoModalOpen = $state(false)
  let isMobile = $state(false)

  onMount(() => {
    isMobile = navigator.maxTouchPoints > 0
    if (appContainer) initApp(appContainer)
  })
</script>

<div class="relative w-full min-h-screen">
  <div id="app" bind:this={appContainer} class="absolute inset-0 z-10"></div>

  <InfoModal open={infoModalOpen} onClose={() => (infoModalOpen = false)} />
  <ControlsCard {isMobile} onInfoClick={() => (infoModalOpen = true)} />
  <DisclaimerCard />
</div>
