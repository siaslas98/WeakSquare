import {useEffect, useState} from "react";
import axios from "axios";

export default function AnalysisPanel({fen, enabled = true}){
  const [lines, setLines] = useState([]);

  useEffect(() => {
    if (!enabled || !fen) return;

    axios.post(`${import.meta.env.VITE_API_URL}/evaluate`, {fen})
    .then((response) => {
      const responseLines = response.data.pv_lines.map((lineObject) => lineObject.line);
      setLines(responseLines);
      console.log(responseLines[0]);
    })
    .catch((error) => console.log(error));

  }, [enabled, fen]);

  return(
    <div className="bg-sky-300 w-[60%] p-[25px] m-auto my-[10px]">
      {lines.map((line, i) => (
        <div key={i} className="m-[20px] border-2 text-stone-900 p-[10px]">
          {line.map((move, j) => (
            <span key={j}>
                {move.pieceMoved !== "♙" && move.pieceMoved !== '♟' && (
                  <span className="piece-symbol">
                    {move.pieceMoved}
                  </span>
                )}
              {move.san}{" "}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
