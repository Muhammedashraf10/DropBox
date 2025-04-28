import { useState, useEffect } from 'react';
import { API } from 'aws-amplify';
import { checkAuth } from './auth';
import './App.css';

function FileManager() {
  const [files, setFiles] = useState([]);
  const [quota, setQuota] = useState(null);
  const [file, setFile] = useState(null);
  const [filePath, setFilePath] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadFiles();
    loadQuota();
  }, []);

  const loadFiles = async () => {
    try {
      await checkAuth();
      const response = await API.get('DropboxAPI', '/files');
      setFiles(response.files);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  const loadQuota = async () => {
    try {
      await checkAuth();
      const response = await API.get('DropboxAPI', '/quota');
      setQuota(response);
    } catch (error) {
      console.error('Error loading quota:', error);
    }
  };

  const uploadFile = async () => {
    try {
      await checkAuth();
      if (!file || !filePath) {
        alert('Please select a file and specify a path');
        return;
      }

      const fileSize = file.size;
      setProgress(0);

      // Initiate upload
      const initResponse = await API.get('DropboxAPI', `/upload?filePath=${filePath}&fileSize=${fileSize}`);
      const { uploadId, presignedUrls, s3Key } = initResponse;

      // Upload parts
      const parts = [];
      let uploadedParts = 0;
      for (const { partNumber, url } of presignedUrls) {
        const start = (partNumber - 1) * 100 * 1024 * 1024;
        const end = Math.min(start + 100 * 1024 * 1024, fileSize);
        const part = file.slice(start, end);
        const response = await fetch(url, {
          method: 'PUT',
          body: part,
        });
        const etag = response.headers.get('ETag');
        parts.push({ PartNumber: partNumber, ETag: etag });
        uploadedParts++;
        setProgress((uploadedParts / presignedUrls.length) * 100);
      }

      // Complete upload
      await API.post('DropboxAPI', '/complete-upload', {
        body: { uploadId, s3Key, parts },
      });

      alert('Upload complete');
      setProgress(0);
      loadFiles();
      loadQuota();
    } catch (error) {
      console.error('Upload error:', error);
      setProgress(0);
      try {
        await API.post('DropboxAPI', '/abort-upload', {
          body: { uploadId, s3Key },
        });
        alert('Upload failed and aborted');
      } catch (abortError) {
        console.error('Abort error:', abortError);
      }
    }
  };

  const downloadFile = async (filePath) => {
    try {
      await checkAuth();
      const response = await API.get('DropboxAPI', `/download?filePath=${filePath}`);
      window.location.href = response.presignedUrl;
    } catch (error) {
      console.error('Download error:', error);
      alert('Download error: ' + error.message);
    }
  };

  return (
    <div>
      <h2>File Manager</h2>
      <div>
        <h3>Quota</h3>
        {quota && (
          <p>
            {(quota.currentStorageBytes / 1e9).toFixed(2)} GB of {(quota.maxStorageBytes / 1e9).toFixed(2)} GB used
          </p>
        )}
      </div>
      <div>
        <h3>Upload File</h3>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <input
          type="text"
          placeholder="File path (e.g., documents/file.txt)"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
        />
        <button onClick={uploadFile}>Upload</button>
        {progress > 0 && <p>Upload Progress: {progress.toFixed(2)}%</p>}
      </div>
      <div>
        <h3>Files</h3>
        <ul>
          {files.map((file) => (
            <li key={file.filePath}>
              {file.fileName} ({(file.fileSize / 1e9).toFixed(2)} GB)
              <button onClick={() => downloadFile(file.filePath)}>Download</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default FileManager;
