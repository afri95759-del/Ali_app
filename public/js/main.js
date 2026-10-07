// ============================================
// Main Logic - Ali App
// ============================================

import { auth, db, ADMIN_EMAIL } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  addDoc,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let isSignUp = false;
let currentUser = null;

// ============================================
// مراقبة حالة المستخدم
// ============================================
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  const loginBtn = document.getElementById('loginBtn');
  const adminIcon = document.getElementById('adminIcon');
  
  if (user) {
    loginBtn.innerHTML = `<span>👤</span> ${user.email.split('@')[0]}`;
    loginBtn.onclick = handleLogout;
    
    // إظهار أيقونة الأدمن فقط للمسؤول
    if (user.email === ADMIN_EMAIL) {
      adminIcon.classList.remove('hidden');
    } else {
      adminIcon.classList.add('hidden');
    }
  } else {
    loginBtn.innerHTML = `<span>👤</span> تسجيل الدخول`;
    loginBtn.onclick = () => openModal('authModal');
    adminIcon.classList.add('hidden');
  }
});

// ============================================
// تسجيل الخروج
// ============================================
async function handleLogout() {
  if (confirm('هل تريد تسجيل الخروج؟')) {
    await signOut(auth);
    location.reload();
  }
}

// ============================================
// فتح/إغلاق النوافذ
// ============================================
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

document.getElementById('closeAuth').onclick = () => closeModal('authModal');
document.getElementById('closeApp').onclick = () => closeModal('appModal');

// ============================================
// تبديل بين تسجيل الدخول/إنشاء حساب
// ============================================
document.getElementById('switchAuth').onclick = (e) => {
  e.preventDefault();
  isSignUp = !isSignUp;
  document.getElementById('authTitle').textContent = isSignUp ? 'إنشاء حساب' : 'تسجيل الدخول';
  document.getElementById('authSubmit').textContent = isSignUp ? 'إنشاء حساب' : 'دخول';
  document.getElementById('switchText').textContent = isSignUp ? 'لديك حساب؟' : 'ليس لديك حساب؟';
  document.getElementById('switchAuth').textContent = isSignUp ? 'سجل الدخول' : 'أنشئ حساباً';
};

// ============================================
// نموذج المصادقة
// ============================================
document.getElementById('authForm').onsubmit = async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    if (isSignUp) {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('✅ تم إنشاء الحساب بنجاح!');
    } else {
      await signInWithEmailAndPassword(auth, email, password);
      alert('✅ تم تسجيل الدخول!');
    }
    closeModal('authModal');
    location.reload();
  } catch (err) {
    alert('❌ خطأ: ' + err.message);
  }
};

// ============================================
// الدخول بحساب Google
// ============================================
document.getElementById('googleLogin').onclick = async () => {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    closeModal('authModal');
    location.reload();
  } catch (err) {
    alert('❌ خطأ: ' + err.message);
  }
};

// ============================================
// تحميل التطبيقات
// ============================================
async function loadApps() {
  const grid = document.getElementById('appsGrid');
  try {
    const snapshot = await getDocs(collection(db, 'apps'));
    
    if (snapshot.empty) {
      grid.innerHTML = '<div class="loading">📭 لا توجد تطبيقات بعد</div>';
      return;
    }
    
    grid.innerHTML = '';
    snapshot.forEach(docSnap => {
      const app = { id: docSnap.id, ...docSnap.data() };
      grid.appendChild(createAppCard(app));
    });
  } catch (err) {
    grid.innerHTML = `<div class="loading">❌ خطأ: ${err.message}</div>`;
  }
}

// ============================================
// إنشاء بطاقة التطبيق
// ============================================
function createAppCard(app) {
  const card = document.createElement('div');
  card.className = 'app-card';
  card.innerHTML = `
    <img class="app-icon" src="${app.iconUrl || 'https://via.placeholder.com/72/6366f1/ffffff?text=App'}" alt="${app.name}">
    <h3>${app.name}</h3>
    <p class="developer">${app.developer || 'غير معروف'}</p>
    <div class="app-rating">⭐ ${app.rating || '0.0'}</div>
  `;
  card.onclick = () => showAppDetail(app);
  return card;
}

// ============================================
// عرض تفاصيل التطبيق
// ============================================
async function showAppDetail(app) {
  const content = document.getElementById('appDetailContent');
  
  // جلب التعليقات
  let reviews = [];
  try {
    const reviewsSnap = await getDocs(
      query(collection(db, 'reviews'), where('appId', '==', app.id))
    );
    reviews = reviewsSnap.docs.map(d => d.data());
  } catch (e) {
    console.log('لا توجد تعليقات بعد');
  }
  
  content.innerHTML = `
    <div style="display:flex; gap:20px; margin-bottom:24px;">
      <img src="${app.iconUrl || 'https://via.placeholder.com/100/6366f1/ffffff?text=App'}" 
           style="width:100px; height:100px; border-radius:24px; object-fit:cover;">
      <div>
        <h2>${app.name}</h2>
        <p style="color:var(--text-muted);">${app.developer || 'غير معروف'}</p>
        <p style="color:var(--warning); margin-top:8px;">⭐ ${app.rating || '0.0'} (${reviews.length} تقييم)</p>
      </div>
    </div>
    
    <p style="margin-bottom:20px; line-height:1.8; color:var(--text-secondary);">${app.description || 'لا يوجد وصف'}</p>
    
    ${app.screenshots?.length ? `
      <h4 style="margin-bottom:12px;">📸 لقطات الشاشة</h4>
      <div style="display:flex; gap:12px; overflow-x:auto; margin-bottom:20px; padding-bottom:8px;">
        ${app.screenshots.map(s => `<img src="${s}" style="height:200px; border-radius:12px; flex-shrink:0;">`).join('')}
      </div>
    ` : ''}
    
    ${app.apkUrl ? `
      <a href="${app.apkUrl}" download class="btn btn-primary btn-lg" style="text-decoration:none; display:flex;">
        ⬇️ تحميل APK
      </a>
    ` : '<p style="color:var(--text-muted); text-align:center;">⚠️ لا يوجد ملف APK</p>'}
    
    <h4 style="margin:24px 0 12px;">💬 التقييمات</h4>
    <div id="reviewsList">
      ${reviews.length ? reviews.map(r => `
        <div style="background:var(--bg-input); padding:14px; border-radius:12px; margin-bottom:10px;">
          <strong>${r.userName || 'مستخدم'}</strong>
          <span style="color:var(--warning);">${'⭐'.repeat(r.rating || 5)}</span>
          <p style="margin-top:6px; color:var(--text-muted); font-size:14px;">${r.comment || ''}</p>
        </div>
      `).join('') : '<p style="color:var(--text-muted);">لا توجد تقييمات بعد</p>'}
    </div>
  `;
  
  openModal('appModal');
}

// ============================================
// البحث في التطبيقات
// ============================================
document.getElementById('searchInput').oninput = (e) => {
  const searchQuery = e.target.value.toLowerCase();
  document.querySelectorAll('.app-card').forEach(card => {
    const name = card.querySelector('h3')?.textContent.toLowerCase() || '';
    card.style.display = name.includes(searchQuery) ? '' : 'none';
  });
};

// ============================================
// التحميل الأولي
// ============================================
loadApps();
