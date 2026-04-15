
export default function MoveNaviationButton({name, logo, chessGame, setChessPosition, moveList, moveIndex, setMoveIndex}){
  return (
    <>
      <button onClick={() => {
        if(name === 'left'){
          // Undo a move if possible
          setMoveIndex((prev) => {
            if(prev === 0) return prev;
            return prev - 1;
          });

        chessGame.undo();
        setChessPosition(chessGame.fen());

        } else if (name === 'right'){
          // Make the next move
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
      }}>
        {logo}
      </button>
    </>
  );

}