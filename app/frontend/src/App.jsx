import { useEffect, useState } from 'react';
import {Routes, Route} from 'react-router-dom';
import {Chess} from 'chess.js';
import axios from "axios";
import GamesPage from './components/gamesPage.jsx';
import AnalysisPage from './components/analysisPage.jsx';

import './App.css';
import bestIcon from './assets/chess_move_icons_svg_set/best.svg';
import excellentIcon from "./assets/chess_move_icons_svg_set/excellent.svg";
import goodIcon from "./assets/chess_move_icons_svg_set/good.svg";
import inaccuracyIcon from "./assets/chess_move_icons_svg_set/inaccuracy.svg";
import mistakeIcon from "./assets/chess_move_icons_svg_set/mistake.svg";
import blunderIcon from "./assets/chess_move_icons_svg_set/blunder.svg";

const classificationMap = {
  best: bestIcon,
  excellent: excellentIcon,
  good: goodIcon,
  inaccuracy: inaccuracyIcon,
  mistake: mistakeIcon,
  blunder: blunderIcon, 
}

function App() {
  const [chessGame, setChessGame] = useState(() => new Chess());
  const [chessPosition, setChessPosition] = useState(() => chessGame.fen());
  const [moveList, setMoveList] = useState([]);
  const [classificationList, setClassificationList] = useState([]);
  const [moveIndex, setMoveIndex] = useState(0);

  function syncMoveIndex(update) {
    const nextMoveIndex = typeof update === "function" ? update(moveIndex) : update;

    chessGame.reset();
    for (let i = 0; i < nextMoveIndex; i++) {
      const move = moveList[i];
      chessGame.move({ from: move.from, to: move.to, promotion: move.promotion });
    }

    setMoveIndex(nextMoveIndex);
    setChessPosition(chessGame.fen());
  }

  const currentMove = moveIndex > 0 ? moveList[moveIndex-1] : null;
  const currentClassification = moveIndex > 0 ? classificationList[moveIndex-1]: null;
  const navProps = { chessGame, chessPosition, setChessPosition, 
                     moveList, moveIndex, goToMove: syncMoveIndex,
                     currentMoveToSquare: currentMove?.to, currentClassification};

  return (
    <div className="flex">
      <div className="min-h-screen w-[100vw]">
        <h1 className="mb-[2rem]">WeakSquare</h1>

        <Routes>
          <Route path="/" element={<GamesPage setMoveList={setMoveList} setClassificationList={setClassificationList} />} />
          <Route path="/analysis" element={<AnalysisPage navProps={navProps} moveList={moveList} chessPosition={chessPosition}/>} />
        </Routes>
      </div>
    </div>
  );
}

export default App
