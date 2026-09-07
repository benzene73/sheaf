/**
 * Translation of Base UI packages/utils/src/useScrollLock.ts and anchored lock policy.
 * Pin 4d92faa1a4da6a5fe66a6194401470974fc2f8fe.
 * Copyright (c) 2019 Material-UI SAS. MIT: ../../licenses/BASE-UI-MIT.txt.
 * Per-document ownership and idempotent release are documented adapter changes.
 */
import { isOverflowElement } from '@floating-ui/utils/dom';

type BrowserWindow = Window & typeof globalThis;
function ownerDocument(reference: Element | Document): Document {
  return reference.nodeType === 9 ? reference as Document : reference.ownerDocument!;
}
function ownerWindow(reference: Element | Document): BrowserWindow {
  return ownerDocument(reference).defaultView as BrowserWindow;
}
function getPlatform(win: BrowserWindow) {
  const lowerPlatform = (win.navigator.platform ?? '').toLowerCase();
  return {
    os: { ios: /^i(os$|p)/.test(lowerPlatform) || (lowerPlatform === 'macintel' && win.navigator.maxTouchPoints > 1) },
    engine: { webkit: !!win.CSS?.supports?.('-webkit-backdrop-filter:none') },
  };
}
function createTimeout(win: BrowserWindow) {
  let id: number | undefined;
  return { start(ms: number, callback: () => void) { win.clearTimeout(id); id = win.setTimeout(callback, ms); } };
}
function createAnimationFrame(win: BrowserWindow) {
  let id: number | undefined;
  return {
    request(callback: () => void) { if (id !== undefined) win.cancelAnimationFrame(id); id = win.requestAnimationFrame(callback); },
    cancel() { if (id !== undefined) win.cancelAnimationFrame(id); id = undefined; },
  };
}
function addEventListener(win: BrowserWindow, type: string, callback: () => void) {
  win.addEventListener(type, callback);
  return () => win.removeEventListener(type, callback);
}

// The viewport's overflow comes from <html> when it establishes its own scroll container, and
// propagates from <body> otherwise. An `overflow` style on the other element doesn't lock the page.
function getViewportScroller(html: HTMLElement, body: HTMLElement) {
  return isOverflowElement(html) ? html : body;
}

function isPageScrollLocked(win: typeof window, html: HTMLElement, body: HTMLElement) {
  return /hidden|clip/.test(win.getComputedStyle(getViewportScroller(html, body)).overflowY);
}

function hasInsetScrollbars(referenceElement: Element | Document) {
  const doc = ownerDocument(referenceElement);
  const win = ownerWindow(doc);
  return win.innerWidth - doc.documentElement.clientWidth > 0;
}

function supportsStableScrollbarGutter(referenceElement: Element | Document) {
  const css = ownerWindow(ownerDocument(referenceElement)).CSS;
  const supported = !!css?.supports?.('scrollbar-gutter', 'stable');

  if (!supported) {
    return false;
  }

  const doc = ownerDocument(referenceElement);
  const html = doc.documentElement;
  const body = doc.body;

  const scrollContainer = getViewportScroller(html, body);

  const originalScrollContainerOverflowY = scrollContainer.style.overflowY;
  const originalHtmlStyleGutter = html.style.scrollbarGutter;

  html.style.scrollbarGutter = 'stable';

  scrollContainer.style.overflowY = 'scroll';
  const before = scrollContainer.offsetWidth;

  scrollContainer.style.overflowY = 'hidden';
  const after = scrollContainer.offsetWidth;

  scrollContainer.style.overflowY = originalScrollContainerOverflowY;
  html.style.scrollbarGutter = originalHtmlStyleGutter;

  return before === after;
}

function preventScrollOverlayScrollbars(referenceElement: Element | Document) {
  const doc = ownerDocument(referenceElement);
  const html = doc.documentElement;
  const body = doc.body;

  // If an `overflow` style is present on <html>, we need to lock it, because a lock on <body>
  // won't have any effect.
  // But if <body> has an `overflow` style (like `overflow-x: hidden`), we need to lock it
  // instead, as sticky elements shift otherwise.
  const elementToLock = getViewportScroller(html, body);
  const originalElementToLockStyles = {
    overflowY: elementToLock.style.overflowY,
    overflowX: elementToLock.style.overflowX,
  };

  Object.assign(elementToLock.style, {
    overflowY: 'hidden',
    overflowX: 'hidden',
  });

  return () => {
    Object.assign(elementToLock.style, originalElementToLockStyles);
  };
}

function preventScrollInsetScrollbars(referenceElement: Element | Document) {
  const doc = ownerDocument(referenceElement);
  const html = doc.documentElement;
  const body = doc.body;
  const win = ownerWindow(html);

  let scrollTop = 0;
  let scrollLeft = 0;
  let updateGutterOnly = false;
  const resizeFrame = createAnimationFrame(win);
  const platform = getPlatform(win);
  let originalHtmlStyles: Partial<CSSStyleDeclaration> = {};
  let originalBodyStyles: Partial<CSSStyleDeclaration> = {};
  let originalHtmlScrollBehavior = '';

  // Pinch-zoom in Safari causes a shift. Just don't lock scroll if there's any pinch-zoom.
  if (platform.engine.webkit && (win.visualViewport?.scale ?? 1) !== 1) {
    return () => {};
  }

  function lockScroll() {
    /* DOM reads: */

    const htmlStyles = win.getComputedStyle(html);
    const bodyStyles = win.getComputedStyle(body);
    const htmlScrollbarGutterValue = htmlStyles.scrollbarGutter || '';
    const hasBothEdges = htmlScrollbarGutterValue.includes('both-edges');
    const scrollbarGutterValue = hasBothEdges ? 'stable both-edges' : 'stable';

    scrollTop = html.scrollTop;
    scrollLeft = html.scrollLeft;

    originalHtmlStyles = {
      scrollbarGutter: html.style.scrollbarGutter,
      overflowY: html.style.overflowY,
      overflowX: html.style.overflowX,
    };
    originalHtmlScrollBehavior = html.style.scrollBehavior;

    originalBodyStyles = {
      position: body.style.position,
      height: body.style.height,
      width: body.style.width,
      boxSizing: body.style.boxSizing,
      overflowY: body.style.overflowY,
      overflowX: body.style.overflowX,
      scrollBehavior: body.style.scrollBehavior,
    };

    const isScrollableY = html.scrollHeight > html.clientHeight;
    const isScrollableX = html.scrollWidth > html.clientWidth;
    const hasConstantOverflowY =
      htmlStyles.overflowY === 'scroll' || bodyStyles.overflowY === 'scroll';
    const hasConstantOverflowX =
      htmlStyles.overflowX === 'scroll' || bodyStyles.overflowX === 'scroll';

    // Values can be negative in Firefox
    const scrollbarWidth = Math.max(0, win.innerWidth - body.clientWidth);
    const scrollbarHeight = Math.max(0, win.innerHeight - body.clientHeight);

    // Avoid shift due to the default <body> margin. This does cause elements to be clipped
    // with whitespace. Warn if <body> has margins?
    const marginY = parseFloat(bodyStyles.marginTop) + parseFloat(bodyStyles.marginBottom);
    const marginX = parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight);
    const elementToLock = getViewportScroller(html, body);

    updateGutterOnly = supportsStableScrollbarGutter(referenceElement);

    /*
     * DOM writes:
     * Do not read the DOM past this point!
     */

    if (updateGutterOnly) {
      html.style.scrollbarGutter = scrollbarGutterValue;
      elementToLock.style.overflowY = 'hidden';
      elementToLock.style.overflowX = 'hidden';
      return;
    }

    Object.assign(html.style, {
      scrollbarGutter: scrollbarGutterValue,
      overflowY: 'hidden',
      overflowX: 'hidden',
    });

    if (isScrollableY || hasConstantOverflowY) {
      html.style.overflowY = 'scroll';
    }
    if (isScrollableX || hasConstantOverflowX) {
      html.style.overflowX = 'scroll';
    }

    Object.assign(body.style, {
      position: 'relative',
      height:
        marginY || scrollbarHeight ? `calc(100dvh - ${marginY + scrollbarHeight}px)` : '100dvh',
      width: marginX || scrollbarWidth ? `calc(100vw - ${marginX + scrollbarWidth}px)` : '100vw',
      boxSizing: 'border-box',
      // Assign the longhands that `cleanup` restores, so nothing is left behind.
      overflowY: 'hidden',
      overflowX: 'hidden',
      scrollBehavior: 'unset',
    });

    body.scrollTop = scrollTop;
    body.scrollLeft = scrollLeft;
    html.setAttribute('data-base-ui-scroll-locked', '');
    html.style.scrollBehavior = 'unset';
  }

  function cleanup() {
    Object.assign(html.style, originalHtmlStyles);
    Object.assign(body.style, originalBodyStyles);

    if (!updateGutterOnly) {
      html.scrollTop = scrollTop;
      html.scrollLeft = scrollLeft;
      html.removeAttribute('data-base-ui-scroll-locked');
      html.style.scrollBehavior = originalHtmlScrollBehavior;
    }
  }

  function handleResize() {
    cleanup();
    resizeFrame.request(lockScroll);
  }

  lockScroll();
  const unsubscribeResize = addEventListener(win, 'resize', handleResize);

  return () => {
    resizeFrame.cancel();
    cleanup();
    // Sometimes this cleanup can run after test teardown because it is called
    // in a `setTimeout(fn, 0)`. Guard the returned cleanup to avoid calling
    // `removeEventListener` when it is no longer available in tests.
    if (typeof win.removeEventListener === 'function') {
      unsubscribeResize();
    }
  };
}

class ScrollLocker {
  lockCount = 0;
  restore = null as (() => void) | null;
  timeoutLock: ReturnType<typeof createTimeout>;
  timeoutUnlock: ReturnType<typeof createTimeout>;

  constructor(doc: Document) {
    this.timeoutLock = createTimeout(ownerWindow(doc));
    this.timeoutUnlock = createTimeout(ownerWindow(doc));
  }

  acquire(referenceElement: Element | Document) {
    this.lockCount += 1;
    if (this.lockCount === 1 && this.restore === null) {
      this.timeoutLock.start(0, () => this.lock(referenceElement));
    }
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.release();
    };
  }

  release = () => {
    this.lockCount -= 1;
    if (this.lockCount === 0 && this.restore) {
      this.timeoutUnlock.start(0, this.unlock);
    }
  };

  private unlock = () => {
    if (this.lockCount === 0 && this.restore) {
      this.restore?.();
      this.restore = null;
    }
  };

  private lock(referenceElement: Element | Document) {
    if (this.lockCount === 0 || this.restore !== null) {
      return;
    }

    const doc = ownerDocument(referenceElement);
    const html = doc.documentElement;
    const body = doc.body;
    const win = ownerWindow(html);

    // The page is already locked, either by the site author or by a non-Base UI overlay that
    // hasn't cleaned up yet. Leave it alone and wait for the lock to clear before taking over,
    // otherwise we'd snapshot the locked state and restore it after our own lock is released.
    if (isPageScrollLocked(win, html, body)) {
      const observer = new win.MutationObserver(() => {
        if (isPageScrollLocked(win, html, body)) {
          return;
        }
        observer.disconnect();
        this.restore = null;
        this.lock(referenceElement);
      });

      // Watch every attribute: locks are applied through inline styles, classes, or attributes
      // paired with a stylesheet (`data-scroll-locked` in react-remove-scroll, for example).
      const options: MutationObserverInit = { attributes: true };

      observer.observe(html, options);
      observer.observe(body, options);

      this.restore = () => observer.disconnect();
      return;
    }

    const platform = getPlatform(win);
    const hasOverlayScrollbars = platform.os.ios || !hasInsetScrollbars(referenceElement);

    // On iOS, scroll locking does not work if the navbar is collapsed. Due to numerous
    // side effects and bugs that arise on iOS, it must be researched extensively before
    // being enabled to ensure it doesn't cause the following issues:
    // - Textboxes must scroll into view when focused, nor cause a glitchy scroll animation.
    // - The navbar must not force itself into view and cause layout shift.
    // - Scroll containers must not flicker upon closing a popup when it has an exit animation.
    this.restore = hasOverlayScrollbars
      ? preventScrollOverlayScrollbars(referenceElement)
      : preventScrollInsetScrollbars(referenceElement);
  }
}


const lockers = new WeakMap<Document, ScrollLocker>();
/** Acquires a counted document lock. Release exactly once (extra calls are harmless). */
export function acquireScrollLock(reference: Element | Document): () => void {
  const doc = ownerDocument(reference);
  let locker = lockers.get(doc);
  if (!locker) {
    locker = new ScrollLocker(doc);
    lockers.set(doc, locker);
  }
  return locker.acquire(reference);
}
/** Exact useAnchoredPopupScrollLock touch-width decision; evaluate on mount/state changes. */
export function shouldLockAnchoredPopup(enabled: boolean, touchOpen: boolean, positioner: HTMLElement | null): boolean {
  if (!enabled) return false;
  if (!touchOpen) return true;
  if (!positioner) return false;
  const viewportWidth = positioner.ownerDocument.documentElement.clientWidth;
  const popupWidth = positioner.offsetWidth;
  return viewportWidth > 0 && popupWidth > 0 && popupWidth >= viewportWidth - 20;
}
