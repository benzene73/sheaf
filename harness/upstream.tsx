import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Combobox } from '@base-ui/react/combobox';

const items = ['Apple', 'Banana', 'Cherry'];
function Fixture() {
  const params = new URLSearchParams(location.search);
  const [accepted, setAccepted] = React.useState<string | null>(params.get('defaultValue'));
  const [submits, setSubmits] = React.useState(0);
  const [valueChanges, setValueChanges] = React.useState(0);
  const loopFocus = params.get('loop') !== 'false';
  return <main data-fixture-ready="true">
    <h1>Pinned Base UI React reference</h1>
    <form onSubmit={event => { event.preventDefault(); setSubmits(count => count + 1); }}>
    <Combobox.Root items={items} value={accepted} loopFocus={loopFocus}
      readOnly={params.get('readOnly') === 'true'}
      onValueChange={(value, details) => {
        setValueChanges(count => count + 1);
        if (params.get('cancelValue') === 'true') details.cancel();
        else setAccepted(value);
      }}
      onOpenChange={(open, details) => { if (!open && params.get('cancelClose') === 'true') details.cancel(); }}>
      <Combobox.Input aria-label="Fruit" />
      <Combobox.Portal>
        <Combobox.Positioner>
          <Combobox.Popup>
            <Combobox.List>
              {(item: string) => <Combobox.Item key={item} value={item} disabled={item === 'Banana'}>{item}</Combobox.Item>}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
    <button type="submit">Submit</button>
    </form>
    <output data-testid="accepted-value">{accepted || ''}</output>
    <output data-testid="submit-count">{submits}</output>
    <output data-testid="value-change-count">{valueChanges}</output>
    <button type="button">Outside</button>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
