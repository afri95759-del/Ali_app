// ============================================
// Netlify Function - Upload File
// Ali App
// ============================================

import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  // التحقق من طريقة الطلب
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const type = formData.get('type') || 'file';
    
    // التحقق من وجود الملف
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // توليد اسم فريد للملف
    const originalName = file.name || 'file';
    const ext = originalName.split('.').pop() || 'bin';
    const fileName = `${type}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    
    // تخزين في Netlify Blobs
    const store = getStore('ali-app-files');
    const arrayBuffer = await file.arrayBuffer();
    
    await store.set(fileName, arrayBuffer, {
      metadata: { 
        contentType: file.type || 'application/octet-stream',
        originalName: originalName,
        uploadedAt: new Date().toISOString()
      }
    });
    
    // إرجاع رابط الملف
    return new Response(JSON.stringify({ 
      url: `/.netlify/functions/get-file?key=${encodeURIComponent(fileName)}`,
      key: fileName,
      size: arrayBuffer.byteLength
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    console.error('Upload error:', err);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = { path: "/api/upload" };
