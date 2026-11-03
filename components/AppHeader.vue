<template>
  <header class="app-header">
    <NuxtLink class="brand" to="/" aria-label="Daymark — главная">
      <span class="brand__mark" aria-hidden="true">d</span>
      <span>daymark</span>
    </NuxtLink>
    <span class="app-header__caption">Заметки, которые помогают</span>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: min(100% - 48px, 1120px);
  height: 76px;
  margin: 0 auto;
  border-bottom: 1px solid var(--line);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
  font-size: 19px;
  font-weight: 720;
  letter-spacing: -0.7px;
  text-decoration: none;

  &__mark {
    display: grid;
    width: 30px;
    height: 30px;
    place-items: center;
    border-radius: 9px;
    background: var(--accent);
    color: var(--surface);
    font-size: 19px;
    font-weight: 700;
  }
}

.app-header__caption {
  color: var(--muted);
  font-size: 13px;
}

@media (max-width: 560px) {
  .app-header {
    width: min(100% - 32px, 1120px);
    height: 64px;
  }

  .app-header__caption {
    display: none;
  }
}
</style>
