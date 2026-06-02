import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASE = '/api';

const emptyProductForm = {
  id: '',
  name: '',
  sku: '',
  description: '',
  quantity: 0,
  costPrice: '',
  sellingPrice: '',
  lowStockThreshold: ''
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('stockflow_token') || '');
  const [activeView, setActiveView] = useState(token ? 'dashboard' : 'auth');
  const [message, setMessage] = useState({ text: '', error: false });
  const [profile, setProfile] = useState(null);

  const [authForm, setAuthForm] = useState({
    signup: { organizationName: '', email: '', password: '' },
    login: { email: '', password: '' }
  });

  const [dashboard, setDashboard] = useState({
    totalProducts: 0,
    totalQuantity: 0,
    lowStockItems: []
  });

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [productForm, setProductForm] = useState(emptyProductForm);

  const [settings, setSettings] = useState({ defaultLowStockThreshold: 5 });

  const isAuthenticated = Boolean(token);

  const api = async (path, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  };

  const showMessage = (text, error = false) => {
    setMessage({ text, error });
  };

  const loadProfile = async () => {
    const me = await api('/auth/me');
    setProfile(me);
  };

  const loadSettings = async () => {
    const data = await api('/settings');
    setSettings({ defaultLowStockThreshold: data.defaultLowStockThreshold ?? 5 });
  };

  const loadDashboard = async () => {
    const data = await api('/dashboard');
    setDashboard(data);
  };

  const loadProducts = async (searchValue = '') => {
    const query = searchValue ? `?search=${encodeURIComponent(searchValue)}` : '';
    const data = await api(`/products${query}`);
    setProducts(data);
  };

  const refreshApp = async () => {
    await Promise.all([loadProfile(), loadSettings(), loadDashboard(), loadProducts(search)]);
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setActiveView('auth');
        setProfile(null);
        return;
      }

      try {
        await refreshApp();
        if (activeView === 'auth') {
          setActiveView('dashboard');
        }
      } catch (error) {
        localStorage.removeItem('stockflow_token');
        setToken('');
        setProfile(null);
        setActiveView('auth');
        showMessage('Session expired. Please login again.', true);
      }
    };

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const lowStockCount = useMemo(() => dashboard.lowStockItems.length, [dashboard.lowStockItems]);

  const handleSignup = async (event) => {
    event.preventDefault();
    try {
      const data = await api('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(authForm.signup)
      });

      localStorage.setItem('stockflow_token', data.token);
      setToken(data.token);
      setActiveView('dashboard');
      showMessage('Account created successfully');
    } catch (error) {
      showMessage(error.message, true);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify(authForm.login)
      });

      localStorage.setItem('stockflow_token', data.token);
      setToken(data.token);
      setActiveView('dashboard');
      showMessage('Login successful');
    } catch (error) {
      showMessage(error.message, true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('stockflow_token');
    setToken('');
    setProducts([]);
    setProductForm(emptyProductForm);
    showMessage('Logged out');
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        name: productForm.name,
        sku: productForm.sku,
        description: productForm.description,
        quantity: Number(productForm.quantity),
        costPrice: productForm.costPrice,
        sellingPrice: productForm.sellingPrice,
        lowStockThreshold: productForm.lowStockThreshold
      };

      if (productForm.id) {
        await api(`/products/${productForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showMessage('Product updated');
      } else {
        await api('/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showMessage('Product created');
      }

      setProductForm(emptyProductForm);
      await Promise.all([loadProducts(search), loadDashboard()]);
    } catch (error) {
      showMessage(error.message, true);
    }
  };

  const editProduct = (product) => {
    setProductForm({
      id: product.id,
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      quantity: product.quantity ?? 0,
      costPrice: product.costPrice ?? '',
      sellingPrice: product.sellingPrice ?? '',
      lowStockThreshold: product.lowStockThreshold ?? ''
    });
    setActiveView('products');
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) {
      return;
    }

    try {
      await api(`/products/${id}`, { method: 'DELETE' });
      showMessage('Product deleted');
      await Promise.all([loadProducts(search), loadDashboard()]);
    } catch (error) {
      showMessage(error.message, true);
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    try {
      await api('/settings', {
        method: 'PUT',
        body: JSON.stringify({
          defaultLowStockThreshold: Number(settings.defaultLowStockThreshold)
        })
      });
      showMessage('Settings saved');
      await Promise.all([loadSettings(), loadDashboard(), loadProducts(search)]);
    } catch (error) {
      showMessage(error.message, true);
    }
  };

  const handleSearchChange = async (value) => {
    setSearch(value);
    if (!isAuthenticated) return;

    try {
      await loadProducts(value);
    } catch (error) {
      showMessage(error.message, true);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>StockFlow MVP</h1>
        <div className="topbar-right">
          <span className="org-chip">{profile?.organization?.name || 'Not logged in'}</span>
          {isAuthenticated && (
            <button type="button" className="btn secondary" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="layout">
        <aside className="sidebar">
          {['auth', 'dashboard', 'products', 'settings'].map((view) => (
            <button
              key={view}
              type="button"
              className={`nav-btn ${activeView === view ? 'active' : ''}`}
              onClick={() => {
                if (!isAuthenticated && view !== 'auth') {
                  showMessage('Please login first', true);
                  return;
                }
                setActiveView(view);
              }}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </aside>

        <section className="content">
          {activeView === 'auth' && (
            <section className="auth-grid">
              <form className="card" onSubmit={handleSignup}>
                <h2>Sign Up</h2>
                <label>
                  Organization Name
                  <input
                    value={authForm.signup.organizationName}
                    onChange={(event) => {
                      setAuthForm((current) => ({
                        ...current,
                        signup: {
                          ...current.signup,
                          organizationName: event.target.value
                        }
                      }));
                    }}
                    required
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={authForm.signup.email}
                    onChange={(event) => {
                      setAuthForm((current) => ({
                        ...current,
                        signup: {
                          ...current.signup,
                          email: event.target.value
                        }
                      }));
                    }}
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    minLength={6}
                    value={authForm.signup.password}
                    onChange={(event) => {
                      setAuthForm((current) => ({
                        ...current,
                        signup: {
                          ...current.signup,
                          password: event.target.value
                        }
                      }));
                    }}
                    required
                  />
                </label>
                <button type="submit" className="btn">
                  Create Account
                </button>
              </form>

              <form className="card" onSubmit={handleLogin}>
                <h2>Login</h2>
                <label>
                  Email
                  <input
                    type="email"
                    value={authForm.login.email}
                    onChange={(event) => {
                      setAuthForm((current) => ({
                        ...current,
                        login: {
                          ...current.login,
                          email: event.target.value
                        }
                      }));
                    }}
                    required
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={authForm.login.password}
                    onChange={(event) => {
                      setAuthForm((current) => ({
                        ...current,
                        login: {
                          ...current.login,
                          password: event.target.value
                        }
                      }));
                    }}
                    required
                  />
                </label>
                <button type="submit" className="btn">
                  Login
                </button>
              </form>
            </section>
          )}

          {activeView === 'dashboard' && isAuthenticated && (
            <section className="dashboard-grid">
              <div className="stats-row">
                <article className="card stat-card">
                  <p>Total Products</p>
                  <strong>{dashboard.totalProducts}</strong>
                </article>
                <article className="card stat-card">
                  <p>Total Quantity</p>
                  <strong>{dashboard.totalQuantity}</strong>
                </article>
                <article className="card stat-card">
                  <p>Low Stock Count</p>
                  <strong>{lowStockCount}</strong>
                </article>
              </div>

              <article className="card">
                <h2>Low Stock Items</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Quantity</th>
                      <th>Threshold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.lowStockItems.length === 0 ? (
                      <tr>
                        <td colSpan={4}>No low stock items</td>
                      </tr>
                    ) : (
                      dashboard.lowStockItems.map((item) => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.sku}</td>
                          <td>{item.quantity}</td>
                          <td>{item.lowStockThreshold}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </article>
            </section>
          )}

          {activeView === 'products' && isAuthenticated && (
            <section className="products-layout">
              <form className="card form-grid" onSubmit={saveProduct}>
                <h2>{productForm.id ? 'Edit Product' : 'Add Product'}</h2>
                <label>
                  Name
                  <input
                    value={productForm.name}
                    onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  SKU
                  <input
                    value={productForm.sku}
                    onChange={(event) => setProductForm((current) => ({ ...current, sku: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Description
                  <input
                    value={productForm.description}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, description: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Quantity
                  <input
                    type="number"
                    value={productForm.quantity}
                    onChange={(event) => setProductForm((current) => ({ ...current, quantity: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Cost Price
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.costPrice}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, costPrice: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Selling Price
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.sellingPrice}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, sellingPrice: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Low Stock Threshold
                  <input
                    type="number"
                    min="0"
                    value={productForm.lowStockThreshold}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        lowStockThreshold: event.target.value
                      }))
                    }
                  />
                </label>

                <div className="form-actions">
                  <button type="submit" className="btn">
                    Save Product
                  </button>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => setProductForm(emptyProductForm)}
                  >
                    Clear
                  </button>
                </div>
              </form>

              <article className="card">
                <div className="table-head">
                  <h2>Products</h2>
                  <input
                    placeholder="Search name or SKU"
                    value={search}
                    onChange={(event) => handleSearchChange(event.target.value)}
                  />
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Qty</th>
                      <th>Low Stock</th>
                      <th>Selling Price</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={6}>No products yet</td>
                      </tr>
                    ) : (
                      products.map((product) => {
                        const threshold = product.lowStockThreshold ?? settings.defaultLowStockThreshold;
                        const isLow = product.quantity <= threshold;

                        return (
                          <tr key={product.id}>
                            <td>{product.name}</td>
                            <td>{product.sku}</td>
                            <td>{product.quantity}</td>
                            <td className={isLow ? 'low' : ''}>{isLow ? 'Yes' : 'No'}</td>
                            <td>{product.sellingPrice ?? '-'}</td>
                            <td className="row-actions">
                              <button
                                type="button"
                                className="btn secondary"
                                onClick={() => editProduct(product)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn danger"
                                onClick={() => deleteProduct(product.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </article>
            </section>
          )}

          {activeView === 'settings' && isAuthenticated && (
            <section className="settings-layout">
              <form className="card settings-card" onSubmit={saveSettings}>
                <h2>Settings</h2>
                <label>
                  Default Low Stock Threshold
                  <input
                    type="number"
                    min="0"
                    value={settings.defaultLowStockThreshold}
                    onChange={(event) =>
                      setSettings({ defaultLowStockThreshold: event.target.value })
                    }
                    required
                  />
                </label>
                <button type="submit" className="btn">
                  Save Settings
                </button>
              </form>
            </section>
          )}

          {message.text && <p className={`message ${message.error ? 'error' : ''}`}>{message.text}</p>}
        </section>
      </main>
    </div>
  );
}

export default App;
