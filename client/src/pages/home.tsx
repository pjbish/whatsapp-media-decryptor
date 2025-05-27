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
        <div className="bg-card rounded-lg shadow-xl p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-3xl font-medium text-gray-800 mb-2">Decrypt WhatsApp Media</h2>
            <p className="text-gray-600">Upload encrypted WhatsApp media files and provide the corresponding media key for decryption.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Section */}
            <div className="space-y-4">
              <Label className="block text-sm font-medium text-gray-700">
                <Upload className="w-4 h-4 inline mr-2" />
                Encrypted Media File
              </Label>
              
              <FileDropzone
                onFileSelect={setSelectedFile}
                selectedFile={selectedFile}
                onFileRemove={handleFileRemove}
              />
            </div>

            {/* Media Key Input */}
            <div className="space-y-2">
              <Label htmlFor="mediaKey" className="block text-sm font-medium text-gray-700">
                <Key className="w-4 h-4 inline mr-2" />
                Media Key (Base64)
              </Label>
              <Textarea
                id="mediaKey"
                name="mediaKey"
                rows={3}
                placeholder="Paste your base64 encoded media key here..."
                className="w-full resize-none font-mono text-sm"
                value={mediaKey}
                onChange={(e) => setMediaKey(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                <Info className="w-3 h-3 inline mr-1" />
                The media key should be exactly as provided by WhatsApp's encryption protocol
              </p>
            </div>

            {/* Media Type Selection */}
            <div className="space-y-2">
              <Label className="block text-sm font-medium text-gray-700">
                <Settings className="w-4 h-4 inline mr-2" />
                Media Type
              </Label>
              <MediaTypeSelector
                selectedType={mediaType}
                onTypeSelect={setMediaType}
              />
            </div>

            {/* Decrypt Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={decryptMutation.isPending}
                className="w-full bg-primary text-white py-4 px-6 text-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50"
              >
                {decryptMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Decrypting...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Decrypt Media File
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Status Card */}
        <StatusCard
          status={decryptionResult.status}
          originalSize={decryptionResult.originalSize}
          decryptedSize={decryptionResult.decryptedSize}
          mediaType={decryptionResult.mediaType}
          error={decryptionResult.error}
          onDownload={decryptedBlob ? handleDownload : undefined}
        />

        {/* Info Card */}
        <div className="bg-card rounded-lg shadow-xl p-6">
          <h3 className="text-xl font-medium text-gray-800 mb-4">
            <Info className="w-6 h-6 text-primary inline mr-2" />
            How It Works
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Upload className="text-primary w-8 h-8" />
              </div>
              <h4 className="font-medium text-gray-800 mb-2">1. Upload File</h4>
              <p className="text-sm text-gray-600">Select your encrypted WhatsApp media file</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Key className="text-primary w-8 h-8" />
              </div>
              <h4 className="font-medium text-gray-800 mb-2">2. Enter Key</h4>
              <p className="text-sm text-gray-600">Provide the base64 encoded media key</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Settings className="text-primary w-8 h-8" />
              </div>
              <h4 className="font-medium text-gray-800 mb-2">3. Select Type</h4>
              <p className="text-sm text-gray-600">Choose the correct media type</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Download className="text-primary w-8 h-8" />
              </div>
              <h4 className="font-medium text-gray-800 mb-2">4. Download</h4>
              <p className="text-sm text-gray-600">Get your decrypted media file</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="text-warning w-5 h-5 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800 mb-1">Security Notice</p>
                <p className="text-yellow-700">This tool uses WhatsApp's standard encryption protocol with HMAC-SHA256 key derivation and AES-256-GCM decryption. All processing is done securely and files are not stored on our servers.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400">&copy; 2024 WhatsApp Media Decryptor. Built with security and privacy in mind.</p>
        </div>
      </footer>
    </div>
  );
}
