
import React, { useCallback, useState } from 'react';
import { useToast } from '../context/ToastContext';

interface ImageDropzoneProps {
  onImageSelected: (fileData: { url: string; fileName: string; mimeType: string }) => void;
  currentImage?: string;
  onRemove?: () => void;
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({ onImageSelected, currentImage, onRemove }) => {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit for localStorage safety
      toast.error('Image must be smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        onImageSelected({
          url: reader.result as string,
          fileName: file.name,
          mimeType: file.type,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  if (currentImage) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-coffee-200 group">
        <img src={currentImage} alt="Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button 
            type="button"
            onClick={onRemove}
            className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-600"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors cursor-pointer relative ${
        isDragging ? 'border-volt-400 bg-volt-400/10' : 'border-coffee-200 hover:border-coffee-900 bg-coffee-50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileInput} 
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
      <div className="text-center p-4">
        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 text-coffee-400">
          <i className="fas fa-image text-xl"></i>
        </div>
        <p className="text-sm font-bold text-coffee-900">Click or Drag Image</p>
        <p className="text-xs text-coffee-500 mt-1">Max 2MB (Pro Tip: Use landscape)</p>
      </div>
    </div>
  );
};

export default ImageDropzone;
