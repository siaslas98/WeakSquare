import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState(null);

   useEffect(() => {
    fetch("http://localhost:8000/health")
      .then((r) => r.json())
      .then((data) => {
        console.log(data);
        setStatus(data.status);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="p-4">
      <h1>WeakSquare</h1>
      <p>Backend status: {status ?? "loading..."}</p>
    </div>
  );
}

export default App
