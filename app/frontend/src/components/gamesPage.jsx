import {useState} from 'react';
import {Chess} from 'chess.js';
import axios from 'axios';

function FileUploader({setMoveList, setClassificationList}) {
  const [selectedFile, setSelectedFile] = useState(null);

	const onFileChange = (e) => { 
		setSelectedFile(e.target.files[0]);
	};

  const onFileUpload = async () => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = () => {
      const pgn = reader.result;
      const game = new Chess();
      game.loadPgn(pgn);
      setMoveList(game.history({verbose: true}));
    };
    reader.readAsText(selectedFile);

    // Send pgn file to the backend
		const formData = new FormData();
		formData.append(
			"file",
			selectedFile
		);
    await axios
    .post( 
      `${import.meta.env.VITE_API_URL}/uploadFile/`, 
      formData
    )
    .then((res) => {
      if (res.data.moves) {
        setClassificationList(res.data.moves.map((move) => move.classification));
      }

    })
    .catch((err) => console.error(err.response?.data ?? err));
	};

  return (
		<div>
			<div className ="flex justify-center gap-2">
				<input type="file" className="bg-sky-300 text-stone-900 border-2 rounded-[8px] p-4 cursor-pointer" onChange={onFileChange} />
				<button onClick={onFileUpload}>Upload</button>
			</div>
		</div>
	);
}

export default function GamesPage({setMoveList, setClassificationList}){
  return(
    <FileUploader setMoveList={setMoveList} setClassificationList={setClassificationList}/>
  );
}