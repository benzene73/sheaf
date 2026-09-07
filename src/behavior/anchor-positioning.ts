/**
 * Bounded translation of Base UI useAnchorPositioning.ts middleware assembly.
 * Pin 4d92faa1a4da6a5fe66a6194401470974fc2f8fe.
 * Copyright (c) 2019 Material-UI SAS. MIT: ../../licenses/BASE-UI-MIT.txt.
 * React mount/ref scheduling replaced by explicitly owned DOM lifecycle below.
 */
import {
  autoUpdate, computePosition, flip, limitShift, offset, shift, size,
  type Boundary, type Middleware, type MiddlewareState, type Padding,
  type Placement, type RootBoundary, type Strategy, type VirtualElement,
} from '@floating-ui/dom';

export type Side = 'top' | 'right' | 'bottom' | 'left' | 'inline-start' | 'inline-end';
export type Align = 'start' | 'center' | 'end';
type PhysicalSide = 'top' | 'right' | 'bottom' | 'left';
export type OffsetFunction = (data: {
  side: Side; align: Align;
  anchor: { width: number; height: number };
  positioner: { width: number; height: number };
}) => number;
export interface AnchorPositioningParameters {
  side?: Side;
  align?: Align;
  sideOffset?: number | OffsetFunction;
  alignOffset?: number | OffsetFunction;
  positionMethod?: Strategy;
  direction?: 'ltr' | 'rtl';
  collisionBoundary?: Boundary | 'clipping-ancestors';
  collisionPadding?: Padding;
  collisionAvoidance?: {
    side?: 'flip' | 'shift' | 'none';
    align?: 'flip' | 'shift' | 'none';
    fallbackAxisSide?: 'start' | 'end' | 'none';
  };
  sticky?: boolean;
  shift?: { crossAxis?: boolean; rootBoundary?: RootBoundary };
  disableAnchorTracking?: boolean;
  isMounted?: () => boolean;
}

export function getLogicalSide(sideParam: Side, renderedSide: PhysicalSide, isRtl: boolean): Side {
  const isLogicalSideParam = sideParam === 'inline-start' || sideParam === 'inline-end';
  const logicalRight = isRtl ? 'inline-start' : 'inline-end';
  const logicalLeft = isRtl ? 'inline-end' : 'inline-start';
  return ({ top: 'top', right: isLogicalSideParam ? logicalRight : 'right',
    bottom: 'bottom', left: isLogicalSideParam ? logicalLeft : 'left' } as const)[renderedSide];
}

function getOffsetData(state: MiddlewareState, sideParam: Side, isRtl: boolean) {
  const [renderedSide, alignment] = state.placement.split('-');
  return {
    side: getLogicalSide(sideParam, renderedSide as PhysicalSide, isRtl),
    align: (alignment || 'center') as Align,
    anchor: { width: state.rects.reference.width, height: state.rects.reference.height },
    positioner: { width: state.rects.floating.width, height: state.rects.floating.height },
  };
}

/** Exact arrowless offset/collision/size branch; see mapping for omitted middleware. */
export function createAnchorPositioningOptions(params: AnchorPositioningParameters = {}) {
  const {
    positionMethod = 'absolute', side: sideParam = 'bottom', sideOffset = 0,
    align = 'center', alignOffset = 0, collisionBoundary,
    collisionPadding: collisionPaddingParam = 5, sticky = false,
    collisionAvoidance = {}, shift: shiftOptions,
  } = params;
  const isRtl = params.direction === 'rtl';
  const side = ({ top: 'top', right: 'right', bottom: 'bottom', left: 'left',
    'inline-end': isRtl ? 'left' : 'right', 'inline-start': isRtl ? 'right' : 'left' } as const)[sideParam];
  const placement = (align === 'center' ? side : `${side}-${align}`) as Placement;
  const collisionPadding = typeof collisionPaddingParam === 'number'
    ? { top: collisionPaddingParam, right: collisionPaddingParam, bottom: collisionPaddingParam, left: collisionPaddingParam }
    : { top: collisionPaddingParam.top || 0, right: collisionPaddingParam.right || 0,
      bottom: collisionPaddingParam.bottom || 0, left: collisionPaddingParam.left || 0 };
  const collisionAvoidanceSide = collisionAvoidance.side || 'flip';
  const collisionAvoidanceAlign = collisionAvoidance.align || 'flip';
  const collisionAvoidanceFallbackAxisSide = collisionAvoidance.fallbackAxisSide || 'end';
  const shiftCrossAxis = shiftOptions?.crossAxis ?? false;
  const commonCollisionProps = {
    boundary: collisionBoundary === 'clipping-ancestors' ? 'clippingAncestors' as const : collisionBoundary,
    padding: collisionPadding,
  };
  const middleware: Array<Middleware | null> = [offset(state => {
    const data = getOffsetData(state, sideParam, isRtl);
    const sideAxis = typeof sideOffset === 'function' ? sideOffset(data) : sideOffset;
    const alignAxis = typeof alignOffset === 'function' ? alignOffset(data) : alignOffset;
    return { mainAxis: sideAxis, crossAxis: alignAxis, alignmentAxis: alignAxis };
  })];
  const shiftDisabled = collisionAvoidanceAlign === 'none' && collisionAvoidanceSide !== 'shift';
  const crossAxisShiftEnabled = !shiftDisabled && (sticky || shiftCrossAxis || collisionAvoidanceSide === 'shift');
  // Preferred-side bias belongs only to flip: it must not leak into resting padding.
  const bias = 1;
  const flipMiddleware = collisionAvoidanceSide === 'none' ? null : flip({
    ...commonCollisionProps,
    padding: {
      top: collisionPadding.top + bias + (sideParam === 'bottom' ? bias : 0),
      right: collisionPadding.right + bias + (sideParam === 'left' ? bias : 0),
      bottom: collisionPadding.bottom + bias + (sideParam === 'top' ? bias : 0),
      left: collisionPadding.left + bias + (sideParam === 'right' ? bias : 0),
    },
    mainAxis: !shiftCrossAxis && collisionAvoidanceSide === 'flip',
    crossAxis: collisionAvoidanceAlign === 'flip' ? 'alignment' : false,
    fallbackAxisSideDirection: collisionAvoidanceFallbackAxisSide,
  });
  const shiftMiddleware = shiftDisabled ? null : shift({
    ...commonCollisionProps,
    rootBoundary: shiftOptions?.rootBoundary,
    mainAxis: collisionAvoidanceAlign !== 'none',
    crossAxis: crossAxisShiftEnabled,
    // Exact arrowRef=null branch of upstream limiter callback.
    limiter: sticky || shiftCrossAxis ? undefined : limitShift(() => ({})),
  });
  if (collisionAvoidanceSide === 'shift' || collisionAvoidanceAlign === 'shift' || align === 'center') {
    middleware.push(shiftMiddleware, flipMiddleware);
  } else {
    middleware.push(flipMiddleware, shiftMiddleware);
  }
  middleware.push(size({
    ...commonCollisionProps,
    apply({ elements: { floating }, availableWidth, availableHeight, rects }) {
      if (params.isMounted && !params.isMounted()) return;
      floating.style.setProperty('--available-width', `${availableWidth}px`);
      floating.style.setProperty('--available-height', `${availableHeight}px`);
      const dpr = floating.ownerDocument.defaultView?.devicePixelRatio || 1;
      const { x, y, width, height } = rects.reference;
      const anchorWidth = (Math.round((x + width) * dpr) - Math.round(x * dpr)) / dpr;
      const anchorHeight = (Math.round((y + height) * dpr) - Math.round(y * dpr)) / dpr;
      floating.style.setProperty('--anchor-width', `${anchorWidth}px`);
      floating.style.setProperty('--anchor-height', `${anchorHeight}px`);
    },
  }));
  return { placement, strategy: positionMethod, middleware };
}

/** DOM/LiveView adapter lifecycle, not a translated React scheduler. */
export function startAnchorPositioning(
  anchor: Element | VirtualElement,
  floating: HTMLElement,
  params: AnchorPositioningParameters = {},
) {
  let mounted = true;
  let latestUpdate = 0;
  // Same initial-position and available-size seed policy as upstream styles.
  Object.assign(floating.style, { position: 'fixed', top: '0px', left: '0px', transform: '', opacity: '0' });
  delete floating.dataset.positioned;
  floating.style.setProperty('--available-width', '100vw');
  floating.style.setProperty('--available-height', '100vh');
  async function update() {
    if (!mounted) return;
    const sequence = ++latestUpdate;
    const options = createAnchorPositioningOptions({
      ...params, isMounted: () => mounted && sequence === latestUpdate,
    });
    const result = await computePosition(anchor, floating, options);
    if (!mounted || sequence !== latestUpdate) return;
    const dpr = floating.ownerDocument.defaultView?.devicePixelRatio || 1;
    const x = Math.round(result.x * dpr) / dpr;
    const y = Math.round(result.y * dpr) / dpr;
    Object.assign(floating.style, { position: result.strategy, left: '0px', top: '0px',
      transform: `translate(${x}px, ${y}px)`, opacity: '' });
    floating.dataset.side = getLogicalSide(params.side ?? 'bottom', result.placement.split('-')[0] as PhysicalSide, params.direction === 'rtl');
    floating.dataset.align = result.placement.split('-')[1] || 'center';
    floating.dataset.positioned = 'true';
    return result;
  }
  const cleanup = autoUpdate(anchor, floating, update, {
    ancestorScroll: !params.disableAnchorTracking,
    elementResize: !params.disableAnchorTracking && typeof ResizeObserver !== 'undefined',
    layoutShift: !params.disableAnchorTracking && typeof IntersectionObserver !== 'undefined',
  });
  return { update, destroy() { mounted = false; ++latestUpdate; cleanup(); } };
}
