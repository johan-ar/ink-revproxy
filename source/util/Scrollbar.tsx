import { deepEqual } from "fast-equals";
import { Box, BoxProps, DOMElement, Text, TextProps } from "ink";
import _ from "lodash";
import React, { forwardRef, memo, useEffect, useMemo, useState } from "react";
import { useIntAnimation } from "./useAnimate.js";
import { useTimeout } from "./useTimeout.js";
import { EDGE_LEFT, EDGE_TOP, useYogaNode } from "./useYogaNode.js";

export type ScrollbarCommonProps = {
  style?: {
    track: string;
    trackColor?: TextProps["color"];
    thumb: string;
    thumbColor?: TextProps["color"];
  };
  visible?: boolean | "onscroll";
  animate?: boolean;
};
type VScrollbarProps = BoxProps &
  ScrollbarCommonProps & {
    height: number;
    scrollTop: number;
    scrollHeight: number;
  };

const VScrollbar_ = forwardRef<DOMElement, VScrollbarProps>(
  (
    {
      scrollTop,
      scrollHeight,
      height,
      style = { track: "▏", thumb: "▌" },
      visible = "onscroll",
      animate,
      ...props
    },
    forwardedRef
  ) => {
    const { display, trackBar, thumbPosition } = useScrollbar({
      size: height,
      scrollSize: scrollHeight,
      scrollPosition: scrollTop,
      visible,
      style,
      animate,
    });
    const [thumbNode, ref] = useYogaNode();
    thumbNode?.setPosition(EDGE_TOP, thumbPosition);

    return (
      <Box
        ref={forwardedRef}
        position="relative"
        width={1}
        height={height}
        display={display}
        overflow="hidden"
        {...props}
      >
        {trackBar && (
          <Text wrap="wrap" color={style.trackColor}>
            {trackBar}
          </Text>
        )}
        <Box ref={ref} position="absolute" width={1}>
          <Text color={style.thumbColor}>{style.thumb}</Text>
        </Box>
      </Box>
    );
  }
);
VScrollbar_.displayName = "VScrollbar";
export const VScrollbar = memo(VScrollbar_);

export type HScrollbarProps = BoxProps &
  ScrollbarCommonProps & {
    width: number;
    scrollLeft: number;
    scrollWidth: number;
  };

const HScrollbar_ = forwardRef<DOMElement, HScrollbarProps>(
  (
    {
      scrollLeft,
      scrollWidth,
      width,
      style = { track: "▁", thumb: "▂▂" },
      visible = "onscroll",
      animate,
      ...props
    },
    forwardedRef
  ) => {
    const { display, trackBar, thumbPosition } = useScrollbar({
      size: width,
      scrollSize: scrollWidth,
      scrollPosition: scrollLeft,
      visible,
      style,
      animate,
    });
    const [thumbNode, ref] = useYogaNode();
    thumbNode?.setPosition(EDGE_LEFT, thumbPosition);

    return (
      <Box
        ref={forwardedRef}
        position="relative"
        width={width}
        height={1}
        display={display}
        overflow="hidden"
        {...props}
      >
        {trackBar && <Text color={style.trackColor}>{trackBar}</Text>}
        <Box ref={ref} position="absolute" height={1}>
          <Text color={style.thumbColor}>{style.thumb}</Text>
        </Box>
      </Box>
    );
  }
);
HScrollbar_.displayName = "HScrollbar";
export const HScrollbar = memo(HScrollbar_, deepEqual);

export type UseScrollbarProps = {
  size: number;
  scrollSize: number;
  scrollPosition: number;
  visible: boolean | "onscroll";
  style: {
    track: string;
    thumb: string;
  };
  animate?: boolean;
};
export const useScrollbar = ({
  size,
  scrollSize,
  scrollPosition,
  visible,
  style,
  animate,
}: UseScrollbarProps) => {
  const timeout = useTimeout();
  const [isScrolling, setIsScrolling] = useState(false);
  useEffect(() => {
    if (visible === "onscroll") {
      setIsScrolling(true);
      return timeout.start(setIsScrolling, 500, false);
    }
  }, [scrollPosition]);

  const trackBar = useMemo(() => {
    switch (style.track.length) {
      case 0:
        return "";
      case 1:
        return style.track.repeat(size);
      default:
        return style.track
          .repeat(Math.ceil(size / style.track.length))
          .slice(0, size);
    }
  }, [size]);

  const [thumbPosition, setThumbPosition] = useIntAnimation(0);
  useEffect(() => {
    setThumbPosition(
      computeThumbPosition(
        size,
        scrollSize,
        scrollPosition,
        style.thumb.length
      ),
      {
        duration: animate ? 200 : 0,
        onPlay() {
          setIsScrolling(true);
        },
        onComplete() {
          if (visible === "onscroll") timeout.start(setIsScrolling, 500, false);
        },
      }
    );
  }, [scrollPosition, scrollSize, size, style.thumb.length]);

  const display: "flex" | "none" = useMemo(() => {
    if (visible === "onscroll") return isScrolling ? "flex" : "none";
    return visible ? "flex" : "none";
  }, [isScrolling, visible]);

  return {
    display,
    trackBar,
    thumbPosition,
  };
};

function computeThumbPosition(
  size: number,
  scrollSize: number,
  scrollPosition: number,
  thumbSize: number
) {
  const scrollEndPosition = scrollSize - size;
  if (scrollEndPosition === 0) return 0;

  return _.clamp(
    Math.ceil((size / scrollEndPosition) * scrollPosition),
    0,
    size - thumbSize
  );
}
