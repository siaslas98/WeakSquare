import { useEffect, useState } from 'react';
import axios from "axios";
import './App.css';

function UploadFile() {
  const [selectedFile, setSelectedFile] = useState(null);
	const onFileChange = (event) => {
		setSelectedFile(event.target.files[0]);
	};

  const onFileUpload = () => {
		const formData = new FormData();
		formData.append(
			"myFile",
			selectedFile,
			selectedFile.name
		);
		console.log(selectedFile);
		axios.post( 
      `${import.meta.env.VITE_API_URL}/uploadFile`, 
      formData
    );
	};

  const fileData = () => {
		if (selectedFile) {
			return (
				<div>
					<h2>File Details:</h2>
					<p>File Name: {selectedFile.name}</p>
					<p>File Type: {selectedFile.type}</p>
					<p>
						Last Modified: {new Date(selectedFile.lastModified).toDateString()}
					</p>
				</div>
			);
		} else {
			return (
				<div>
					<br />
					<h4>Choose before Pressing the Upload button</h4>
				</div>
			);
		}
	};

  return (
		<div>
			<div>
				<input type="file" className="border-2 border-indigo-600 hover:bg-sky-700 p-4 cursor-pointer" onChange={onFileChange} />
				<button onClick={onFileUpload}>Upload!</button>
			</div>
			{fileData()}
		</div>
	);
}

function App() {
  const [status, setStatus] = useState(null);

  return (
    <div className="p-4">
      <h1 className="mb-[2rem]">WeakSquare</h1>
      <UploadFile />
    </div>
  );
}

export default App
