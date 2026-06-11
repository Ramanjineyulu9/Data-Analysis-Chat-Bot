import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';

export default function CsvUpload({ onFileSelect }) {
  const [file, setFile] = useState(null);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1
  });

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 bg-white'}`}
    >
      <input {...getInputProps()} />
      <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      {file ? (
        <p className="text-sm font-medium text-gray-900">{file.name}</p>
      ) : (
        <div>
          <p className="text-sm font-medium text-gray-900">Drag & drop a CSV file here, or click to select</p>
          <p className="text-xs text-gray-500 mt-2">Only .csv files are supported</p>
        </div>
      )}
    </div>
  );
}
