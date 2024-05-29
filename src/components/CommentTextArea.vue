<template>
  <q-card-section :class="classObject">
    <span v-html="md.render(displayText || text || emptyText || '')"></span>
    <q-popup-edit
      auto-save
      :model-value="text"
      @update:model-value="(value) => emit('edit', value)"
      v-slot="scope"
    >
      <q-input
        v-model="scope.value"
        type="textarea"
        autofocus
        counter
        autogrow
        @blur="scope.set"
      />
    </q-popup-edit>
  </q-card-section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import markdownit from 'markdown-it';

const md = markdownit();

const emit = defineEmits(['edit']);

const props = defineProps<{
  updating?: boolean;
  text: string;
  displayText?: string;
  emptyText?: string;
}>();

const classObject = computed(() => ({
  disabled: props.updating,
  'cursor-pointer': !props.updating,
  'cursor-not-allowed': props.updating,
}));
</script>
