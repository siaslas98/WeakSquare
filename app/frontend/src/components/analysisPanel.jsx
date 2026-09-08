import {useEffect, useState} from "react";
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

    setLines([]);
    setExpandedLines({});

    const streamUrl = new URL(
      `${import.meta.env.VITE_API_URL}/evaluate/stream`
    );
    streamUrl.searchParams.set("fen", fen);

    const eventSource = new EventSource(streamUrl);

    eventSource.onmessage = (event) => {
      const update = JSON.parse(event.data);
      const lineIndex = update.multipv - 1;

      if (lineIndex < 0) return;

      setLines((previousLines) => {
        const nextLines = [...previousLines];
        nextLines[lineIndex] = update.line;
        return nextLines;
      });
    };

    eventSource.onerror = (error) => {
      console.error("Analysis stream error", error);
      eventSource.close();
    };

    return () => eventSource.close();

  }, [enabled, fen]);

  return(
    <div className="bg-[#B4D2E7] w-[60%] p-[25px] m-auto my-[10px]">
      {lines.map((line, i) => line && (
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
