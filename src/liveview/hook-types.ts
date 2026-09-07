/** Minimal structural LiveView API used by these adapters; no runtime dependency. */
export interface HookContext<Incoming extends object, Outgoing extends object> {
  el: HTMLElement;
  handleEvent<K extends keyof Incoming & string>(name: K, callback: (payload: Incoming[K]) => void): unknown;
  pushEvent<K extends keyof Outgoing & string>(name: K, payload: Outgoing[K]): unknown;
}

/** LiveView initializes state during mounted before invoking updates/events. */
export type HookDefinition<State, Methods, Incoming extends object = {}, Outgoing extends object = {}> =
  Methods & { mounted(): void; updated?(): void; destroyed?(): void } &
  ThisType<State & Methods & HookContext<Incoming, Outgoing>>;

/** Validate the HEEx part contract at the boundary, rather than asserting away null. */
export function requirePart<T extends HTMLElement>(root: HTMLElement, selector: string,
  ElementType: { new (...args: never[]): T }): T {
  const part = root.querySelector(selector);
  if (!(part instanceof ElementType)) throw new Error(`Missing or invalid hook part: ${selector}`);
  return part;
}
