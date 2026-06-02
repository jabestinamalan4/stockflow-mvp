const apiBase = '/api';
let token = localStorage.getItem('stockflow_token') || '';
let dashboardCache = null;

const el = (id) => document.getElementById(id);

const setMessage = (text, isError = false) => {
  const messageEl = el('message');
  messageEl.textContent = text;
  messageEl.style.color = isError ? '#c93f3f' : '#0c4b3b';
};

const api = async (path, method = 'GET', body) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Request failed');
  }
  return payload;
};

const switchAuthTab = (tab) => {
  const showLogin = tab === 'login';
  el('loginForm').classList.toggle('hidden', !showLogin);
  el('signupForm').classList.toggle('hidden', showLogin);
  el('showLoginBtn').classList.toggle('active', showLogin);
  el('showSignupBtn').classList.toggle('active', !showLogin);
};

const showView = (viewId) => {
  document.querySelectorAll('.view').forEach((view) => {
    view.classList.toggle('hidden', view.id !== viewId);
  });

  document.querySelectorAll('.subtab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.view === viewId);
  });
};

const setAuthenticatedUI = (isAuthenticated) => {
  el('authSection').classList.toggle('hidden', isAuthenticated);
  el('appSection').classList.toggle('hidden', !isAuthenticated);
  el('logoutBtn').classList.toggle('hidden', !isAuthenticated);
  el('userBadge').classList.toggle('hidden', !isAuthenticated);
};

const loadProfile = async () => {
  const me = await api('/auth/me');
  el('userBadge').textContent = `${me.email} - ${me.organization.name}`;
};

const loadDashboard = async () => {
  dashboardCache = await api('/dashboard');
  el('totalProducts').textContent = dashboardCache.totalProducts;
  el('totalQuantity').textContent = dashboardCache.totalQuantity;
  el('lowStockCount').textContent = dashboardCache.lowStockItems.length;

  const rows = dashboardCache.lowStockItems.map((item) => `
    <tr>
      <td>${item.name}</td>
      <td>${item.sku}</td>
      <td>${item.quantity}</td>
      <td>${item.lowStockThreshold}</td>
    </tr>
  `).join('');

  el('lowStockTable').innerHTML = rows || '<tr><td colspan="4">No low stock items</td></tr>';
};

const renderProducts = async () => {
  const search = el('searchInput').value.trim();
  const products = await api(`/products${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  const thresholdDefault = (await api('/settings')).defaultLowStockThreshold;

  el('productTable').innerHTML = products.map((product) => {
    const threshold = product.lowStockThreshold ?? thresholdDefault;
    const low = product.quantity <= threshold;

    return `
      <tr>
        <td>${product.name}</td>
        <td>${product.sku}</td>
        <td>${product.quantity}</td>
        <td class="${low ? 'low' : ''}">${low ? 'Yes' : 'No'}</td>
        <td>${product.sellingPrice ?? '-'}</td>
        <td>
          <button class="btn btn-secondary" onclick="editProduct(${product.id})">Edit</button>
          <button class="btn btn-secondary" onclick="removeProduct(${product.id})">Delete</button>
        </td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="6">No products yet</td></tr>';
};

const resetProductForm = () => {
  el('productForm').reset();
  el('productId').value = '';
  el('productQuantity').value = 0;
  el('productFormTitle').textContent = 'Add Product';
};

window.editProduct = async (id) => {
  const product = await api(`/products/${id}`);
  el('productId').value = product.id;
  el('productName').value = product.name;
  el('productSku').value = product.sku;
  el('productDescription').value = product.description || '';
  el('productQuantity').value = product.quantity;
  el('productCostPrice').value = product.costPrice ?? '';
  el('productSellingPrice').value = product.sellingPrice ?? '';
  el('productThreshold').value = product.lowStockThreshold ?? '';
  el('productFormTitle').textContent = 'Edit Product';
  el('productFormCard').classList.remove('hidden');
};

window.removeProduct = async (id) => {
  if (!window.confirm('Delete this product?')) return;

  try {
    await api(`/products/${id}`, 'DELETE');
    setMessage('Product deleted');
    await Promise.all([renderProducts(), loadDashboard()]);
  } catch (error) {
    setMessage(error.message, true);
  }
};

const loadSettings = async () => {
  const settings = await api('/settings');
  el('defaultThreshold').value = settings.defaultLowStockThreshold;
};

const refreshAppData = async () => {
  await Promise.all([loadDashboard(), renderProducts(), loadSettings()]);
};

el('showLoginBtn').addEventListener('click', () => switchAuthTab('login'));
el('showSignupBtn').addEventListener('click', () => switchAuthTab('signup'));

el('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const payload = await api('/auth/login', 'POST', {
      email: el('loginEmail').value,
      password: el('loginPassword').value
    });
    token = payload.token;
    localStorage.setItem('stockflow_token', token);
    setAuthenticatedUI(true);
    await loadProfile();
    await refreshAppData();
    setMessage('Logged in successfully');
  } catch (error) {
    setMessage(error.message, true);
  }
});

el('signupForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const payload = await api('/auth/signup', 'POST', {
      organizationName: el('signupOrg').value,
      email: el('signupEmail').value,
      password: el('signupPassword').value
    });
    token = payload.token;
    localStorage.setItem('stockflow_token', token);
    setAuthenticatedUI(true);
    await loadProfile();
    await refreshAppData();
    setMessage('Account created successfully');
  } catch (error) {
    setMessage(error.message, true);
  }
});

el('logoutBtn').addEventListener('click', () => {
  token = '';
  localStorage.removeItem('stockflow_token');
  setAuthenticatedUI(false);
  switchAuthTab('login');
  setMessage('Logged out');
});

document.querySelectorAll('.subtab').forEach((tab) => {
  tab.addEventListener('click', () => {
    showView(tab.dataset.view);
  });
});

el('searchInput').addEventListener('input', async () => {
  try {
    await renderProducts();
  } catch (error) {
    setMessage(error.message, true);
  }
});

el('newProductBtn').addEventListener('click', () => {
  resetProductForm();
  el('productFormCard').classList.remove('hidden');
});

el('cancelProductBtn').addEventListener('click', () => {
  el('productFormCard').classList.add('hidden');
  resetProductForm();
});

el('productForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  const id = el('productId').value;
  const data = {
    name: el('productName').value,
    sku: el('productSku').value,
    description: el('productDescription').value,
    quantity: Number(el('productQuantity').value),
    costPrice: el('productCostPrice').value,
    sellingPrice: el('productSellingPrice').value,
    lowStockThreshold: el('productThreshold').value
  };

  try {
    if (id) {
      await api(`/products/${id}`, 'PUT', data);
      setMessage('Product updated');
    } else {
      await api('/products', 'POST', data);
      setMessage('Product created');
    }

    el('productFormCard').classList.add('hidden');
    resetProductForm();
    await Promise.all([renderProducts(), loadDashboard()]);
  } catch (error) {
    setMessage(error.message, true);
  }
});

el('settingsForm').addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    await api('/settings', 'PUT', {
      defaultLowStockThreshold: Number(el('defaultThreshold').value)
    });
    setMessage('Settings saved');
    await Promise.all([renderProducts(), loadDashboard()]);
  } catch (error) {
    setMessage(error.message, true);
  }
});

const bootstrap = async () => {
  if (!token) {
    setAuthenticatedUI(false);
    return;
  }

  try {
    setAuthenticatedUI(true);
    await loadProfile();
    await refreshAppData();
  } catch (error) {
    token = '';
    localStorage.removeItem('stockflow_token');
    setAuthenticatedUI(false);
    setMessage('Session expired. Please login again.', true);
  }
};

bootstrap();
