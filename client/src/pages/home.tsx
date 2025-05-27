import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Shield, Lock, Upload, Key, Settings, Download, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileDropzone } from "@/components/file-dropzone";
import { MediaTypeSelector } from "@/components/media-type-selector";
import { StatusCard } from "@/components/status-card";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaKey, setMediaKey] = useState("");
  const [mediaType, setMediaType] = useState("audio");
  const [decryptedBlob, setDecryptedBlob] = useState<Blob | null>(null);
  const [decryptionResult, setDecryptionResult] = useState<{
    status: 'success' | 'error' | null;
    originalSize?: number;
    decryptedSize?: number;
    mediaType?: string;
    error?: string;
  }>({ status: null });

  const { toast } = useToast();

  const decryptMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/decrypt', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    },
    onSuccess: async (response) => {
      const blob = await response.blob();
      setDecryptedBlob(blob);
      setDecryptionResult({
        status: 'success',
        originalSize: selectedFile?.size,
        decryptedSize: blob.size,
        mediaType: mediaType,
      });
      toast({
        title: "Success",
        description: "File decrypted successfully!",
      });
    },
    onError: (error: Error) => {
      setDecryptionResult({
        status: 'error',
        error: error.message,
      });
      toast({
        title: "Decryption Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to decrypt",
        variant: "destructive",
      });
      return;
    }

    if (!mediaKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a media key",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('mediaKey', mediaKey.trim());
    formData.append('mediaType', mediaType);

    setDecryptionResult({ status: null });
    decryptMutation.mutate(formData);
  };

  const handleDownload = () => {
    if (!decryptedBlob || !selectedFile) return;

    const url = URL.createObjectURL(decryptedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `decrypted_${selectedFile.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setDecryptionResult({ status: null });
    setDecryptedBlob(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8" />
              <h1 className="text-2xl font-medium">WhatsApp Media Decryptor</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Lock className="w-4 h-4 text-green-300" />
              <span className="text-green-300">Secure</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Decryption Card */}
