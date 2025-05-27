import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { FolderOpen, CloudUpload, File, X } from "lucide-react";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onFileRemove: () => void;
}

export function FileDropzone({ onFileSelect, selectedFile, onFileRemove }: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.enc,.crypt,.encrypted,*';
    input.onchange = handleFileInput;
    input.click();
  };

  if (selectedFile) {
    return (
      <div className="border-2 border-dashed border-primary rounded-lg p-8 text-center bg-blue-50">
        <div className="flex items-center justify-center space-x-3">
          <File className="text-primary text-2xl" />
          <div className="text-left">
            <p className="font-medium text-gray-800">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onFileRemove}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragOver 
          ? 'border-primary bg-blue-50' 
          : 'border-gray-300 bg-gray-50 hover:border-primary hover:bg-gray-100'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <CloudUpload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <p className="text-lg font-medium text-gray-600 mb-2">Drop your encrypted file here</p>
      <p className="text-sm text-gray-500 mb-4">or click to browse</p>
      <Button type="button" className="bg-primary text-white hover:bg-blue-700">
        <FolderOpen className="w-4 h-4 mr-2" />
        Browse Files
      </Button>
    </div>
  );
}
