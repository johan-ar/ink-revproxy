import { Box, BoxProps, DOMElement } from "ink";
import _ from "lodash";
import React, {
  ForwardedRef,
  forwardRef,
  PropsWithChildren,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { EDGE_BOTTOM, EDGE_LEFT, EDGE_TOP } from "yoga-wasm-web";
import { HScrollbar, VScrollbar } from "./Scrollbar.js";
import { useShortcut } from "./Shortcut.js";
import { ShortcutSequenceProp } from "./shortcutDefinitions.js";
import { useIntAnimation } from "./useAnimate.js";
import { useComputedRect } from "./useComputedRect.js";

type ScrollableBoxProps = PropsWithChildren<
  BoxProps & {
    scrollbarVisible?: boolean | "onscroll";
    leftShortcut?: ShortcutSequenceProp;
    rightShortcut?: ShortcutSequenceProp;
    upShortcut?: ShortcutSequenceProp;
    downShortcut?: ShortcutSequenceProp;
    innerProps?: BoxProps;
  }
>;

export type ScrollableBoxRef = {
  /**
   * Scrolls the box to a specific position.
   *
   * @param position.top - The new top scroll position.
   * @param position.left - The new left scroll position.
   * @param position.behavior - The scroll behavior. If not given, defaults to "smooth".
   */
  scrollTo(position: {
    top?: number;
    left?: number;
    behavior?: "auto" | "smooth";
  }): void;
  /**
   * Scrolls the box by a relative amount.
   *
   * @param relative.top - The relative amount to scroll vertically. If not given, defaults to 0.
   * @param relative.left - The relative amount to scroll horizontally. If not given, defaults to 0.
   * @param relative.behavior - The scroll behavior. If not given, defaults to "smooth".
   */
  scrollBy(relative: {
    top?: number;
    left?: number;
    behavior?: "auto" | "smooth";
  }): void;
  readonly height: number;
  readonly scrollTop: number;
  readonly scrollHeight: number;
  readonly width: number;
  readonly scrollWidth: number;
  readonly scrollLeft: number;
  readonly innerElement: DOMElement | null;
};

const ScrollableBox = (
  {
    children,
    scrollbarVisible,
    leftShortcut,
    rightShortcut,
    upShortcut,
    downShortcut,
    innerProps,
    ...props
  }: ScrollableBoxProps,
  ref: ForwardedRef<ScrollableBoxRef>
) => {
  const [inner, innerEl] = useComputedRect();
  const [outer, outerEl] = useComputedRect();
  const [scrollTop, setScrollTop] = useIntAnimation(0);
  const [scrollLeft, setScrollLeft] = useIntAnimation(0);
  const nextScrollTop = useRef(0);
  const nextScrollLeft = useRef(0);
  const [smooth, setSmooth] = useState(false);

  const setVScrollPos = useCallback((el: DOMElement | null) => {
    el?.yogaNode?.setPosition(EDGE_LEFT, 0);
  }, []);

  const setHScrollPos = useCallback((el: DOMElement | null) => {
    el?.yogaNode?.setPosition(EDGE_BOTTOM, 0);
  }, []);

  function scrollByTop(y: number, smooth: boolean) {
    setSmooth(smooth);
    setScrollTop(
      (current) =>
        (nextScrollTop.current = _.clamp(
          current + y,
          0,
          Math.max(0, inner.height - outer.height)
        )),
      { duration: smooth ? 150 : 0 }
    );
  }
  function scrollToTop(y: number, smooth: boolean) {
    setSmooth(smooth);
    setScrollTop(
      (nextScrollTop.current = _.clamp(
        y,
        0,
        Math.max(0, inner.height - outer.height)
      )),
      { duration: smooth ? 150 : 0 }
    );
  }
  function scrollByLeft(x: number, smooth: boolean) {
    setSmooth(smooth);
    setScrollLeft(
      (current) =>
        (nextScrollLeft.current = _.clamp(
          current + x,
          0,
          Math.max(0, inner.width - outer.width)
        )),
      { duration: smooth ? 150 : 0 }
    );
  }
  function scrollToLeft(x: number, smooth: boolean) {
    setSmooth(smooth);
    setScrollLeft(
      (nextScrollLeft.current = _.clamp(
        x,
        0,
        Math.max(0, inner.width - outer.width)
      )),
      { duration: smooth ? 150 : 0 }
    );
  }
  // down
  useShortcut(downShortcut, () => {
    scrollByTop(4, true);
  });
  // up
  useShortcut(upShortcut, () => {
    scrollByTop(-4, true);
  });
  // right
  useShortcut(rightShortcut, () => {
    scrollByLeft(5, true);
  });
  // left
  useShortcut(leftShortcut, () => {
    scrollByLeft(-5, true);
  });

  innerEl.current?.yogaNode?.setPosition(EDGE_TOP, -scrollTop);
  innerEl.current?.yogaNode?.setPosition(EDGE_LEFT, -scrollLeft);

  useImperativeHandle(
    ref,
    () => ({
      scrollTo({ top, left, behavior = smooth }) {
        if (top) scrollToTop(top, behavior === smooth);
        if (left) scrollToLeft(left, behavior === smooth);
      },
      scrollBy({ top, left, behavior = smooth }) {
        if (top) scrollByTop(top, behavior === smooth);
        if (left) scrollByLeft(left, behavior === smooth);
      },
      get height() {
        return outer.height;
      },
      get scrollTop() {
        return nextScrollTop.current;
      },
      get scrollHeight() {
        return inner.height;
      },
      get width() {
        return outer.width;
      },
      get scrollWidth() {
        return inner.width;
      },
      get scrollLeft() {
        return nextScrollLeft.current;
      },
      get innerElement() {
        return innerEl.current;
      },
    }),
    []
  );

  return (
    <Box ref={outerEl} {...props} overflow="hidden" position="relative">
      <Box ref={innerEl} position="absolute" {...innerProps}>
        {children}
      </Box>
      <HScrollbar
        ref={setHScrollPos}
        position="absolute"
        width={outer.width}
        scrollWidth={inner.width}
        scrollLeft={nextScrollLeft.current}
        visible={scrollbarVisible}
        animate={smooth}
      />
      <VScrollbar
        ref={setVScrollPos}
        position="absolute"
        height={outer.height}
        scrollHeight={inner.height}
        scrollTop={nextScrollTop.current}
        visible={scrollbarVisible}
        animate={smooth}
      />
    </Box>
  );
};

export default forwardRef<ScrollableBoxRef, ScrollableBoxProps>(ScrollableBox);
