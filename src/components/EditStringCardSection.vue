<template>
  <q-card-section :class="classObject">
    {{ displayText || text || emptyText || '' }}
    <q-popup-edit
      auto-save
      :model-value="text"
      @update:model-value="(value) => emit('edit', value)"
      v-slot="scope"
      :validate="validation"
      @hide="validation(text)"
    >
      <q-input
        v-model="scope.value"
        dense
        autofocus
        counter
        @keyup.enter="scope.set"
        :error="error"
        :error-message="errorMsg"
      />
    </q-popup-edit>
  </q-card-section>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, computed, ref } from 'vue';

const emit = defineEmits(['edit']);

const props = defineProps<{
  updating?: boolean;
  text: string;
  year?: boolean;
  yearMonth?: boolean;
  displayText?: string;
  emptyText?: string;
}>();

const classObject = computed(() => ({
  disabled: props.updating,
  'cursor-pointer': !props.updating,
  'cursor-not-allowed': props.updating,
}));

const error = ref(false);
const errorMsg = ref('');

function validation(value: string) {
  if (props.year && !/^\d\d\d\d$/.exec(value)) {
    error.value = true;
    errorMsg.value = 'Must have format YYYY';
    return false;
  }
  if (props.yearMonth && !/^\d\d\d\d-\d\d$/.exec(value)) {
    error.value = true;
    errorMsg.value = 'Must have format YYYY-MM';
    return false;
  }
  error.value = false;
  errorMsg.value = '';
  return true;
}
</script>
