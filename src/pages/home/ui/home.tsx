import React from 'react';
import { useHome } from '/pages/home/lib/hooks';
import { BottomPicker } from '/shared';
import type { Difficulty } from '/entities/game';
import { getDifficultyConfig } from '/entities/game';

export const Home: React.FC = () => {
  const {
    isVisible,
    game,
    settings,
    setIsVisible,
    setSettings,
    handleResumeGame,
    handleStartNewGame,
  } = useHome();

  return (
    <div className="home-container">
      <div className="steps">
        <section className="home-section">
          <h2 className="home-title" onClick={() => setIsVisible('difficulty')}>
            난이도
          </h2>
          <div>{getDifficultyConfig(settings.difficulty).name}</div>
          <BottomPicker<Difficulty>
            title="난이도"
            selectedValue={settings.difficulty}
            onValueChange={value =>
              setSettings(prev => ({...prev, difficulty: value}))
            }
            values={['easy', 'medium', 'hard']}
            isVisible={isVisible === 'difficulty'}
            setIsVisible={v => setIsVisible(v ? 'difficulty' : null)}
          />
        </section>

        <section className="home-section">
          <h2 className="home-title" onClick={() => setIsVisible('bottleSize')}>
            높이
          </h2>
          <div>{settings.bottleHeight}</div>
          <BottomPicker<number>
            title="높이"
            selectedValue={settings.bottleHeight}
            onValueChange={value =>
              setSettings(prev => ({...prev, bottleHeight: value}))
            }
            values={[4, 5, 6, 7, 8, 9, 10]}
            isVisible={isVisible === 'bottleSize'}
            setIsVisible={v => setIsVisible(v ? 'bottleSize' : null)}
          />
        </section>

        <section className="home-section">
          <h2
            className="home-title"
            onClick={() => setIsVisible('bottleCount')}>
            색상 수
          </h2>
          <div>{settings.numColors}</div>
          <BottomPicker<number>
            title="색상 수"
            selectedValue={settings.numColors}
            onValueChange={value =>
              setSettings(prev => ({...prev, numColors: value}))
            }
            values={[
              3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
            ]}
            isVisible={isVisible === 'bottleCount'}
            setIsVisible={v => setIsVisible(v ? 'bottleCount' : null)}
          />
        </section>
      </div>
      <div className="buttons">
        <button className="home-button" onClick={handleStartNewGame}>
          새 게임
        </button>
        {game && game.length > 0 && (
          <button className="home-button" onClick={handleResumeGame}>
            이어하기
          </button>
        )}
      </div>
    </div>
  );
};
