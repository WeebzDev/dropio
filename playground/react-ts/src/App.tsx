import { useState } from 'react';
import { DioUploader } from './utils/dropio';
import type { UploadResult } from './libs/dropio/client';
import './App.css';

function App() {
  const [loading, setLoading] = useState<number>(0);
  const [pending, setPending] = useState<boolean>(false);
  const [resultData, setResultData] = useState<UploadResult | null>(null);

  async function formAction(e: React.FormEvent<HTMLFormElement>) {
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
    });

    if (!result.isError) {
      setResultData(result);
    } else {
      setPending(false);
      setLoading(0);
    }
  }

  return (
    <>
      <form onSubmit={formAction}>
        <input type='file' name='image' accept='image/*' />
        <button type='submit' disabled={pending}>
          Upload
        </button>
        <p>Loading : {loading}</p>
        <p>isPending : {pending ? 'true' : 'false'}</p>
        <p>Result : {resultData && !resultData.isError ? resultData.originalName : 'no data'}</p>
      </form>
    </>
  );
}

export default App;

