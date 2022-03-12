<template>
  <!-- notice dialogRef here -->
  <q-dialog
    ref="dialogRef"
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
          <edit-string-card-section
            :updating="updating[ColumnName.TITLE]"
            :text="modelValue.book?.title || ''"
            @edit="(value) => updateText(ColumnName.TITLE, value)"
          />
          <edit-string-card-section
            :updating="updating[ColumnName.AUTHORS]"
            :text="modelValue.book?.authors || ''"
            @edit="(value) => updateText(ColumnName.AUTHORS, value)"
          />
          <edit-string-card-section
            year
            :updating="updating[ColumnName.YEAR]"
            :text="String(modelValue.book?.year)"
            @edit="(value) => updateText(ColumnName.YEAR, value)"
          />
          <edit-string-card-section
            :updating="updating[ColumnName.GENRES]"
            :text="modelValue.book?.genres || ''"
            @edit="(value) => updateText(ColumnName.GENRES, value)"
          />
          <edit-string-card-section
            year-month
            :updating="updating[ColumnName.DATE_READ]"
            :text="modelValue.book?.dateRead || ''"
            @edit="(value) => updateText(ColumnName.DATE_READ, value)"
            :display-text="formattedDateRead()"
          />
          <q-card-section>
            <q-icon
              v-for="colName in [
                ColumnName.READ,
                ColumnName.WANT_TO_READ,
                ColumnName.OWNED,
                ColumnName.WANT_TO_OWN,
              ]"
              :key="colName"
              :name="iconName(colName)"
              size="md"
              @click="iconClick(colName)"
              class="q-px-sm cursor-pointer"
              :class="{ disabled: updating[colName] }"
            >
              <q-tooltip class="text-body2">{{ iconText(colName) }}</q-tooltip>
            </q-icon>
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
import { defineEmits, reactive } from 'vue';
import { BookCardModel, ColumnName } from 'components/models';
import EditStringCardSection from 'components/EditStringCardSection.vue';

const props = defineProps<{
  sheetId: string;
  modelValue: BookCardModel;
}>();

const updating: Record<string, boolean> = reactive({});

const emit = defineEmits(['update:modelValue']);

function updateText(col: ColumnName, value: string) {
  if (!props.modelValue.book?.row) return;
  updateCell(props.modelValue.book.row, col, value);
}

function updateCell(row: number, col: ColumnName, value: string) {
  updating[col] = true;
  gapi.client.sheets.spreadsheets.values
    .update({
      spreadsheetId: props.sheetId,
      range: `${String(col)}${row}`,
      resource: { values: [[value]] },
      valueInputOption: 'USER_ENTERED',
    })
    .then(
      (response) => {
        const newModel = { ...props.modelValue };
        newModel.book?.update(col, value);
        emit('update:modelValue', newModel);
        console.log('Update successful: ', response);
        updating[col] = false;
      },
      (response) => {
        console.log('Update failed: ', response);
        updating[col] = false;
      }
    );
}

function iconClick(type: ColumnName) {
  if (!props.modelValue.book?.row) return;
  let newValue = '';
  switch (type) {
    case ColumnName.READ:
      newValue = props.modelValue.book.read ? 'FALSE' : 'TRUE';
      break;
    case ColumnName.WANT_TO_READ:
      newValue = props.modelValue.book.wantToRead ? 'FALSE' : 'TRUE';
      break;
    case ColumnName.OWNED:
      newValue = props.modelValue.book.owned ? 'FALSE' : 'TRUE';
      break;
    case ColumnName.WANT_TO_OWN:
      newValue = props.modelValue.book.wantToOwn ? 'FALSE' : 'TRUE';
      break;
    default:
      console.log('Bad iconClick arg: ', type);
      return;
  }
  updating[type] = true;
  updateCell(props.modelValue.book.row, type, newValue);
}

function iconName(type: ColumnName): string {
  switch (type) {
    case ColumnName.READ:
      return props.modelValue.book?.read ? 'fas fa-check' : 'la la-times';
    case ColumnName.WANT_TO_READ:
      return props.modelValue.book?.wantToRead
        ? 'fas fa-book-open'
        : 'la la-book-open';
    case ColumnName.OWNED:
      return props.modelValue.book?.owned
        ? 'fas fa-book-medical'
        : 'la la-book-medical';
    case ColumnName.WANT_TO_OWN:
      return props.modelValue.book?.wantToOwn ? 'fas fa-coins' : 'la la-coins';
    default:
      return 'none';
  }
}

function iconText(type: ColumnName): string {
  switch (type) {
    case ColumnName.READ:
      return props.modelValue.book?.read ? 'Read' : 'Not Read';
    case ColumnName.WANT_TO_READ:
      return props.modelValue.book?.wantToRead
        ? 'Want to Read'
        : 'Do Not Want to Read';
    case ColumnName.OWNED:
      return props.modelValue.book?.owned ? 'Owned' : 'Not Owned';
    case ColumnName.WANT_TO_OWN:
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
