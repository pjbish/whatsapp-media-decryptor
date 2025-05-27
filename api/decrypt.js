const crypto = require('crypto');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse multipart form data manually for Vercel
    const contentType = req.headers['content-type'] || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Content-Type must be multipart/form-data' 
      });
    }

    // For Vercel, we need to handle the request body differently
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    // Parse the multipart data
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing boundary in multipart data' 
      });
    }

    const parts = body.toString('binary').split(`--${boundary}`);
    let fileBuffer = null;
    let mediaKey = '';
    let mediaType = '';

    // Parse each part
    for (const part of parts) {
      if (part.includes('Content-Disposition: form-data; name="file"')) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          const fileData = part.slice(headerEnd + 4, part.length - 2);
          fileBuffer = Buffer.from(fileData, 'binary');
        }
      } else if (part.includes('name="mediaKey"')) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          mediaKey = part.slice(headerEnd + 4, part.length - 2).trim();
        }
      } else if (part.includes('name="mediaType"')) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          mediaType = part.slice(headerEnd + 4, part.length - 2).trim();
        }
      }
    }

    if (!fileBuffer || !mediaKey || !mediaType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: file, mediaKey, or mediaType' 
      });
    }

    // Decode media key from base64
    let mediaKeyBuffer;
    try {
      mediaKeyBuffer = Buffer.from(mediaKey, 'base64');
    } catch (error) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid media key format. Must be base64 encoded.' 
      });
    }

    // WhatsApp media decryption
    const infoStrings = {
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
        error: 'Invalid media type. Must be: audio, video, image, voice, or document' 
      });
    }

    // Perform decryption
    const info = Buffer.concat([
      Buffer.from(infoString, 'utf-8'),
      Buffer.from([0x01]),
    ]);

    const key = crypto.createHmac('sha256', Buffer.alloc(32)).update(mediaKeyBuffer).digest();
    const expandedKey = crypto.createHmac('sha256', key).update(info).digest();

    if (fileBuffer.length < 26) {
      return res.status(400).json({ 
        success: false, 
        error: 'File too small to be a valid encrypted WhatsApp media file' 
      });
    }

    const iv = fileBuffer.slice(0, 16);
    const cipherText = fileBuffer.slice(16, fileBuffer.length - 10);
    const mac = fileBuffer.slice(fileBuffer.length - 10);
    const aesKey = expandedKey.slice(0, 32);

    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
      decipher.setAuthTag(mac);
      
      const decryptedChunks = [decipher.update(cipherText), decipher.final()];
      const decrypted = Buffer.concat(decryptedChunks);

      // Set appropriate headers
      const contentTypes = {
        image: 'image/jpeg',
        video: 'video/mp4',
        audio: 'audio/ogg',
        voice: 'audio/ogg',
        document: 'application/octet-stream',
      };

      const contentTypeHeader = contentTypes[mediaType] || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentTypeHeader);
      res.setHeader('Content-Disposition', `attachment; filename="decrypted_media"`);
      res.setHeader('Content-Length', decrypted.length.toString());
      
      return res.send(decrypted);

    } catch (decryptError) {
      return res.status(400).json({ 
        success: false, 
        error: 'Decryption failed. Invalid media key or corrupted file.' 
      });
    }

  } catch (error) {
    console.error('Decryption error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error during decryption' 
    });
  }
}
