import os
import io
import chess
import chess.pgn
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
origins = os.getenv("CORS_ORIGINS", "").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/uploadFile/")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    pgn = io.StringIO(contents.decode())

    game = chess.pgn.read_game(pgn)
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

