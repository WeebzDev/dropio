import { useState, useRef } from 'react';
import { DioUploader } from './utils/dropio';
import './App.css';

function App() {
  const [loading, setLoading] = useState(0);
  const [pending, setPending] = useState(false);
  const [resultData, setResultData] = useState(null);

  const abortRef = useRef(() => {});

  async function formAction(e) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const file = formData.get('image');

    if (!(file instanceof File)) {
      console.error('No file selected or invalid file input');
      return;
    }

    const { result } = await DioUploader({
      file,
      onProgress(percent) {
        setLoading(percent);
        console.log(`Uploading: ${percent}%`);
      },
      onStatusChange(isPending) {
        setPending(isPending);
      },
      setAbortHandler(abortFn) {
        abortRef.current = abortFn;
      },
    });

    if (!result.isError) {
      setResultData(result);
    } else {
      setPending(false);
      setLoading(0);
    }
  }

  const handleCancel = () => {
    if (abortRef.current) {
      abortRef.current();
      setPending(false);
      setLoading(0);
    }
  };

  return (
    <>
      <form onSubmit={formAction}>
        <input type='file' name='image' accept='image/*' />
        <button type='submit' disabled={pending}>
          Upload
        </button>
        <button type='button' onClick={handleCancel}>
          Cancel
        </button>
        <p>Loading : {loading}</p>
        <p>isPending : {pending ? 'true' : 'false'}</p>
        <p>Result : {resultData ? resultData.originalName : 'no data'}</p>
      </form>
    </>
  );
}

export default App;
