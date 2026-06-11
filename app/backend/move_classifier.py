import math
import chess

def score_for_player(white_score: int, color: chess.Color) -> int:
  return white_score if color == chess.WHITE else -white_score

def expected_points(cp: int, rating: int = 1500) -> float:
  return 1 / (1+ math.exp(-cp / 400))

def classify_expected_points_loss(loss: float) -> str:
  if loss <= 0:
    return "Best"
  if loss <= 0.02:
    return "Excellent"
  if loss <= 0.05:
    return "Good"
  if loss <= 0.10:
    return "Inaccuracy"
  if loss <= 0.20:
    return "Mistake"
  return "Blunder"