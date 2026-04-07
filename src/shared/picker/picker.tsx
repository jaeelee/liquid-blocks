import React, { useRef, useEffect, useState, useCallback } from "react";
import type { Difficulty } from "/entities/game";

// --- Types & Constants ---
interface PickerProps {
  dataList: string[];
  onChange?: (value: string) => void;
  itemHeight?: number;
}

interface GameSettingsProps {
  onSettingsChange: (key: string, value: string | number) => void;
}

const COLOR_MAP: Record<string, string> = {
  GRAY: "#444444",
  RED: "#ff4757",
  BLUE: "#1e90ff",
  GREEN: "#2ed573",
  PURPLE: "#a040ff",
  ORANGE: "#ffa502",
};

const LEVELS = ["쉬움", "보통", "어려움"];
const HEIGHTS = ["4", "5", "6", "7", "8", "9", "10"];
const COLOR_COUNTS = [
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
];
const COLORS = Object.keys(COLOR_MAP);

const DIFFICULTY_LABEL_MAP: Record<string, Difficulty> = {
  쉬움: "easy",
  보통: "medium",
  어려움: "hard",
};

const DIFFICULTY_TO_LABEL: Record<Difficulty, string> = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
};

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
export default function GameSettings({ onSettingsChange }: GameSettingsProps) {
  const [dynamicColor, setDynamicColor] = useState(COLOR_MAP["GRAY"]);

  const handleDifficultyChange = (label: string) => {
    const difficulty = DIFFICULTY_LABEL_MAP[label];
    onSettingsChange("difficulty", difficulty);
  };

  const handleHeightChange = (height: string) => {
    onSettingsChange("bottleHeight", Number(height));
  };

  const handleColorCountChange = (count: string) => {
    onSettingsChange("numColors", Number(count));
  };

  return (
    <>
      <div className="game-settings-wrapper">
        {/* <div className="settings-title">GAME SETTINGS</div> */}

        <div className="picker-group">
          <div>
            <div style={{ textAlign: "center", marginBottom: "8px" }}>
              난이도
            </div>
            <Picker dataList={LEVELS} onChange={handleDifficultyChange} />
          </div>
          <div>
            <div style={{ textAlign: "center", marginBottom: "8px" }}>높이</div>
            <Picker dataList={HEIGHTS} onChange={handleHeightChange} />
          </div>
          <div>
            <div style={{ textAlign: "center", marginBottom: "8px" }}>
              색상 수
            </div>
            <Picker dataList={COLOR_COUNTS} onChange={handleColorCountChange} />
          </div>

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
