- Expected points model uses the change in expected points to classify a move.
- The ratings of the players have to be taken into account, e.g. higher rated players great and brilliant moves are different from lower rated player's great/brilliant move.

Input -> Engine Evaluation Score, Player Rating
Output -> Move Classification

eval_before_move
eval_after_move
expected_points_before = f(eval_before_move, rating)
expected_points_after = f(eval_after_move, rating)
expected_points_lost = expected_points_before - expected_points_after
classification = bucket(expected_points_lost)