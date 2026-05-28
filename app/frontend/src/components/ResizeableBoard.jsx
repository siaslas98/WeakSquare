import {useState} from "react";
import { LuMoveDiagonal2 } from "react-icons/lu";

export default function ResizableBoard({children}){
  const [boardSize, setBoardSize] = useState(560);

  function startResize(e){
    e.preventDefault();

    const startX = e.clientX; 
    const startSize = boardSize;

    function handleMouseMove(moveEvent) {
      const delta = moveEvent.clientX - startX;
      const nextSize = Math.min(Math.max(startSize + delta, 320), 800);
      setBoardSize(nextSize);
    }

    function handleMouseUp() {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  return (
    <div
        className = "relative shrink-0 group"
        style = {{ width: boardSize, height: boardSize }}
    >
      {children}

      <button
        type="button"
        aria-label="Resize board"
        onMouseDown={startResize}
        className="absolute -bottom-4 -right-5 h-5 w-5 cursor-nwse-resize rounded-none p-0 opacity-0 group-hover:opacity-100 transition-opacity" 
        id="boardResizer"
      >
        <LuMoveDiagonal2 size={32}/>
      </button>
    </div>
  );
}