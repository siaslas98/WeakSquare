
export default function MoveNaviationButton({name, logo, moveList, goToMove}){
  return (
    <>
      <button onClick={() => {
        if(name === 'left'){
          // Undo a move if possible
          goToMove((prev) => {
            if(prev === 0) return prev;
            return prev - 1;
          });

        } else if (name === 'right'){
          // Make the next move
          goToMove((prev) => {
            if (prev >= moveList.length) return prev;
            return prev + 1;
          });
        }
      }}>
        {logo}
      </button>
    </>
  );

}
