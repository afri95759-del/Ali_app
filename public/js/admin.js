// ============================================
// Admin Panel Logic - Ali App
// ============================================

import { auth, db, ADMIN_EMAIL } from './firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc,
  doc,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ============================================
// حماية الصفحة (فقط للأدمن)
// ============================================
onAuthStateChanged(auth, (user) => {
  if (!user || user.email !== ADMIN_EMAIL) {
    alert('⛔ غير مصرح لك بالدخول');
    window.location.href = 'index.html';
  }
});

// ============================================
// تسجيل الخروج
// ============================================
document.getElementById('logoutBtn').onclick = async () => {
  if (confirm('هل تريد تسجيل الخروج؟')) {
    await signOut(auth);
    window.location.href = 'index.html';
  }
};

// ============================================
// التنقل بين الأقسام
// ============================================
document.querySelectorAll('.sidebar nav a[href^="#"]').forEach(link => {
  link.onclick = (e) => {
    e.preventDefault();
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('active'));
    link.classList.add('active');
    
    const target = document.querySelector(link.getAttribute('href'));
    if (target) target.classList.remove('hidden');
    
    if (link.getAttribute('href') === '#manage-apps') loadAppsList();
    if (link.getAttribute('href') === '#reviews') loadReviews();
  };
});

// ============================================
// رفع ملف إلى Netlify Blobs
// ============================================
async function uploadFile(file, type) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  
  if (!res.ok) throw new Error('فشل رفع الملف');
  const data = await res.json();
  return data.url;
}

// ============================================
// إضافة تطبيق جديد
// ============================================
document.getElementById('addAppForm').onsubmit = async (e) => {
  e.preventDefault();
  
  const progress = document.getElementById('uploadProgress');
  const bar = progress.querySelector('.progress-bar');
  progress.classList.remove('hidden');
  bar.style.width = '10%';
  
  try {
    const iconFile = document.getElementById('appIcon').files[0];
    const screenshotFiles = document.getElementById('appScreenshots').files;
    const apkFile = document.getElementById('appApk').files[0];
    
    // رفع الأيقونة
    let iconUrl = '';
    if (iconFile) {
      bar.style.width = '30%';
      iconUrl = await uploadFile(iconFile, 'icon');
    }
    
    // رفع لقطات الشاشة
    const screenshots = [];
    if (screenshotFiles.length > 0) {
      bar.style.width = '50%';
      for (const file of screenshotFiles) {
        screenshots.push(await uploadFile(file, 'screenshot'));
      }
    }
    
    // رفع APK
    let apkUrl = '';
    if (apkFile) {
      bar.style.width = '80%';
      apkUrl = await uploadFile(apkFile, 'apk');
    }
    
    // حفظ في Firestore
    bar.style.width = '95%';
    await addDoc(collection(db, 'apps'), {
      name: document.getElementById('appName').value,
      developer: document.getElementById('appDeveloper').value,
      description: document.getElementById('appDescription').value,
      version: document.getElementById('appVersion').value || '1.0.0',
      category: document.getElementById('appCategory').value,
      iconUrl,
      screenshots,
      apkUrl,
      rating: 0,
      createdAt: serverTimestamp()
    });
    
    bar.style.width = '100%';
    alert('✅ تم حفظ التطبيق بنجاح!');
    e.target.reset();
    setTimeout(() => {
      progress.classList.add('hidden');
      bar.style.width = '0%';
    }, 1500);
    
  } catch (err) {
    alert('❌ خطأ: ' + err.message);
    progress.classList.add('hidden');
    bar.style.width = '0%';
  }
};

// ============================================
// قائمة التطبيقات
// ============================================
async function loadAppsList() {
  const list = document.getElementById('appsList');
  list.innerHTML = '<p style="color:var(--text-muted);">⏳ جاري التحميل...</p>';
  
  try {
    const snapshot = await getDocs(collection(db, 'apps'));
    
    if (snapshot.empty) {
      list.innerHTML = '<p style="color:var(--text-muted);">لا توجد تطبيقات بعد</p>';
      return;
    }
    
    list.innerHTML = '';
    snapshot.forEach(docSnap => {
      const app = docSnap.data();
      const item = document.createElement('div');
      item.className = 'app-card';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '16px';
      item.innerHTML = `
        <img src="${app.iconUrl || 'https://via.placeholder.com/60/6366f1/ffffff?text=App'}" 
             style="width:60px; height:60px; border-radius:14px; object-fit:cover;">
        <div style="flex:1;">
          <h3>${app.name}</h3>
          <p style="color:var(--text-muted); font-size:13px;">${app.developer || 'غير معروف'}</p>
        </div>
        <button class="btn btn-outline" onclick="deleteApp('${docSnap.id}')">🗑️ حذف</button>
      `;
      list.appendChild(item);
    });
  } catch (err) {
    list.innerHTML = `<p style="color:var(--danger);">❌ خطأ: ${err.message}</p>`;
  }
}

// ============================================
// حذف تطبيق
// ============================================
window.deleteApp = async (id) => {
  if (confirm('هل تريد حذف هذا التطبيق؟')) {
    try {
      await deleteDoc(doc(db, 'apps', id));
      loadAppsList();
    } catch (err) {
      alert('❌ خطأ: ' + err.message);
    }
  }
};

// ============================================
// تحميل التعليقات
// ============================================
async function loadReviews() {
  const list = document.getElementById('reviewsList');
  list.innerHTML = '<p style="color:var(--text-muted);">⏳ جاري التحميل...</p>';
  
  try {
    const snapshot = await getDocs(collection(db, 'reviews'));
    
    if (snapshot.empty) {
      list.innerHTML = '<p style="color:var(--text-muted);">لا توجد تعليقات بعد</p>';
      return;
    }
    
    list.innerHTML = '';
    snapshot.forEach(docSnap => {
      const r = docSnap.data();
      const item = document.createElement('div');
      item.style.cssText = 'background:var(--bg-card); padding:16px; border-radius:12px; margin-bottom:12px; border:1.5px solid var(--border);';
      item.innerHTML = `
        <strong>${r.userName || 'مستخدم'}</strong> 
        <span style="color:var(--warning);">${'⭐'.repeat(r.rating || 5)}</span>
        <p style="margin-top:8px; color:var(--text-muted);">${r.comment || ''}</p>
        <button class="btn btn-outline" style="margin-top:8px;" onclick="deleteReview('${docSnap.id}')">🗑️ حذف</button>
      `;
      list.appendChild(item);
    });
  } catch (err) {
    list.innerHTML = `<p style="color:var(--danger);">❌ خطأ: ${err.message}</p>`;
  }
}

// ============================================
// حذف تعليق
// ============================================
window.deleteReview = async (id) => {
  if (confirm('حذف هذا التعليق؟')) {
    try {
      await deleteDoc(doc(db, 'reviews', id));
      loadReviews();
    } catch (err) {
      alert('❌ خطأ: ' + err.message);
    }
  }
};
