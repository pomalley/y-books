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
        <q-card-section vertical class="col-4">
          <q-img :src="modelValue.book.imageUrl" fit="scale-down" />
        </q-card-section>
        <q-card-section class="col-8">
          <edit-string-card-section
            :updating="updating[ColumnName.TITLE]"
            :text="modelValue.book.title || ''"
            @edit="(value) => updateText(ColumnName.TITLE, value)"
            empty-text="[no title]"
          />
          <edit-string-card-section
            :updating="updating[ColumnName.AUTHORS]"
            :text="modelValue.book.authors || ''"
            @edit="(value) => updateText(ColumnName.AUTHORS, value)"
            empty-text="[no authors]"
          />
          <edit-string-card-section
            year
            :updating="updating[ColumnName.YEAR]"
            :text="String(modelValue.book.year)"
            @edit="(value) => updateText(ColumnName.YEAR, value)"
            empty-text="[no year]"
          />
          <edit-string-card-section
            :updating="updating[ColumnName.GENRES]"
            :text="modelValue.book.genres || ''"
            @edit="(value) => updateText(ColumnName.GENRES, value)"
            empty-text="no genres"
          />
          <edit-string-card-section
            year-month
            :updating="updating[ColumnName.DATE_READ]"
            :text="modelValue.book.dateRead || ''"
            @edit="(value) => updateText(ColumnName.DATE_READ, value)"
            :display-text="formattedDateRead()"
            empty-text="[no date read]"
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
              :name="iconName(colName, modelValue.book)"
              size="md"
              @click="iconClick(colName)"
              class="q-px-sm cursor-pointer"
              :class="{ disabled: updating[colName] }"
            >
              <q-tooltip class="text-body2">{{
                iconTooltip(colName, modelValue.book)
              }}</q-tooltip>
            </q-icon>
          </q-card-section>
          <q-separator inset />
          <edit-string-card-section
            :updating="updating[ColumnName.COMMENTS]"
            :text="modelValue.book.comments || ''"
            @edit="(value) => updateText(ColumnName.COMMENTS, value)"
            empty-text="[no comment]"
          />
        </q-card-section>
      </q-card-section>
      <q-card-actions align="center">
        <q-btn
          v-if="modelValue.book.googleBooksId"
          color="primary"
          :href="googleBooksLink(modelValue.book.googleBooksId)"
          target="_blank"
        >
          Google Books
        </q-btn>
        <q-btn
          color="secondary"
          :disable="!modelValue.book.authors && !modelValue.book.title"
          @click="searchAgain"
          >Search Again</q-btn
        >
      </q-card-actions>
      <q-card-section horizontal>
        <q-card-section class="col-6 q-pa-none text-center text-caption">
          Created: {{ displayTimestamp(modelValue.book.createdTimestamp) }}
        </q-card-section>
        <q-card-section class="col-6 q-pa-none text-center text-caption">
          Updated: {{ displayTimestamp(modelValue.book.updatedTimestamp) }}
        </q-card-section>
      </q-card-section>
      <q-card-actions align="center">
        <q-btn v-close-popup color="primary" label="OK" />
        <q-btn
          color="warning"
          :label="modelValue.book.hidden ? 'Unhide' : 'Hide'"
          @click="hide"
        />
      </q-card-actions>
    </q-card>
    <g-book-selector
      v-model="gBookSelectorActive"
      :books="gBookResults"
      @select-book="selectGoogleBook"
    />
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { BookCardModel, ColumnName, Book } from 'components/models';
import { iconName, iconTooltip } from './icons';
import EditStringCardSection from 'components/EditStringCardSection.vue';
import { googleBooksLink, fetchGoogleBooksJson } from './googleBooks';
import { useQuasar } from 'quasar';
import GBookSelector from './GBookSelector.vue';

const $q = useQuasar();

const props = defineProps<{
  sheetId: string;
  modelValue: BookCardModel;
}>();

const updating: Record<string, boolean> = reactive({});
const gBookSelectorActive = ref(false);
const gBookResults = ref<Book[]>([]);

const emit = defineEmits(['update:modelValue']);

function hide() {
  const hidden = Boolean(props.modelValue.book.hidden);
  $q.dialog({
    message: `${hidden ? 'Unhide (undelete)' : 'Hide (delete)'} this book?`,
    ok: true,
    cancel: true,
  }).onOk(() => {
    if (props.modelValue.book.row) {
      updateCell(
        props.modelValue.book.row,
        ColumnName.HIDDEN,
        hidden ? 'FALSE' : 'TRUE'
      );
    }
    emit('update:modelValue', { active: false, book: props.modelValue.book });
  });
}

async function searchAgain() {
  try {
    const result = await fetchGoogleBooksJson(
      props.modelValue.book.title,
      props.modelValue.book.authors
    );
    if (!result || result.length == 0) {
      $q.notify({
        message: 'No books found',
        position: 'center',
        closeBtn: true,
      });
      return;
    }
    gBookResults.value = result;
    gBookSelectorActive.value = true;
  } catch (error) {
    console.log(error);
  }
}

function selectGoogleBook(newBook: Book) {
  props.modelValue.book.mergeFrom(newBook);
  gBookSelectorActive.value = false;
}

function updateText(col: ColumnName, value: string) {
  if (!props.modelValue.book.row) return;
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
      () => {
        const newModel = { ...props.modelValue };
        newModel.book.update(col, value);
        emit('update:modelValue', newModel);
        updating[col] = false;
        // set updated timestamp as well (but only once).
        if (col != ColumnName.UPDATED_TIMESTAMP) {
          updateCell(
            row,
            ColumnName.UPDATED_TIMESTAMP,
            String(Math.round(Date.now() / 1000))
          );
        }
      },
      (response) => {
        console.log('Update failed: ', response);
        updating[col] = false;
      }
    );
}

function iconClick(type: ColumnName) {
  if (!props.modelValue.book.row) return;
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

function displayTimestamp(timestamp?: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function formattedDateRead(): string {
  if (!props.modelValue.book.dateRead) {
    return '';
  }
  const regex = /(\d\d\d\d)-(\d\d)/;
  const matches = regex.exec(props.modelValue.book.dateRead);
  if (!matches || matches.length < 3) {
    return '';
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
