import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import JoinGame from "./components/JoinGame";
import CreateGame from "./components/CreateGame";
import LobbyPage from "./components/LobbyPage";
import GamePage from "./components/GamePage";
import FinishGamePage from "./components/FinishGamePage";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <div style={{ padding: "20px", textAlign: "center" }}>
              <h1>Добро пожаловать в Carcassonne!</h1>
              <p>Этот интерфейс создаётся с нуля.</p>
              <Link to="/join">
                <button
                  style={{
                    padding: "10px 20px",
                    fontSize: "16px",
                    cursor: "pointer",
                    marginRight: "10px",
                  }}
                >
                  Присоединиться по ID
                </button>
              </Link>
              <Link to="/create">
                <button
                  style={{
                    padding: "10px 20px",
                    fontSize: "16px",
                    cursor: "pointer",
                  }}
                >
                  Создать игру
                </button>
              </Link>
            </div>
          }
        />
        <Route path="/join" element={<JoinGame />} />
        <Route path="/create" element={<CreateGame />} />
        <Route path="/lobby/:gameId" element={<LobbyPage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
        <Route path="/finish" element={<FinishGamePage />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
