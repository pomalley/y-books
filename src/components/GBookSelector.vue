<template>
  <q-dialog
    ref="dialogRef"
    :model-value="modelValue"
    @update:model-value="(value) => emit('update:modelValue', value)"
  >
  </q-dialog>
</template>

<script setup lang="ts">
import { Book } from './models';

defineProps<{
  modelValue: boolean;
  books: Book[];
}>();

const emit = defineEmits(['update:modelValue']);
</script>
