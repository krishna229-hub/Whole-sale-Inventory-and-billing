import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
import Spinner from '../components/Spinner';
import ConfirmModal from '../components/ConfirmModal';
import { FiPlus, FiSearch, FiEdit, FiTrash, FiAlertTriangle, FiFilter } from 'react-icons/fi';

const Inventory = () => {
  const { user } = useContext(AuthContext);
  const { showSuccess, showError, showWarning } = useContext(ToastContext);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Form inputs state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    brand: '',
    purchasePrice: '',
    sellingPrice: '',
    stockQuantity: '',
    supplierName: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const isAdmin = user?.role === 'admin';

  // Fetch products list
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedBrand) params.brand = selectedBrand;
      if (showLowStockOnly) params.lowStock = 'true';

      const response = await API.get('/products', { params });
      if (response.data.success) {
        const sortedProducts = response.data.data.sort((a, b) => 
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );
        setProducts(sortedProducts);
        
        const sortedCategories = response.data.categories.sort((a, b) => 
          a.localeCompare(b, undefined, { sensitivity: 'base' })
        );
        setCategories(sortedCategories);
        
        const sortedBrands = response.data.brands.sort((a, b) => 
          a.localeCompare(b, undefined, { sensitivity: 'base' })
        );
        setBrands(sortedBrands);
      }
    } catch (error) {
      showError('Could not load products. Please check connection.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedCategory, selectedBrand, showLowStockOnly]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (formErrors[e.target.name]) {
      setFormErrors({
        ...formErrors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.sku.trim()) errors.sku = 'SKU is required';
    if (!formData.category.trim()) errors.category = 'Category is required';
    if (!formData.brand.trim()) errors.brand = 'Brand is required';
    
    if (formData.purchasePrice === '' || Number(formData.purchasePrice) < 0) {
      errors.purchasePrice = 'Purchase price must be positive';
    }
    if (formData.sellingPrice === '' || Number(formData.sellingPrice) < 0) {
      errors.sellingPrice = 'Selling price must be positive';
    } else if (Number(formData.sellingPrice) < Number(formData.purchasePrice)) {
      showWarning('Selling price is less than purchase price. Profit margin is negative.');
    }
    if (formData.stockQuantity === '' || Number(formData.stockQuantity) < 0) {
      errors.stockQuantity = 'Stock must be positive';
    }
    if (!formData.supplierName.trim()) errors.supplierName = 'Supplier name is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAddModal = () => {
    setCurrentProduct(null);
    setFormData({
      name: '',
      sku: '',
      category: '',
      brand: '',
      purchasePrice: '',
      sellingPrice: '',
      stockQuantity: '',
      supplierName: ''
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      brand: product.brand,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      stockQuantity: product.stockQuantity,
      supplierName: product.supplierName
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (currentProduct) {
        // Edit Product
        const response = await API.put(`/products/${currentProduct._id}`, formData);
        if (response.data.success) {
          showSuccess('Product updated successfully.');
          setIsFormOpen(false);
          fetchProducts();
        }
      } else {
        // Add Product
        const response = await API.post('/products', formData);
        if (response.data.success) {
          showSuccess('New product registered.');
          setIsFormOpen(false);
          fetchProducts();
        }
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Action failed.');
    }
  };

  const handleOpenDeleteModal = (id) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await API.delete(`/products/${deleteId}`);
      if (response.data.success) {
        showSuccess('Product deleted successfully.');
        setIsDeleteOpen(false);
        fetchProducts();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Delete operation failed.');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">
            Inventory Database
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Register and monitor wholesale items, manage supplier credentials and stock levels.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 active:scale-[0.98] text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md shadow-sky-500/20 transition-all shrink-0"
          >
            <FiPlus size={18} /> Add Product
          </button>
        )}
      </div>

      {/* Search and Filters panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by SKU or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all text-sm cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{c}</option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all text-sm cursor-pointer"
            >
              <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">All Brands</option>
              {brands.map((b) => (
                <option key={b} value={b} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{b}</option>
              ))}
            </select>
          </div>

          {/* Low stock check */}
          <div className="flex items-center gap-2 py-2">
            <input
              id="lowStockCheck"
              type="checkbox"
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
              className="w-4.5 h-4.5 text-sky-500 border-slate-300 rounded-sm focus:ring-sky-500 dark:bg-slate-800 dark:border-slate-700 focus:ring-offset-2 cursor-pointer"
            />
            <label htmlFor="lowStockCheck" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
              Show Low Stock Only
            </label>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-24">
            <Spinner size="lg" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-24 text-center text-slate-400 dark:text-slate-500 text-sm">
            No products match search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Product details</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Category / Brand</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pricing</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Stock Qty</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {products.map((product) => {
                  const isLow = product.stockQuantity < 5;
                  return (
                    <tr key={product._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800 dark:text-white block">
                          {product.name}
                        </span>
                      </td>

                      {/* SKU */}
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-lg uppercase tracking-wide">
                          {product.sku}
                        </span>
                      </td>

                      {/* Category & Brand */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 dark:text-slate-300 block font-medium">
                          {product.category}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 block mt-0.5">
                          {product.brand}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col">
                          <span className="text-slate-800 dark:text-white font-semibold">
                            S: {formatCurrency(product.sellingPrice)}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            P: {formatCurrency(product.purchasePrice)}
                          </span>
                        </div>
                      </td>

                      {/* Stock Quantity */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`text-sm font-bold ${isLow ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>
                            {product.stockQuantity} pcs
                          </span>
                          {isLow && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 px-2 py-0.5 rounded-sm">
                              <FiAlertTriangle size={10} /> Low stock
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                          {product.supplierName}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/20 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <FiEdit size={16} />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenDeleteModal(product._id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                              title="Delete Product"
                            >
                              <FiTrash size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Add / Edit Product */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsFormOpen(false)}></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left shadow-2xl transition-all w-full max-w-xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
                {currentProduct ? 'Edit Wholesale Product' : 'Add New Wholesale Product'}
              </h3>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Product Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. Steel Rods 12mm"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                    {formErrors.name && <p className="text-xs text-rose-500 mt-1">{formErrors.name}</p>}
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">SKU / Product Code</label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      placeholder="e.g. SR-12MM-STD"
                      disabled={!!currentProduct} // Disable editing SKU
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                    />
                    {formErrors.sku && <p className="text-xs text-rose-500 mt-1">{formErrors.sku}</p>}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Category</label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      placeholder="e.g. Construction Materials"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                    {formErrors.category && <p className="text-xs text-rose-500 mt-1">{formErrors.category}</p>}
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Brand</label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      placeholder="e.g. Tata Steel"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                    {formErrors.brand && <p className="text-xs text-rose-500 mt-1">{formErrors.brand}</p>}
                  </div>

                  {/* Supplier */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Supplier Name</label>
                    <input
                      type="text"
                      name="supplierName"
                      value={formData.supplierName}
                      onChange={handleInputChange}
                      placeholder="e.g. Jindal Distributors"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                    {formErrors.supplierName && <p className="text-xs text-rose-500 mt-1">{formErrors.supplierName}</p>}
                  </div>

                  {/* Purchase Price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Purchase Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="purchasePrice"
                      value={formData.purchasePrice}
                      onChange={handleInputChange}
                      placeholder="350.00"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                    {formErrors.purchasePrice && <p className="text-xs text-rose-500 mt-1">{formErrors.purchasePrice}</p>}
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Selling Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="sellingPrice"
                      value={formData.sellingPrice}
                      onChange={handleInputChange}
                      placeholder="450.00"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                    {formErrors.sellingPrice && <p className="text-xs text-rose-500 mt-1">{formErrors.sellingPrice}</p>}
                  </div>

                  {/* Stock Quantity */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      name="stockQuantity"
                      value={formData.stockQuantity}
                      onChange={handleInputChange}
                      placeholder="e.g. 150"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    />
                    {formErrors.stockQuantity && <p className="text-xs text-rose-500 mt-1">{formErrors.stockQuantity}</p>}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-2.5 text-sm font-semibold border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-bold bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-md shadow-sky-500/10 active:scale-[0.98]"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Delete Wholesale Product"
        message="Are you sure you want to delete this product? This action is permanent and will remove it from the catalog."
        confirmText="Yes, Delete"
        cancelText="No, Keep"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};

export default Inventory;
