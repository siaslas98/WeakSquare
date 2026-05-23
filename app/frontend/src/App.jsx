import { useEffect, useState } from 'react';
import {Chessboard} from 'react-chessboard';
import {Chess} from 'chess.js';
import axios from "axios";
import MoveNavigation from './components/moveNavigation.jsx';
import MoveListPanel from './components/moveListPanel.jsx';
import AnalysisPanel from './components/analysisPanel.jsx';

import './App.css';

function FileUploader({setMoveList}) {
  const [selectedFile, setSelectedFile] = useState(null);

	const onFileChange = (e) => { 
		setSelectedFile(e.target.files[0]);
	};

  const onFileUpload = async () => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = () => {
      const pgn = reader.result;
      const game = new Chess();
      game.loadPgn(pgn);
      setMoveList(game.history({verbose: true}));
    };
    reader.readAsText(selectedFile);

    // Send parsed move list to backend
		const formData = new FormData();
		formData.append(
			"file",
			selectedFile
		);
    await axios.post( 
      `${import.meta.env.VITE_API_URL}/uploadFile`, 
      formData
    );
	};

  return (
		<div>
			<div className ="flex justify-center gap-2">
				<input type="file" className="bg-sky-300 text-stone-900 border-2 rounded-[8px] p-4 cursor-pointer" onChange={onFileChange} />
				<button onClick={onFileUpload}>Upload</button>
			</div>
		</div>
	);
}

function ChessBoard({chessGame, chessPosition, setChessPosition, moveList, moveIndex, goToMove}){
		const [moveFrom, setMoveFrom] = useState('');
    const [optionSquares, setOptionSquares] = useState({});

    // Handle key press for left and right arrow keys
    useEffect(() => {
     function handleKeyDown(e) {
      if(!moveList || moveList.length === 0) return;

      if (e.key === "ArrowLeft"){
        goToMove((prev) => {
          if(prev === 0) return prev;
          return prev - 1;
        });
      }

      if(e.key === "ArrowRight") {
        goToMove((prev) => {
          if (prev === moveList.length) return prev;
          return prev + 1;
        });
      }
     }
     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
    }, [moveList, goToMove])

		// Get the move options for a square to show valid moves
    function getMoveOptions(square) {
      // get the moves for the square
      const moves = chessGame.moves({
        square,
        verbose: true
      });

      // if no moves, clear the option squares
      if (moves.length === 0) {
        setOptionSquares({});
        return false;
      }

      // create a new object to store the option squares
      const newSquares = {};

      // loop through the moves and set the option squares
      for (const move of moves) {
        newSquares[move.to] = {
          background: chessGame.get(move.to) && chessGame.get(move.to)?.color !== chessGame.get(square)?.color ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)' // larger circle for capturing
          : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)', // smaller circle for moving
          borderRadius: '50%'
        };
      }

      // set the square clicked to move from to yellow
      newSquares[square] = {
        background: 'rgba(255, 255, 0, 0.4)'
      };

      // set the option squares
      setOptionSquares(newSquares);

      // return true to indicate that there are move options
      return true;
    }
    function onSquareClick(square, piece) {
      // Piece clicked to move
      if (!moveFrom && piece) {
        const hasMoveOptions = getMoveOptions(square);
        if (hasMoveOptions) {
          setMoveFrom(square);
        }
        return;
      }

      // Move to square clicked, check if valid move
      const moves = chessGame.moves({
        square: moveFrom,
        verbose: true
      });
      const foundMove = moves.find(m => m.from === moveFrom && m.to === square);

      // Not a valid move
      if (!foundMove) {
        const hasMoveOptions = getMoveOptions(square);
        setMoveFrom(hasMoveOptions ? square : '');
        return;
      }

      // Make normal move
      try {
        chessGame.move({
          from: moveFrom,
          to: square,
          promotion: 'q'
        });
      } catch {
        const hasMoveOptions = getMoveOptions(square);
        if (hasMoveOptions) {
          setMoveFrom(square);
        }
        return;
      }

      // Update the position state
      setChessPosition(chessGame.fen());

      setMoveFrom('');
      setOptionSquares({});
    }
    // Handle piece drop
    function onPieceDrop(sourceSquare, targetSquare) {
      // type narrow targetSquare potentially being null (e.g. if dropped off board)
      if (!targetSquare) {
        return false;
      }

      // try to make the move according to chess.js logic
      try {
        chessGame.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q' // always promote to a queen for example simplicity
        });

        // update the position state upon successful move to trigger a re-render of the chessboard
        setChessPosition(chessGame.fen());

				// clear moveFrom and optionSquares
        setMoveFrom('');
        setOptionSquares({});

        // return true as the move was successful
        return true;
      } catch {
        // return false as the move was not successful
        return false;
      }
    }
    // Set the chessboard options
    const chessboardOptions = {
      position: chessPosition,
      onPieceDrop,
			onSquareClick,
      id: 'play-vs-random',
			boardStyle: {
        borderRadius: '10px',
        boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.5)',
        border: '1px solid #000',
        margin: '20px auto',
				width: '100%'
      },
			squareStyles: optionSquares
    };

    // Render the chessboard
    return <Chessboard options={chessboardOptions} />;
}

function App() {
  const [chessGame] = useState(() => new Chess());
  const [chessPosition, setChessPosition] = useState(() => chessGame.fen());

  const [moveList, setMoveList] = useState([]);
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

  const navProps = { chessGame, chessPosition, setChessPosition, moveList, moveIndex, goToMove: syncMoveIndex };

  return (
    <div className="flex">
      <div className="min-h-screen w-[100vw]">
        <h1 className="mb-[2rem]">WeakSquare</h1>
        <FileUploader setMoveList={setMoveList} />
        <div className=" flex max-h-[800px] w-[1000px] mx-auto mt-[100px] gap-[20px]">
          <ChessBoard className="h-full" {...navProps} />
          <MoveListPanel className="h-[500px]" moveList={moveList} goToMove={navProps.goToMove}></MoveListPanel>
        </div>
        <AnalysisPanel fen={chessPosition}/>
        <MoveNavigation {...navProps} />
      </div>
    </div>
  );
}

export default App
