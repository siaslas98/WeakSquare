import { useEffect, useState, useRef } from 'react';
import {Chessboard} from 'react-chessboard';
import {Chess} from 'chess.js';
import axios from "axios";
import MoveNavigation from './components/moveNavigation';

import './App.css';

function UploadFile({setMoveList}) {
  const [selectedFile, setSelectedFile] = useState(null);

	const onFileChange = (event) => { 
		setSelectedFile(event.target.files[0]);
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

		const formData = new FormData();
		formData.append(
			"file",
			selectedFile
		);
		const response = await axios.post( 
      `${import.meta.env.VITE_API_URL}/uploadFile`, 
      formData
    );
	};

  return (
		<div>
			<div className ="flex justify-center gap-2">
				<input type="file" className="border-2 border-indigo-600 rounded-[8px] hover:bg-[#B0413E] p-4 cursor-pointer" onChange={onFileChange} />
				<button onClick={onFileUpload}>Upload!</button>
			</div>
		</div>
	);
}

function RenderChessBoard({chessGame, chessPosition, setChessPosition, moveList, moveIndex, setMoveIndex}){
		const [moveFrom, setMoveFrom] = useState('');
    const [optionSquares, setOptionSquares] = useState({});

    // Handle key press for left and right arrow keys
    useEffect(() => {
     function handleKeyDown(e) {
      if(!moveList || moveList.length === 0) return;

      if (e.key === "ArrowLeft"){
        setMoveIndex((prev) => {
          if(prev === 0) return prev;
          return prev - 1;
        });
        chessGame.undo();
        setChessPosition(chessGame.fen());
      }

      if(e.key === "ArrowRight") {
        setMoveIndex((prev) => {
          if (prev >= moveList.length) return prev;
          return prev + 1;
        });
        const move = moveList[moveIndex];
        if (moveIndex < moveList.length) {
          chessGame.move({
            from: move.from,
            to: move.to,
            promotion: move.promotion,
          });
          setChessPosition(chessGame.fen());
        }
      }
     }

     window.addEventListener('keydown', handleKeyDown);
     return () => window.removeEventListener('keydown', handleKeyDown);
    }, [moveList, moveIndex, chessGame])

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
          : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
          // smaller circle for moving
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
      // piece clicked to move
      if (!moveFrom && piece) {
        // get the move options for the square
        const hasMoveOptions = getMoveOptions(square);

        // if move options, set the moveFrom to the square
        if (hasMoveOptions) {
          setMoveFrom(square);
        }

        // return early
        return;
      }

      // square clicked to move to, check if valid move
      const moves = chessGame.moves({
        square: moveFrom,
        verbose: true
      });
      const foundMove = moves.find(m => m.from === moveFrom && m.to === square);

      // not a valid move
      if (!foundMove) {
        // check if clicked on new piece
        const hasMoveOptions = getMoveOptions(square);

        // if new piece, setMoveFrom, otherwise clear moveFrom
        setMoveFrom(hasMoveOptions ? square : '');

        // return early
        return;
      }

      // is normal move
      try {
        chessGame.move({
          from: moveFrom,
          to: square,
          promotion: 'q'
        });
      } catch {
        // if invalid, setMoveFrom and getMoveOptions
        const hasMoveOptions = getMoveOptions(square);

        // if new piece, setMoveFrom, otherwise clear moveFrom
        if (hasMoveOptions) {
          setMoveFrom(square);
        }

        // return early
        return;
      }

      // update the position state
      setChessPosition(chessGame.fen());


      // clear moveFrom and optionSquares
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
				width: '25%'
      },
			squareStyles: optionSquares
    };

    // Render the chessboard
    return <Chessboard options={chessboardOptions} />;
}

function App() {
  const chessGameRef = useRef(new Chess());
  const chessGame = chessGameRef.current;
  const [chessPosition, setChessPosition] = useState(chessGame.fen());

  const [moveList, setMoveList] = useState([]);
  const [moveIndex, setMoveIndex] = useState(0);

  const navProps = { chessGame, chessPosition, setChessPosition, moveList, moveIndex, setMoveIndex };

  return (
    <div className="min-h-screen w-screen">
      <h1 className="mb-[2rem]">WeakSquare</h1>
      <UploadFile setMoveList={setMoveList} />
			<RenderChessBoard {...navProps} />
      <MoveNavigation {...navProps} />
    </div>
  );
}

export default App
