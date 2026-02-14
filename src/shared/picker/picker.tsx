import React, { useRef, useEffect, useState, useCallback } from "react";

// --- Types & Constants ---
interface PickerProps {
  dataList: string[];
  onChange?: (value: string) => void;
  itemHeight?: number;
}

const COLOR_MAP: Record<string, string> = {
  GRAY: "#444444",
  RED: "#ff4757",
  BLUE: "#1e90ff",
  GREEN: "#2ed573",
  PURPLE: "#a040ff",
  ORANGE: "#ffa502",
};

const LEVELS = ["쉬움", "보통", "어려움", "매우 어려움"];
const STEPS = ["1단계", "2단계", "3단계", "4단계"];
const BLOCKS = ["10개", "20개", "30개", "40개", "50개"];
const COLORS = Object.keys(COLOR_MAP);

// --- 1. Sub-Component: Picker ---
export const Picker: React.FC<PickerProps> = ({
  dataList,
  onChange,
  itemHeight = 60,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const lastValueRef = useRef<string | null>(null);

  const allItems = [...dataList, ...dataList, ...dataList];
  const baseOffset = dataList.length * itemHeight;

  // 초기 스크롤 위치 설정
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = baseOffset;
    }
  }, [baseOffset]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    let currentScroll = container.scrollTop;

    // 무한 루프 처리
    if (currentScroll <= 0) {
      container.scrollTop = baseOffset;
      currentScroll = baseOffset;
    } else if (currentScroll >= baseOffset * 2) {
      container.scrollTop = baseOffset;
      currentScroll = baseOffset;
    }

    // 중앙 요소 감지 로직
    const centerPoint = currentScroll + itemHeight + itemHeight / 2;
    const index = Math.floor(centerPoint / itemHeight);

    if (index !== activeIndex) {
      setActiveIndex(index);
      const val = allItems[index];

      if (onChange && lastValueRef.current !== val) {
        lastValueRef.current = val;
        onChange(val);
      }
    }
  }, [baseOffset, itemHeight, activeIndex, allItems, onChange]);

  const handleItemClick = (index: number) => {
    containerRef.current?.scrollTo({
      top: index * itemHeight - itemHeight,
      behavior: "smooth",
    });
  };

  return (
    <div className="picker-viewport">
      <div className="selection-indicator"></div>
      <div
        className="scroll-container"
        ref={containerRef}
        onScroll={handleScroll}
      >
        {allItems.map((text, index) => (
          <div
            key={index}
            className={`option ${index === activeIndex ? "active" : ""}`}
            onClick={() => handleItemClick(index)}
          >
            {text}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 2. Main Component: GameSettings ---
export default function GameSettings() {
  const [dynamicColor, setDynamicColor] = useState(COLOR_MAP["GRAY"]);

  return (
    <>
      <div className="game-settings-wrapper">
        <div className="settings-title">GAME SETTINGS</div>

        <div className="picker-group">
          {/* 일반 피커들 */}
          <Picker dataList={LEVELS} />
          <Picker dataList={STEPS} />
          <Picker dataList={BLOCKS} />

          {/* 컬러 피커 영역: CSS 변수를 이 div에 한정하여 적용 */}
          {/* <div style={{ "--dynamic-color": dynamicColor } as React.CSSProperties}>
            <Picker
                dataList={COLORS}
                onChange={(val) => setDynamicColor(COLOR_MAP[val])}
            />
            </div> */}
        </div>
      </div>
    </>
  );
}
