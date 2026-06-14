import {createSignal, For, JSX, onCleanup, Show} from 'solid-js';
import {CountryRow, filterCountries} from '../data/countries';
import styles from './CountrySelect.module.css';

/**
 * Country picker (port of tweb's countryInputField.ts). A text field whose label
 * floats up; focusing it drops down a scrollable, filterable list of
 * flag + name + dial-code rows. The chevron rotates and the list slides/fades in.
 */
export default function CountrySelect(props: {
  /** Display value of the selected country (controlled by the parent). */
  value: string;
  /** User picked a row from the list. */
  onSelect: (row: CountryRow) => void;
  /** Optional: parent wants to know the field was cleared/typed into. */
  onInput?: (value: string) => void;
}): JSX.Element {
  const [open, setOpen] = createSignal(false);
  const [query, setQuery] = createSignal<string | null>(null); // null = show props.value
  let inputEl!: HTMLInputElement;
  let containerEl!: HTMLDivElement;

  // While typing, filter by the query; otherwise show the full list.
  const rows = () => filterCountries(query() ?? '');

  const displayValue = () => (query() === null ? props.value : query()!);

  function openPicker() {
    setOpen(true);
    setQuery('');
    queueMicrotask(() => inputEl?.select());
    document.addEventListener('mousedown', onDocMouseDown, {capture: true});
  }

  function closePicker() {
    setOpen(false);
    setQuery(null);
    document.removeEventListener('mousedown', onDocMouseDown, {capture: true});
  }

  function onDocMouseDown(e: MouseEvent) {
    if(containerEl.contains(e.target as Node)) return;
    closePicker();
  }

  function pick(row: CountryRow) {
    props.onSelect(row);
    closePicker();
  }

  function onKeyDown(e: KeyboardEvent) {
    if(e.key === 'Enter') {
      const r = rows();
      if(r.length >= 1) {
        e.preventDefault();
        pick(r[0]);
      }
    } else if(e.key === 'Escape') {
      closePicker();
      inputEl.blur();
    }
  }

  onCleanup(() => document.removeEventListener('mousedown', onDocMouseDown, {capture: true}));

  return (
    <div ref={containerEl} class={styles.container} classList={{[styles.open]: open()}}>
      <div class="input-field">
        <input
          ref={inputEl}
          class="input-field-input"
          type="text"
          autocomplete="off"
          value={displayValue()}
          placeholder=" "
          onFocus={openPicker}
          onInput={(e) => {
            setQuery(e.currentTarget.value);
            props.onInput?.(e.currentTarget.value);
          }}
          onKeyDown={onKeyDown}
        />
        <label>Country</label>
        <span
          class={styles.arrow}
          onMouseDown={(e) => {
            e.preventDefault();
            if(open()) {
              closePicker();
              inputEl.blur();
            } else {
              inputEl.focus();
            }
          }}
        />
      </div>

      <Show when={open()}>
        <div class={styles.dropdown}>
          <ul class={styles.list}>
            <For each={rows()}>
              {(row) => (
                <li class={styles.item} onMouseDown={(e) => {e.preventDefault(); pick(row);}}>
                  <span class={styles.flag}>{row.emoji}</span>
                  <span class={styles.name}>{row.country.default_name}</span>
                  <span class={styles.code}>+{row.code.country_code}</span>
                </li>
              )}
            </For>
            <Show when={rows().length === 0}>
              <li class={styles.empty}>No countries found</li>
            </Show>
          </ul>
        </div>
      </Show>
    </div>
  );
}
