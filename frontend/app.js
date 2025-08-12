// Modal ve ilgili elementleri seçiyoruz
const modal = document.getElementById('resultModal');
const modalResultDiv = document.getElementById('modal-result');
const closeButton = document.querySelector('.close-button');
const modalTitle = document.getElementById('modalTitle');
const copyButton = document.getElementById('copy-button');

// Profil ve çıkış bölümlerini seçiyoruz
const profileSection = document.getElementById('profile-section');
const profileInfo = document.getElementById('profile-info');
const btnLogout = document.getElementById('btn-logout');
const urlContainer = document.getElementById('url-container');
const authContainer = document.getElementById('auth-container');
const profileContainer = document.getElementById('profile-container');

const passwordInput = document.getElementById('password');

// URL kısaltma formunun submit olayını dinliyoruz
document.getElementById('shorten-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const url = document.getElementById('url').value;
  const customCode = document.getElementById('customCode').value;
  const ttl = document.getElementById('ttl').value;
  const password = passwordInput.style.display !== 'none' ? passwordInput.value.trim() : null;

  modalTitle.textContent = '⏳ Yükleniyor...';
  modalResultDiv.innerHTML = '';
  modal.style.display = 'flex';

  try {
    const token = localStorage.getItem('token');
    const bodydata = { url, customCode, ttl };
    if (password) {
      bodydata.password = password;
    }
    const response = await fetch('http://localhost:5000/shorten', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': 'Bearer ' + token })
      },
      body: JSON.stringify(bodydata)
    });

    const data = await response.json();

    if (response.ok) {
      modalTitle.textContent = 'Kısaltma Başarılı!';
      modalResultDiv.innerHTML = `
        <p>
          <a id="shortUrlLink" href="${data.shortUrl}" target="_blank">${data.shortUrl}</a>
        </p>
        <button class="copy-button">Kopyala</button>
      `;

      document.querySelector('.copy-button').addEventListener('click', () => {
        const shortUrl = document.getElementById('shortUrlLink').href;
        navigator.clipboard.writeText(shortUrl).then(() => {
          const copyButton = document.querySelector('.copy-button');
          copyButton.textContent = 'Kopyalandı!';
          copyButton.classList.add('copied');
          setTimeout(() => {
            copyButton.textContent = 'Kopyala';
            copyButton.classList.remove('copied');
          }, 2000);
        }).catch(err => {
          alert('Kopyalama başarısız oldu: ' + err);
        });
      });

    } else {
      modalTitle.textContent = 'Hata!';
      modalResultDiv.innerHTML = `<p style="color: red;">❌ Hata: ${data.error}</p>`;
    }
  } catch (err) {
    modalTitle.textContent = 'Hata!';
    modalResultDiv.innerHTML = `<p style="color: red;">🚫 Sunucuya bağlanılamadı.</p>`;
  }
});

closeButton.addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
  if (event.target === modal) {
    modal.style.display = 'none';
  }
});

// ----------------
// Kimlik doğrulama (Auth) işlemleri
// ----------------

const authButtonsWrapper = document.getElementById('auth-buttons-wrapper');
const authFormsWrapper = document.getElementById('auth-forms-wrapper');

const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');
const btnBack = document.getElementById('btn-back');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const resultDiv = document.getElementById('auth-result');

async function showProfile() {
  authContainer.style.display = 'none';
  urlContainer.style.display = 'block';
  profileSection.style.display = 'block';
  profileContainer.style.display = 'block';

  passwordInput.style.display = 'block';

  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch('http://localhost:5000/profile', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();

    if (res.ok) {
      profileInfo.innerHTML = `
        <p><b>Kullanıcı adı:</b> ${data.user.username}</p>
        <p><b>Email:</b> ${data.user.email}</p>
        <h3>Kısa URL'lerim</h3>
        <div class="url-list">
          ${data.urls.map(url => `
            <div class="url-box">
              <strong>${url.short_code}</strong> &rarr;
              <a href="${url.shortUrl}" target="_blank">${url.shortUrl}</a>
              <span>(${url.click_count} tıklama)</span>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      profileInfo.textContent = data.error || 'Profil bilgisi alınamadı.';
    }
  } catch {
    profileInfo.textContent = 'Profil bilgisi alınamadı.';
  }
}

btnLogout.addEventListener('click', function () {
  localStorage.removeItem('token');
  profileSection.style.display = 'none';
  authContainer.style.display = 'block';
  urlContainer.style.display = 'block';
  profileContainer.style.display = 'none';
  passwordInput.style.display = 'none';
});

btnLogin.addEventListener('click', () => {
  authButtonsWrapper.style.display = 'none';
  authFormsWrapper.style.display = 'block';

  loginForm.style.display = 'flex';
  registerForm.style.display = 'none';

  resultDiv.innerHTML = '';
});

btnRegister.addEventListener('click', () => {
  authButtonsWrapper.style.display = 'none';
  authFormsWrapper.style.display = 'block';

  loginForm.style.display = 'none';
  registerForm.style.display = 'flex';

  resultDiv.innerHTML = '';
});

btnBack.addEventListener('click', () => {
  authButtonsWrapper.style.display = 'block';
  authFormsWrapper.style.display = 'none';

  resultDiv.innerHTML = '';
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const res = await fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      await showProfile();
    } else {
      resultDiv.innerHTML = `<p style="color: red;">${data.error}</p>`;
    }
  } catch {
    resultDiv.innerHTML = `<p style="color: red;">Sunucuya bağlanılamadı.</p>`;
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  try {
    const res = await fetch('http://localhost:5000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      resultDiv.innerHTML = `<p style="color: green;">Kayıt başarılı! Şimdi giriş yapabilirsiniz.</p>`;
      btnBack.click();
      btnLogin.click();
    } else {
      resultDiv.innerHTML = `<p style="color: red;">${data.error}</p>`;
    }
  } catch {
    resultDiv.innerHTML = `<p style="color: red;">Sunucuya bağlanılamadı.</p>`;
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (token) {
    showProfile();
  } else {
    profileContainer.style.display = 'none';
    authContainer.style.display = 'block';
    urlContainer.style.display = 'block';
    passwordInput.style.display = 'none';
  }
});

// Şifre giriş formunu yöneten modal ve diğer elementler
const passwordModal = document.createElement('div');
passwordModal.className = 'modal';
passwordModal.innerHTML = `
  <div class="modal-content">
    <span class="close-button" id="passwordModalClose">&times;</span>
    <h2 id="passwordModalTitle">Bu URL şifre korumalıdır.</h2>
    <p>Lütfen devam etmek için şifreyi girin.</p>
    <form id="password-form">
      <input type="password" id="urlPasswordInput" placeholder="Şifre" required />
      <button type="submit">Gönder</button>
    </form>
    <p id="password-form-message" style="color: red; margin-top: 10px;"></p>
  </div>
`;
document.body.appendChild(passwordModal);

const passwordForm = document.getElementById('password-form');
const urlPasswordInput = document.getElementById('urlPasswordInput');
const passwordModalClose = document.getElementById('passwordModalClose');
const passwordFormMessage = document.getElementById('password-form-message');

function closePasswordModal() {
  passwordModal.style.display = 'none';
  passwordFormMessage.textContent = '';
  urlPasswordInput.value = '';
}

passwordModalClose.addEventListener('click', closePasswordModal);
window.addEventListener('click', (event) => {
  if (event.target === passwordModal) {
    closePasswordModal();
  }
});

async function submitPassword(shortCode, password) {
  passwordFormMessage.textContent = 'Şifre doğrulanıyor...';
  passwordFormMessage.style.color = 'black';

  try {
    const response = await fetch(`http://localhost:5000/${shortCode}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();

    if (response.ok) {
      if (data.longUrl) {
        passwordFormMessage.textContent = 'Şifre doğru, yönlendiriliyorsunuz...';
        passwordFormMessage.style.color = 'green';

        setTimeout(() => {
          window.location.replace(data.longUrl);
        }, 1000); // 1 saniye sonra yönlendir
      } else {
        passwordFormMessage.textContent = 'Yönlendirme yapılamıyor: URL bilgisi eksik.';
        passwordFormMessage.style.color = 'red';
      }
    } else {
      passwordFormMessage.textContent = `Hata: ${data.error || 'Şifre yanlış.'}`;
      passwordFormMessage.style.color = 'red';
    }
  } catch (error) {
    console.error('Şifre doğrulama hatası:', error);
    passwordFormMessage.textContent = 'Şifre doğrulama sırasında bir hata oluştu.';
    passwordFormMessage.style.color = 'red';
  }
}

document.addEventListener('click', async (event) => {
  if (event.target.tagName === 'A' && event.target.href.includes('localhost:5000')) {
    event.preventDefault();

    const shortUrl = event.target.href;
    const shortCode = shortUrl.split('/').pop();

    try {
      const response = await fetch(shortUrl, {
        method: 'GET',
      });

      if (response.status === 401) {
        const data = await response.json();
        if (data.requiresPassword) {
          passwordModal.style.display = 'flex';
          passwordForm.onsubmit = async (e) => {
            e.preventDefault();
            const password = urlPasswordInput.value;
            await submitPassword(shortCode, password);
          };
        }
      } else {
        // Eğer 401 değilse, tarayıcıyı normal bir şekilde yönlendir.
        window.location.href = shortUrl;
      }

    } catch (error) {
      console.error('Link kontrol hatası:', error);
      window.location.href = shortUrl;
    }
  }
});