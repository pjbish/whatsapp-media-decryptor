import { CheckCircle, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatusCardProps {
  status: 'success' | 'error' | null;
  originalSize?: number;
  decryptedSize?: number;
  mediaType?: string;
  error?: string;
  onDownload?: () => void;
}

export function StatusCard({ 
  status, 
  originalSize, 
  decryptedSize, 
  mediaType, 
  error, 
  onDownload 
}: StatusCardProps) {
  if (!status) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (status === 'success') {
    return (
      <div className="bg-card rounded-lg shadow-xl p-6 mb-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-success text-xl" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Decryption Successful!</h3>
            <p className="text-gray-600 mb-4">Your WhatsApp media file has been successfully decrypted.</p>
            
            {(originalSize || decryptedSize || mediaType) && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {originalSize && (
                    <div>
                      <span className="font-medium text-gray-500">Original Size:</span>
                      <span className="ml-2 text-gray-800">{formatFileSize(originalSize)}</span>
                    </div>
                  )}
                  {decryptedSize && (
                    <div>
                      <span className="font-medium text-gray-500">Decrypted Size:</span>
                      <span className="ml-2 text-gray-800">{formatFileSize(decryptedSize)}</span>
                    </div>
                  )}
                  {mediaType && (
                    <div>
                      <span className="font-medium text-gray-500">Media Type:</span>
                      <span className="ml-2 text-gray-800 capitalize">{mediaType}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {onDownload && (
              <Button 
                onClick={onDownload}
                className="bg-success text-white hover:bg-green-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Decrypted File
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-card rounded-lg shadow-xl p-6 mb-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-error text-xl" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Decryption Failed</h3>
            <p className="text-gray-600 mb-4">There was an error decrypting your file. Please check the following:</p>
            
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 mb-4">
              <li>Ensure the media key is correct and properly formatted</li>
              <li>Verify that the uploaded file is an encrypted WhatsApp media file</li>
              <li>Check that the selected media type matches the file</li>
            </ul>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800 mb-1">Error Details:</p>
              <p className="text-sm text-red-700">{error || 'Unknown error occurred'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
