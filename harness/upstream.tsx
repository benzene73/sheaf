import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Combobox } from '@base-ui/react/combobox';

const items = ['Apple', 'Banana', 'Cherry'];
function Fixture() {
  const [accepted, setAccepted] = React.useState<string | null>(null);
  const loopFocus = new URLSearchParams(location.search).get('loop') !== 'false';
  return <main data-fixture-ready="true">
    <h1>Pinned Base UI React reference</h1>
    <Combobox.Root items={items} value={accepted} onValueChange={setAccepted} loopFocus={loopFocus}>
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
    <output data-testid="accepted-value">{accepted || ''}</output>
    <button>Outside</button>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
