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
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from database import db_engine, Base, get_db
from models import Game
from move_classifier import classify_expected_points_loss, expected_points_from_cp, score_for_player

engine: chess.engine.UciProtocol | None = None
Base.metadata.create_all(bind=db_engine)
engine_lock = asyncio.Lock()


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

@app.get("/gamesList")
async def get_games_list(db: Session = Depends(get_db)):
    games = db.query(Game.id,
                     Game.white_player,
                     Game.black_player,
                     Game.event,
                     Game.date,
                     Game.result,
                     Game.raw_pgn).order_by(Game.created_at.desc()).all()
    
    return [
        {
            "id": game.id,
            "white_player": game.white_player,
            "black_player": game.black_player,
            'event': game.event,
            "date": game.date,
            "result": game.result,
            "pgn": game.raw_pgn,
        }

        for game in games
    ]

@app.post("/uploadFile/")
async def upload_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    active_engine = engine
    if active_engine is None:
        return {"error": "Engine not initialized"}

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
    try:
        db.commit()
        db.refresh(db_game)
    except IntegrityError:
        db.rollback()

    board = game.board()
    moves = []
    node = game

    while node.variations:
        next_node = node.variation(0)

        move = next_node.move
        moving_color = board.turn
        fen_before = board.fen()
        san = board.san(move)

        async with engine_lock:
            before_info = await active_engine.analyse(board, chess.engine.Limit(depth=15))
        before_score = before_info.get("score")

        expected_before = None
        expected_after = None
        expected_points_loss = None
        classification = None

        if before_score is not None:
            before_white_score = before_score.white().score(mate_score=10000)
            if before_white_score is not None:
                before_player_score = score_for_player(before_white_score, moving_color)
                expected_before = expected_points_from_cp(before_player_score)

        board.push(move)
        fen_after = board.fen()

        async with engine_lock:
            after_info = await active_engine.analyse(board, chess.engine.Limit(depth=15))
        after_score = after_info.get("score")

        if after_score is not None:
            after_white_score = after_score.white().score(mate_score=10000)
            if after_white_score is not None:
                after_player_score = score_for_player(after_white_score, moving_color)
                expected_after = expected_points_from_cp(after_player_score)

        if expected_before is not None and expected_after is not None:
            expected_points_loss = expected_before - expected_after
            classification = classify_expected_points_loss(expected_points_loss)

        moves.append({
            "uci": move.uci(),
            "san": san,
            "fen_before": fen_before,
            "fen_after": fen_after,
            "expected_points_before": expected_before,
            "expected_points_after": expected_after,
            "expected_points_loss": expected_points_loss,
            "classification": classification,
        })

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
    async with engine_lock:
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

