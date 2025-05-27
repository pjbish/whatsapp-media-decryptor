import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import crypto from "crypto";
import { decryptionRequestSchema } from "@shared/schema";
import { ZodError } from "zod";

const upload = multer({
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // WhatsApp media decryption endpoint
  app.post('/api/decrypt', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: 'No file uploaded' 
        });
      }

      // Validate request body
      const validation = decryptionRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          success: false, 
          error: `Validation error: ${validation.error.errors.map(e => e.message).join(', ')}` 
        });
      }

      const { mediaKey, mediaType } = validation.data;
      const fileBuffer = req.file.buffer;
      const originalSize = fileBuffer.length;

      // Validate media key format (should be base64)
      let mediaKeyBuffer: Buffer;
      try {
        mediaKeyBuffer = Buffer.from(mediaKey, 'base64');
      } catch (error) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid media key format. Must be base64 encoded.' 
        });
      }

      // WhatsApp media type info strings
      const infoStrings: Record<string, string> = {
        image: 'WhatsApp Image Keys',
        video: 'WhatsApp Video Keys',
        audio: 'WhatsApp Audio Keys',
        voice: 'WhatsApp Audio Keys',
        document: 'WhatsApp Document Keys',
      };

      const infoString = infoStrings[mediaType];
      if (!infoString) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid media type' 
        });
      }

      try {
        // WhatsApp key derivation process
        const info = Buffer.concat([
          Buffer.from(infoString, 'utf-8'),
          Buffer.from([0x01]),
        ]);

        // Step 1: HMAC-SHA256 with 32-byte zero key
        const key = crypto.createHmac('sha256', Buffer.alloc(32)).update(mediaKeyBuffer).digest();
        
        // Step 2: HKDF expand to get AES key and IV key
        const expandedKey = crypto.createHmac('sha256', key).update(info).digest();

        // Validate file structure
        if (fileBuffer.length < 26) { // 16 (IV) + 10 (MAC) minimum
          return res.status(400).json({ 
            success: false, 
            error: 'File too small to be a valid encrypted WhatsApp media file' 
          });
        }

        // Extract components from encrypted file
        const iv = fileBuffer.slice(0, 16);
        const cipherText = fileBuffer.slice(16, fileBuffer.length - 10);
        const mac = fileBuffer.slice(fileBuffer.length - 10);
        const aesKey = expandedKey.slice(0, 32);

        // Decrypt using AES-256-GCM
        const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
        decipher.setAuthTag(mac);
        
        let decrypted: Buffer;
        try {
          const decryptedChunks = [decipher.update(cipherText), decipher.final()];
          decrypted = Buffer.concat(decryptedChunks);
        } catch (decryptError) {
          return res.status(400).json({ 
            success: false, 
            error: 'Decryption failed. Invalid media key or corrupted file.' 
          });
        }

        const decryptedSize = decrypted.length;

        // Set appropriate content type based on media type
        const contentTypes: Record<string, string> = {
          image: 'image/jpeg',
          video: 'video/mp4',
          audio: 'audio/ogg',
          voice: 'audio/ogg',
          document: 'application/octet-stream',
        };

        const contentType = contentTypes[mediaType] || 'application/octet-stream';
        
        // Set headers for file download
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="decrypted_${req.file.originalname}"`);
        res.setHeader('Content-Length', decryptedSize.toString());
        
        // Send the decrypted file
        res.send(decrypted);

      } catch (cryptoError) {
        console.error('Crypto error:', cryptoError);
        return res.status(500).json({ 
          success: false, 
          error: 'Cryptographic operation failed' 
        });
      }

    } catch (error) {
      console.error('Decryption error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Internal server error during decryption' 
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'WhatsApp Media Decryptor' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
