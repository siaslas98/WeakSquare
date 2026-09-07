import { Link } from 'react-router-dom';

export default function NavBar(){
  return (
    <nav className="flex w-[85%] max-w-[1000px] mx-auto justify-evenly mb-[40px] py-2 bg-gradient-to-b from-[#94C5CC] to-[#B4D2E7]">
      <Link className="navLink px-4 py-2" to="/">Games </Link>
      <Link className= "navLink px-4 py-2" to="/analysis">Analyze </Link>
      <Link className= "navLink px-4 py-2" to="/training">Training Queue </Link>
    </nav>
  );
}
