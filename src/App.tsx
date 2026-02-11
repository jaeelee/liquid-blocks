import { BrowserRouter, Routes, Route } from "react-router-dom";
import '/App.css';
import { Home } from '/pages/home';
import { Board } from '/pages/game-board';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<Board />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
