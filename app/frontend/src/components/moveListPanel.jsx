import '../styles/moveListPanel.css'

export default function MoveListPanel({moveList, goToMove}){
  const handleMoveClick = (j) => {
    goToMove(j);
  };

  const rows = [];
  for (let i = 0; i < moveList.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1;
    rows.push(
      <li key={i} className="flex-[1_1_100%]">
        <span className="mx-4">{moveNumber}.</span>
        <button className="moveButton" onClick={() => handleMoveClick(i + 1)}>{moveList[i].to}</button>
        {moveList[i + 1] && <button className="moveButton" onClick={() => handleMoveClick(i + 2)}>{moveList[i + 1].to}</button>}
      </li>
    );
  }

  return (
    <ul className="flex flex-wrap list-none overflow-y-auto gap-2 w-[600px]">
      {rows}
    </ul>
  );
}