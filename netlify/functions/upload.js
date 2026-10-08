import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  // 📋 سجل تفصيلي في Console
  console.log('=== UPLOAD FUNCTION CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ 
      error: 'Method not allowed',
      received: req.method 
    }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    console.log('Step 1: Parsing form data...');
    const formData = await req.formData();
    const file = formData.get('file');
    const type = formData.get('type') || 'file';
    
    console.log('File received:', file?.name, 'Size:', file?.size, 'Type:', file?.type);
    
    if (!file) {
      return new Response(JSON.stringify({ 
        error: 'No file provided',
        formDataKeys: Array.from(formData.keys())
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Step 2: Getting blob store...');
    const store = getStore('ali-app-files');
    
    console.log('Step 3: Generating filename...');
    const originalName = file.name || 'file';
    const ext = originalName.split('.').pop() || 'bin';
    const fileName = `${type}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    console.log('Generated filename:', fileName);
    
    console.log('Step 4: Converting to array buffer...');
    const arrayBuffer = await file.arrayBuffer();
    console.log('Array buffer size:', arrayBuffer.byteLength);
    
    console.log('Step 5: Setting in store...');
    await store.set(fileName, arrayBuffer, {
      metadata: { 
        contentType: file.type || 'application/octet-stream',
        originalName: originalName
      }
    });
    console.log('Step 6: Success! File stored.');
    
    return new Response(JSON.stringify({ 
      url: `/.netlify/functions/get-file?key=${encodeURIComponent(fileName)}`,
      key: fileName,
      size: arrayBuffer.byteLength
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    console.error('=== UPLOAD ERROR ===');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    
    return new Response(JSON.stringify({ 
      error: err.message,
      errorName: err.name,
      errorStack: err.stack?.split('\n').slice(0, 5).join('\n'),
      step: 'check-console-logs'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = { path: "/api/upload" };
