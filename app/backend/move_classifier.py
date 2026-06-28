import math
import chess


def score_for_player(white_score: int, color: chess.Color) -> int:
  return white_score if color == chess.WHITE else -white_score

def expected_points_from_cp(cp: int) -> float:
  clamped_cp = max(-1000, min(1000, cp))
  return 1 / (1 + math.exp(-clamped_cp / 400))

def classify_expected_points_loss(loss: float) -> str:
  if loss <= 0:
    return "best"
  if loss <= 0.03:
    return "excellent"
  if loss <= 0.08:
    return "good"
  if loss <= 0.15:
    return "inaccuracy"
  if loss <= 0.3:
    return "mistake"
  return "blunder"
