import React from "react";
import { useHome } from "/pages/home/lib/hooks";
import GameSettings from "/shared/picker/picker";

export const Home: React.FC = () => {
  const {
    game,
    settings,
    setSettings,
    handleResumeGame,
    handleStartNewGame,
    settingsLoaded,
  } = useHome();

  return (
    <div className="home-container">
      {settingsLoaded && (
        <GameSettings
          settings={settings}
          onSettingsChange={(key, value) =>
            setSettings((prev) => ({ ...prev, [key]: value }))
          }
        />
      )}
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
