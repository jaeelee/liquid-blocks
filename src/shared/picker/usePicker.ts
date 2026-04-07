import { useEffect, useRef, useState, useCallback } from "react";

type OnChange<T> = (value: T) => void;

export function useWheelPicker<T extends string>(
  data: T[],
  onChange?: OnChange<T>,
  itemHeight: number = 60,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const totalItems = data.length;
  const baseOffset = totalItems * itemHeight;

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    let currentScroll = container.scrollTop;

    // 무한 스크롤 보정
    if (currentScroll <= 0) {
      container.scrollTop += baseOffset;
    } else if (currentScroll >= baseOffset * 2) {
      container.scrollTop -= baseOffset;
    }

    const centerIndex = Math.round(
      (container.scrollTop + itemHeight) / itemHeight,
    );

    const normalizedIndex = centerIndex % totalItems;

    if (normalizedIndex !== activeIndex) {
      setActiveIndex(normalizedIndex);
      onChange?.(data[normalizedIndex]);
    }
  }, [activeIndex, baseOffset, data, itemHeight, onChange, totalItems]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.scrollTop = baseOffset;
  }, [baseOffset]);

  return {
    containerRef,
    activeIndex,
    handleScroll,
    tripleData: [...data, ...data, ...data],
  };
}
