// ============================================
// Netlify Function - Get File
// Ali App
// ============================================

import { getStore } from '@netlify/blobs';

export default async (req) => {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    
    // التحقق من وجود المفتاح
    if (!key) {
      return new Response('Key parameter required', { 
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
    
    // جلب الملف من التخزين
    const store = getStore('ali-app-files');
    const blob = await store.get(key, { type: 'arrayBuffer' });
    
    if (!blob) {
      return new Response('File not found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
    
    // جلب معلومات الملف
    let contentType = 'application/octet-stream';
    try {
      const metadata = await store.getMetadata(key);
      if (metadata?.metadata?.contentType) {
        contentType = metadata.metadata.contentType;
      }
    } catch (e) {
      // تجاهل الخطأ واستخدام النوع الافتراضي
    }
    
    // تحديد ما إذا كان الملف للتحميل المباشر (APK)
    const isApk = key.endsWith('.apk');
    const disposition = isApk ? 'attachment' : 'inline';
    const fileName = key.split('/').pop();
    
    return new Response(blob, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (err) {
    console.error('Get file error:', err);
    return new Response(`Error: ${err.message}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
};

export const config = { path: "/api/get-file" };
