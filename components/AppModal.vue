<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

const emit = defineEmits<{
  close: [];
}>();

defineProps<{
  label: string;
}>();

const dialog = ref<HTMLElement | null>(null);
let previouslyFocused: HTMLElement | null = null;
let inertElements: Array<{
  element: HTMLElement;
  wasInert: boolean;
  wasAriaHidden: string | null;
}> = [];

function focusableElements(): HTMLElement[] {
  if (!dialog.value) return [];

  return Array.from(
    dialog.value.querySelectorAll<HTMLElement>(
      'a[href], button, input, textarea, select, [tabindex], [contenteditable="true"]',
    ),
  ).filter(
    (element) =>
      !element.hasAttribute('hidden') &&
      !element.matches(':disabled') &&
      element.tabIndex >= 0 &&
      element.getClientRects().length > 0 &&
      !element.closest('[inert], [aria-hidden="true"]'),
  );
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    emit('close');
    return;
  }

  if (event.key !== 'Tab') return;

  const elements = focusableElements();
  if (!elements.length) {
    event.preventDefault();
    dialog.value?.focus();
    return;
  }

  const first = elements[0]!;
  const last = elements[elements.length - 1]!;
  const focusIsOutside = !dialog.value?.contains(document.activeElement);

  if (event.shiftKey && (document.activeElement === first || focusIsOutside)) {
    event.preventDefault();
    last.focus();
  } else if (
    !event.shiftKey &&
    (document.activeElement === last || focusIsOutside)
  ) {
    event.preventDefault();
    first.focus();
  }
}

onMounted(async () => {
  previouslyFocused =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  document.addEventListener('keydown', onKeydown, true);
  document.addEventListener('focusin', keepFocusInside, true);
  const backdrop = dialog.value?.parentElement;
  if (backdrop?.parentElement) {
    inertElements = Array.from(backdrop.parentElement.children)
      .filter(
        (element): element is HTMLElement =>
          element instanceof HTMLElement && element !== backdrop,
      )
      .map((element) => {
        const state = {
          element,
          wasInert: element.inert,
          wasAriaHidden: element.getAttribute('aria-hidden'),
        };
        element.inert = true;
        element.setAttribute('aria-hidden', 'true');
        return state;
      });
  }
  await nextTick();
  (focusableElements()[0] ?? dialog.value)?.focus();
});

function keepFocusInside(event: FocusEvent): void {
  if (event.target instanceof Node && dialog.value?.contains(event.target))
    return;
  (focusableElements()[0] ?? dialog.value)?.focus();
}

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown, true);
  document.removeEventListener('focusin', keepFocusInside, true);
  for (const state of inertElements) {
    state.element.inert = state.wasInert;
    if (state.wasAriaHidden === null)
      state.element.removeAttribute('aria-hidden');
    else state.element.setAttribute('aria-hidden', state.wasAriaHidden);
  }

  nextTick().then(() => {
    if (
      previouslyFocused?.isConnected &&
      !previouslyFocused.closest('[inert]')
    ) {
      previouslyFocused.focus();
      return;
    }

    document.querySelector<HTMLElement>('[data-page-focus]')?.focus();
  });
});
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @mousedown.self="emit('close')">
      <section
        ref="dialog"
        class="modal"
        role="dialog"
        aria-modal="true"
        :aria-label="label"
        tabindex="-1"
      >
        <slot />
      </section>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-backdrop {
  position: fixed;
  z-index: 20;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgb(26 28 31 / 34%);
  backdrop-filter: blur(3px);
}

.modal {
  width: min(100%, 440px);
  padding: 28px;
  border: 1px solid rgb(255 255 255 / 68%);
  border-radius: 18px;
  background: var(--surface);
  box-shadow: 0 24px 80px rgb(20 24 30 / 18%);
  outline: none;
}
</style>
