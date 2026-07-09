import {useState, useEffect} from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';

export default function GamesList({onGameLoaded}){
  const [games, setGames] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGames = async () => {
      await axios.get(`${import.meta.env.VITE_API_URL}/gamesList`)
      .then((res) => {
        console.log(res.data); 
        setGames(res.data);
      })
    };

    fetchGames();
    const interval = setInterval(fetchGames, 5000);
   
    return () => clearInterval(interval);
  }, []);

  const handleAnalyze = (pgn) => {
    onGameLoaded(pgn);
    navigate("/analysis");
  } 
  return(
   <>
    <div>
      <ul>
        {games.map((game) => (
          <li href="#" key={game.id} className="flex justify-evenly my-[15px] border-3 border-orange-800 items-center">
            <div className="flex flex-wrap">
              <span className="w-full">White: {game.white_player}</span>
              <span className="w-full">Black: {game.black_player}</span>
            </div>
            <span>Result: {game.result}</span>
            <span>Event: {game.event}</span>
            <span>Date: {game.date}</span>
            <button onClick={() => handleAnalyze(game.pgn)}>Analyze</button>
          </li>
        ))}
      </ul>
    </div>
   </> 
  );
}