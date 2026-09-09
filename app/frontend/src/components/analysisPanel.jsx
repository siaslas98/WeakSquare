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

function formatCentipawnScore(score) {
  if (score === null || score === undefined) return "-";
  const normalizedScore = score / 100;
  return `${normalizedScore > 0 ? "+" : ""}${normalizedScore.toFixed(2)}`;
}

export default function AnalysisPanel({fen, enabled = true, panelWidth}){
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
      console.log("Analysis update", {
        multipv: update.multipv,
        depth: update.depth,
        line: update.line,
      });
      const lineIndex = update.multipv - 1;

      if (lineIndex < 0) return;

      setLines((previousLines) => {
        const nextLines = [...previousLines];
        nextLines[lineIndex] = {
          line: update.line,
          whiteScore: update.whiteScore,
          depth: update.depth,
        };
        console.log(
          "Stored analysis lines",
          nextLines.map((line, index) => line ? index + 1 : null)
        );
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
    <div
      className="bg-[#B4D2E7] p-[25px] m-auto my-[10px]"
      style={{ width: `${panelWidth}px` }}
    >
      {lines.map((pv, i) => pv && (
        <div key={i} className="m-[20px] border-2 text-stone-900 p-[10px]">
          <span className="font-semibold">
            {formatCentipawnScore(pv.whiteScore)}{" "}
          </span>
          {pv.line.slice(0, expandedLines[i] ? pv.line.length : 10).map((move, j) => (
            <span key={j}>
              {formatMove(move)}{" "}
            </span>
          ))}
          {pv.line.length > 10 && (
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
