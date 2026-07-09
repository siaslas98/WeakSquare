import { Link } from 'react-router-dom';

export default function NavBar(){
  return (
    <nav className="flex justify-evenly">
      <Link className="navLink p-4" to="/">Games </Link>
      <Link className= "navLink p-4" to="/analysis">Analyze </Link>
      <Link className= "navLink p-4" to="/training">Training Queue </Link>
    </nav>
  );
}