<template>
  <!-- notice dialogRef here -->
  <q-dialog
    ref="dialogRef"
    @hide="yeah('hide')"
    :model-value="modelValue.active"
    @update:model-value="
      (value) =>
        emit('update:modelValue', { active: value, book: modelValue.book })
    "
  >
    <q-card class="q-dialog-plugin">
      <q-card-section horizontal>
        <q-img
          :src="modelValue.book?.imageUrl"
          fit="scale-down"
          class="col-4"
        />
        <q-card-section class="col-8">
          <q-card-section>{{ modelValue.book?.title }}</q-card-section>
          <q-card-section>{{ modelValue.book?.authors }}</q-card-section>
          <q-card-section>{{ modelValue.book?.year }}</q-card-section>
          <q-card-section>{{ modelValue.book?.genres }}</q-card-section>
          <q-card-section>{{ formattedDateRead() }}</q-card-section>
          <q-card-section>
            <q-icon :name="iconName(IconType.READ)" size="md">
              <q-tooltip class="text-body2">{{
                iconText(IconType.READ)
              }}</q-tooltip>
            </q-icon>
            <q-icon name="none" />
            <q-icon :name="iconName(IconType.WANT_TO_READ)" size="md">
              <q-tooltip class="text-body2">{{
                iconText(IconType.WANT_TO_READ)
              }}</q-tooltip>
            </q-icon>
            <q-icon name="none" />
            <q-icon :name="iconName(IconType.OWNED)" size="md">
              <q-tooltip class="text-body2">{{
                iconText(IconType.OWNED)
              }}</q-tooltip>
            </q-icon>
            <q-icon name="none" />
            <q-icon :name="iconName(IconType.WANT_TO_OWN)" size="md">
              <q-tooltip class="text-body2">{{
                iconText(IconType.WANT_TO_OWN)
              }}</q-tooltip>
            </q-icon>
            <q-icon name="none" />
          </q-card-section>
          <q-separator inset />
          <q-card-section>
            {{ modelValue.book?.comments }}
          </q-card-section>
        </q-card-section>
      </q-card-section>
      <!-- <q-card-actions align="right">
        <q-btn v-close-popup color="primary" label="OK" @click="yeah('ok')" />
      </q-card-actions> -->
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { defineEmits } from 'vue';
import { BookCardModel } from 'components/models';

enum IconType {
  READ,
  WANT_TO_READ,
  OWNED,
  WANT_TO_OWN,
}

const props = defineProps<{
  // book: Book;
  modelValue: BookCardModel;
}>();

const emit = defineEmits(['update:modelValue']);

function yeah(msg: string) {
  console.log(msg);
}

function iconName(type: IconType): string {
  switch (type) {
    case IconType.READ:
      return props.modelValue.book?.read ? 'fas fa-check' : 'la la-times';
    case IconType.WANT_TO_READ:
      return props.modelValue.book?.wantToRead
        ? 'fas fa-book-open'
        : 'la la-book-open';
    case IconType.OWNED:
      return props.modelValue.book?.owned
        ? 'fas fa-book-medical'
        : 'la la-book-medical';
    case IconType.WANT_TO_OWN:
      return props.modelValue.book?.wantToOwn ? 'fas fa-coins' : 'la la-coins';
    default:
      return 'none';
  }
}

function iconText(type: IconType): string {
  switch (type) {
    case IconType.READ:
      return props.modelValue.book?.read ? 'Read' : 'Not Read';
    case IconType.WANT_TO_READ:
      return props.modelValue.book?.wantToRead
        ? 'Want to Read'
        : 'Do Not Want to Read';
    case IconType.OWNED:
      return props.modelValue.book?.owned ? 'Owned' : 'Not Owned';
    case IconType.WANT_TO_OWN:
      return props.modelValue.book?.wantToOwn
        ? 'Want to Own'
        : 'Do Not Want To Own';
    default:
      return 'Uh Oh!';
  }
}

function formattedDateRead(): string {
  if (!props.modelValue.book?.dateRead) {
    return 'no date';
  }
  const regex = /(\d\d\d\d)-(\d\d)/;
  const matches = regex.exec(props.modelValue.book.dateRead);
  if (!matches || matches.length < 3) {
    return 'No read date';
  }
  return `Read ${numToMonth(+matches[2])} ${matches[1]}`;
}

function numToMonth(num: number): string {
  switch (num) {
    case 1:
      return 'Jan';
    case 2:
      return 'Feb';
    case 3:
      return 'Mar';
    case 4:
      return 'Apr';
    case 5:
      return 'May';
    case 6:
      return 'Jun';
    case 7:
      return 'Jul';
    case 8:
      return 'Aug';
    case 9:
      return 'Sep';
    case 10:
      return 'Oct';
    case 11:
      return 'Nov';
    case 12:
      return 'Dec';
    default:
      return '';
  }
}
</script>
