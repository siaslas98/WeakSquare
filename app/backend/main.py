import os
import io
import asyncio
import chess
import chess.engine
import chess.pgn
import psycopg2
import hashlib
from fastapi import FastAPI, UploadFile, WebSocket, WebSocketDisconnect, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
from database import db_engine, Base
from sqlalchemy.orm import Session
from database import db_engine, Base, get_db
from models import Game

engine: chess.engine.UciProtocol | None = None
Base.metadata.create_all(bind=db_engine)


class EvaluateRequest(BaseModel):
    fen: str


@asynccontextmanager
async def lifespan(app: FastAPI):
    global engine
    transport, engine = await chess.engine.popen_uci("stockfish")
    yield
    await engine.quit()

app = FastAPI(lifespan=lifespan)

# Allow local frontend origins by default, while still supporting override via CORS_ORIGINS.
origins_env = os.getenv("CORS_ORIGINS", "")
origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]
if not origins:
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/uploadFile/")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    raw_pgn = contents.decode("utf-8")
    pgn = io.StringIO(raw_pgn)
    pgn_hash = hashlib.sha256(raw_pgn.encode("utf-8")).hexdigest()

    game = chess.pgn.read_game(pgn)
    if game is None:
        return {"error": "Invalid or empty PGN file"}

    db_game = Game(
        pgn_hash=pgn_hash,
        white_player=game.headers.get("White"),
        black_player=game.headers.get("Black"),
        event=game.headers.get("Event"),
        site=game.headers.get("Site"),
        round_tag=game.headers.get("Round"),
        date=game.headers.get("Date"),
        result=game.headers.get("Result"),
        time_control=game.headers.get("TimeControl"),
        eco=game.headers.get("TimeControl"),
        opening=game.headers.get("Opening"),
        raw_pgn=raw_pgn,
    )

    db.add(db_game)
    db.commit()
    db.refresh(db_game)

    board = game.board()

    moves = []

    node = game
    while node.variations:
        next_node = node.variation(0)

        move = next_node.move

        moves.append({
            "uci": move.uci(),
            "san": board.san(move),
            "fen_before": board.fen(),
        })

        board.push(move)
        node = next_node

    return {
        "headers": dict(game.headers),
        "moves": moves
    }

@app.post("/evaluate")
async def evaluate(payload: EvaluateRequest):
    if engine is None:
        return {"error": "Engine not initialized"}
    
    pv_lines = []

    board = chess.Board(payload.fen)
    infoList = await engine.analyse(board, chess.engine.Limit(depth=15), multipv = 5)

    for infoDict in infoList:
        score = infoDict.get("score")
        pv = infoDict.get("pv") # List of move objects

        white_score = None 

        if score is not None:
            white_score = score.white().score(mate_score=10000)

        moves = []

        if pv:
            for move in pv:
                san = board.san(move)
                piece = board.piece_at(move.from_square)                

                moves.append({
                    "pieceMoved": piece.unicode_symbol() if piece else None,
                    "uci": move.uci(),
                    "san": san,
                    }
                )

                board.push(move)
        
        board.set_fen(payload.fen)
        
        pv_lines.append(
            {'score': white_score,
            'line': moves}
                        )
    return {"pv_lines": pv_lines}

@app.websocket("/evaluate-stream")
async def evaluate_stream(websocket: WebSocket):

    await websocket.accept()
    
    current_task: asyncio.Task | None = None

    try:
        while True:
            message = await websocket.receive_json()
            fen = message["fen"]

            if current_task is not None:
                current_task.cancel()
                try:
                    await current_task
                except asyncio.CancelledError:
                    pass
            current_task = asyncio.create_task(
                analyze_position(websocket, fen)
            )
    except WebSocketDisconnect:
        if current_task is not None:
            current_task.cancel()

async def analyze_position(websocket: WebSocket, fen: str):
    if engine is None:
        await websocket.send_json({"error": "Engine not initialized"})
        return
    board = chess.Board(fen)

    try:
        with await engine.analysis(board) as analysis:
            async for info in analysis:
                score = info.get("score")
                pv = info.get("pv")

                white_score = None
                if score is not None:
                    white_score = score.white().score(mate_score=10000)
                
                pv_moves = []
                if pv:
                    pv_moves = [m.uci() for m in pv]
                
                await websocket.send_json({
                    "fen": fen,
                    "score": white_score,
                    "pv": pv_moves
                })
                    
    except asyncio.CancelledError:
        raise

