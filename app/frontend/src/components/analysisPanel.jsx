import {useEffect, useState} from "react";
import axios from "axios";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

function formatMove(move) {
  const isPieceMove = /^[KQRBN]/.test(move.san);

  if (isPieceMove) {
    return (
      <>
        <span className="piece-symbol">{move.pieceMoved}</span>
        {move.san.slice(1)}
      </>
    );
  }

  return move.san;
}

export default function AnalysisPanel({fen, enabled = true}){
  const [lines, setLines] = useState([]);
  const [expandedLines, setExpandedLines] = useState({});

  useEffect(() => {
    if (!enabled || !fen) return;

    axios.post(`${import.meta.env.VITE_API_URL}/evaluate`, {fen})
      .then((response) => {
        const responseLines = response.data.pv_lines.map((lineObject) => lineObject.line);
        setLines(responseLines);
        setExpandedLines({});
      })
    .catch((error) => console.log(error));

  }, [enabled, fen]);

  return(
    <div className="bg-[#B4D2E7] w-[60%] p-[25px] m-auto my-[10px]">
      {lines.map((line, i) => (
        <div key={i} className="m-[20px] border-2 text-stone-900 p-[10px]">
          {line.slice(0, expandedLines[i] ? line.length : 10).map((move, j) => (
            <span key={j}>
              {formatMove(move)}{" "}
            </span>
          ))}
          {line.length > 10 && (
            <>
              {!expandedLines[i] && <span>...</span>}{" "}
              <button
                type="button"
                aria-label={expandedLines[i] ? "Show less" : "Show more"}
                title={expandedLines[i] ? "Show less" : "Show more"}
                style={{ backgroundColor: 'transparent', padding: 0 }}
                onClick={() => setExpandedLines((previous) => ({
                  ...previous,
                  [i]: !previous[i],
                }))}
              >
                {expandedLines[i] ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
