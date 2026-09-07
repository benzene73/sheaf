# Ten-minute viability trial

One remote combobox in a native dialog. This is a behavioral adaptation experiment,
not a Base UI port or parity claim. Reference: Base UI commit
4d92faa1a4da6a5fe66a6194401470974fc2f8fe, ComboboxRoot tests and keyboard model.

Browser owns query text, open state, active option and monotonically increasing
request generation. Server owns rendered results and accepted form value.
Changing/clearing/dismissing invalidates old options immediately. Server results
carry generation; both server and browser reject obsolete generations.
No optimistic accepted-value mutation: rejection leaves canonical value unchanged.
Native dialog supplies modality. LiveView owns all result DOM; hook changes only
transient accessibility/visibility attributes and reasserts them after patches.

Intentional limits: no React API compatibility, multiple selection, animations,
positioning port, IME policy, full form recovery, reconnection or cross-browser
certification. Escape keeps typed query in this trial (unlike upstream reset cases).
Reference scenarios require new LiveView tests; upstream tests cannot run unchanged.

Gate: six real LiveView browser checks; independent review; stop after ten minutes.
