from database import Base
from sqlalchemy import Column, Integer, String, TIMESTAMP, Text, text


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, nullable=False)
    pgn_hash = Column(String, unique=True, nullable=False)
    white_player = Column(String)
    black_player = Column(String)
    event = Column(String)
    site = Column(String)
    round_tag = Column(String)
    date = Column(String)
    result = Column(String)
    time_control = Column(String)
    eco = Column(String)
    opening = Column(String)
    raw_pgn = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("now()"))
