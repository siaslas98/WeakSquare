import MoveNaviationButton from "./moveNagivationButton";
import { FaArrowLeft } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa";


export default function MoveNavigation(buttonProps){

  return (
    <div className="flex justify-center gap-[10px]">
      <MoveNaviationButton name='left' logo={<FaArrowLeft />} {...buttonProps} />
      <MoveNaviationButton name='right' logo={<FaArrowRight />} {...buttonProps} />
    </div>
  );
}
