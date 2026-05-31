import React, { useState, useEffect, useContext, useRef } from 'react';
import API from '../services/api';
import { ToastContext } from '../context/ToastContext';
import Spinner from '../components/Spinner';
import ConfirmModal from '../components/ConfirmModal';
import { FiPlus, FiTrash, FiFileText, FiPrinter, FiDownload, FiSearch, FiShoppingCart, FiRefreshCw, FiMaximize } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Billing = () => {
  const { showSuccess, showError, showWarning, showInfo } = useContext(ToastContext);

  // Database products (for lookup)
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Customer state
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: ''
  });

  // Barcode Scanner State
  const [barcodeInput, setBarcodeInput] = useState('');

  // Selected Billing Items
  const [items, setItems] = useState([]); // { product: ID, name, sku, quantity, sellingPrice, maxStock }
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [taxRate, setTaxRate] = useState(18); // Default 18% GST

  // Loading states
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  // Invoice Success modal state
  const [completedInvoice, setCompletedInvoice] = useState(null);

  // Fetch product catalog for search dropdown
  const searchCatalog = async () => {
    try {
      setCatalogLoading(true);
      const response = await API.get(`/products?search=${catalogSearch}`);
      if (response.data.success) {
        const sortedProducts = response.data.data.sort((a, b) => 
          a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
        );
        setCatalogProducts(sortedProducts);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      searchCatalog();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [catalogSearch]);

  // Barcode Scanner Action
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    try {
      setCatalogLoading(true);
      const response = await API.get(`/products?search=${barcodeInput.trim()}`);
      if (response.data.success && response.data.data.length > 0) {
        // Find exact match by SKU
        const exactMatch = response.data.data.find(
          p => p.sku.toLowerCase() === barcodeInput.trim().toLowerCase()
        );
        if (exactMatch) {
          addItemToCart(exactMatch);
          setBarcodeInput('');
        } else {
          showWarning('No exact SKU match found for scanned barcode.');
        }
      } else {
        showWarning('Product not found in catalog.');
      }
    } catch (error) {
      showError('Failed to scan product.');
    } finally {
      setCatalogLoading(false);
    }
  };

  // Pricing calculations
  const subtotal = items.reduce((acc, item) => acc + item.sellingPrice * item.quantity, 0);
  const tax = Number(((subtotal * taxRate) / 100).toFixed(2));
  const totalAmount = Number((subtotal + tax).toFixed(2));

  // Add item to POS cart
  const addItemToCart = (prod) => {
    if (prod.stockQuantity <= 0) {
      showWarning(`Product '${prod.name}' is out of stock!`);
      return;
    }

    const existingIndex = items.findIndex((i) => i.product === prod._id);

    if (existingIndex > -1) {
      const currentQty = items[existingIndex].quantity;
      if (currentQty >= prod.stockQuantity) {
        showWarning(`Cannot add more. Only ${prod.stockQuantity} units available.`);
        return;
      }
      const updatedItems = [...items];
      updatedItems[existingIndex].quantity += 1;
      setItems(updatedItems);
      showInfo(`Incremented quantity for ${prod.name}`);
    } else {
      setItems([
        ...items,
        {
          product: prod._id,
          name: prod.name,
          sku: prod.sku,
          quantity: 1,
          sellingPrice: prod.sellingPrice,
          maxStock: prod.stockQuantity
        }
      ]);
      showSuccess(`Added ${prod.name} to cart`);
    }
  };

  // Remove item from cart
  const removeItemFromCart = (index) => {
    const updated = items.filter((_, idx) => idx !== index);
    setItems(updated);
  };

  // Adjust item quantity manually
  const handleQuantityChange = (index, value) => {
    const val = parseInt(value, 10);
    if (isNaN(val) || val < 1) return;

    const updated = [...items];
    const item = updated[index];

    if (val > item.maxStock) {
      showWarning(`Only ${item.maxStock} units of '${item.name}' are available.`);
      item.quantity = item.maxStock;
    } else {
      item.quantity = val;
    }

    setItems(updated);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!customer.name.trim() || !customer.phone.trim()) {
      showWarning('Customer name and phone number are required.');
      return;
    }

    if (items.length === 0) {
      showWarning('POS cart is empty. Please add items before checking out.');
      return;
    }

    try {
      setCheckoutLoading(true);
      const payload = {
        customer,
        items: items.map((i) => ({ product: i.product, quantity: i.quantity })),
        paymentMethod,
        taxRate
      };

      const response = await API.post('/invoices', payload);
      if (response.data.success) {
        showSuccess('Invoice created successfully.');
        setCompletedInvoice(response.data.data);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to checkout invoice.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Clear POS board
  const handleResetBoard = () => {
    setCustomer({ name: '', phone: '', email: '' });
    setItems([]);
    setPaymentMethod('Cash');
    setCatalogSearch('');
    setIsResetOpen(false);
    setCompletedInvoice(null);
    showInfo('POS panel cleared.');
  };

  // Format currencies
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  // PDF Generator using jsPDF and jspdf-autotable
  const downloadPDFInvoice = (inv) => {
    if (!inv) return;

    const doc = new jsPDF();
    const primaryColor = [14, 165, 233]; // Sky-500 RGB
    
    // Header banner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    // Title & Brand
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('STOCKPILOT', 15, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Wholesale Billing System', 15, 27);
    
    // Invoice Metadata
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`INVOICE: ${inv.invoiceNumber}`, 145, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Date: ${new Date(inv.createdAt).toLocaleString()}`, 145, 25);
    doc.text(`Payment: ${inv.paymentMethod}`, 145, 30);

    // Business details
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text('StockPilot Wholesale Ltd.', 15, 52);
    doc.text('Sector 15, Industrial Area, Hub', 15, 57);
    doc.text('Support: billing@stockpilot.com', 15, 62);

    // Customer details
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 120, 52);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${inv.customer?.name}`, 120, 57);
    doc.text(`Phone: ${inv.customer?.phone}`, 120, 62);
    if (inv.customer?.email) {
      doc.text(`Email: ${inv.customer?.email}`, 120, 67);
    }

    // Line items table
    const tableColumns = ['#', 'Product Details', 'SKU', 'Unit Price', 'Qty', 'Total Price'];
    const tableRows = inv.items.map((item, idx) => [
      idx + 1,
      item.name,
      item.sku,
      `INR ${item.sellingPrice.toFixed(2)}`,
      item.quantity,
      `INR ${item.total.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 75,
      head: [tableColumns],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
      styles: { fontSize: 8.5 },
      columnStyles: {
        0: { width: 10 },
        1: { width: 75 },
        2: { width: 30 },
        3: { width: 25 },
        4: { width: 15 },
        5: { width: 30 }
      }
    });

    // Summary calculation panel
    const finalY = doc.previousAutoTable.finalY + 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Subtotal:', 140, finalY);
    doc.text(`INR ${inv.subtotal.toFixed(2)}`, 175, finalY);

    doc.text(`GST/Tax (${inv.taxRate}%):`, 140, finalY + 6);
    doc.text(`INR ${inv.tax.toFixed(2)}`, 175, finalY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Total Amount:', 140, finalY + 13);
    doc.text(`INR ${inv.totalAmount.toFixed(2)}`, 175, finalY + 13);

    // Sign off footer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your wholesale business with StockPilot!', 15, finalY + 25);
    doc.text('This is a computer-generated invoice document.', 15, finalY + 30);

    doc.save(`invoice_${inv.invoiceNumber}.pdf`);
  };

  // Local printer function
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">
            Wholesale Checkout POS
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build bills, calculate taxes, process inventory checkout, and generate printable receipts.
          </p>
        </div>

        <button
          onClick={() => setIsResetOpen(true)}
          className="flex items-center justify-center gap-2 border border-slate-300 bg-white dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-xs shrink-0"
        >
          <FiRefreshCw size={16} /> Reset POS Board
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Product Selector catalog lookup (5 Columns) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FiSearch size={18} className="text-sky-500" /> Catalog Lookup
          </h3>

          {/* Barcode Scanner Simulator */}
          <form onSubmit={handleBarcodeSubmit} className="relative">
            <FiMaximize className="absolute left-3 top-3 text-emerald-500 animate-pulse" size={16} />
            <input
              type="text"
              placeholder="Scan Barcode (SKU) & press Enter..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-semibold tracking-wide"
            />
          </form>

          {/* Search bar */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Or search by product name..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-sm"
            />
          </div>

          {/* Search Results List */}
          <div className="h-96 overflow-y-auto space-y-3 pr-1">
            {catalogLoading ? (
              <div className="py-20">
                <Spinner size="md" />
              </div>
            ) : catalogProducts.length === 0 ? (
              <div className="py-20 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                No matching products found.
              </div>
            ) : (
              catalogProducts.map((p) => {
                const alreadySelected = items.find((i) => i.product === p._id);
                const quantitySelected = alreadySelected ? alreadySelected.quantity : 0;
                const remainingStock = p.stockQuantity - quantitySelected;
                const isOutOfStock = remainingStock <= 0;

                return (
                  <div
                    key={p._id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-4 
                      ${
                        isOutOfStock
                          ? 'bg-slate-50/50 border-slate-200 dark:bg-slate-950/20 dark:border-slate-900 opacity-60'
                          : 'bg-white hover:bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/50'
                      }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <span className="text-sm font-semibold text-slate-800 dark:text-white truncate block">
                        {p.name}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-sm">
                          {p.sku}
                        </span>
                        <span className={`text-[10px] font-semibold ${isOutOfStock ? 'text-rose-500' : 'text-slate-400 dark:text-slate-500'}`}>
                          Stock: {isOutOfStock ? 'Sold Out' : `${remainingStock} left`}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                        {formatCurrency(p.sellingPrice)}
                      </span>
                      {!isOutOfStock && (
                        <button
                          onClick={() => addItemToCart(p)}
                          className="mt-1 flex items-center justify-center gap-1.5 text-xxs font-extrabold bg-sky-50 text-sky-600 hover:bg-sky-500 hover:text-white px-2 py-1 rounded-sm transition-all"
                        >
                          <FiPlus size={10} /> Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Billing Cart compiler (7 Columns) */}
        <form onSubmit={handleCheckout} className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FiShoppingCart size={18} className="text-sky-500" /> POS Billing cart
          </h3>

          {/* Customer Metadata Input */}
          <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Customer profile</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="Username"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={customer.phone}
                  onChange={(e) => setCustomer({ ...customer, phone: e.target.value.replace(/[^0-9+]/g, '') })}
                  placeholder=""
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  placeholder="Email"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Cart items listing */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Purchase items</h4>
            {items.length === 0 ? (
              <div className="py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400 dark:text-slate-500 text-sm">
                Billing cart is empty. Click "+ Add" on catalog items.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {items.map((item, index) => (
                  <div key={item.product} className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-900/60 transition-colors gap-4">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-slate-800 dark:text-white truncate block">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                        {item.sku} • {formatCurrency(item.sellingPrice)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {/* Quantity select inputs */}
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max={item.maxStock}
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className="w-16 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-center font-bold text-sm bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                        />
                        <span className="text-xs text-slate-400 dark:text-slate-500">pcs</span>
                      </div>

                      {/* Total */}
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 w-20 text-right">
                        {formatCurrency(item.sellingPrice * item.quantity)}
                      </span>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => removeItemFromCart(index)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                      >
                        <FiTrash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settings & Payment dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-sm"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">GST/Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-sm"
              />
            </div>
          </div>

          {/* Pricing Totals summary panel */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
            <div className="flex justify-between text-sm font-semibold text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold text-slate-500 dark:text-slate-400">
              <span>GST/Tax ({taxRate}%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-slate-800 dark:text-white pt-2 border-t border-dashed border-slate-100 dark:border-slate-800">
              <span>Grand Total</span>
              <span className="text-sky-500">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Submission button */}
          <button
            type="submit"
            disabled={checkoutLoading || items.length === 0}
            className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-sky-500 hover:bg-sky-600 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 shadow-md shadow-sky-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {checkoutLoading ? <Spinner size="sm" color="white" /> : 'Finalize Checkout & Issue Invoice'}
          </button>
        </form>
      </div>

      {/* POS Reset Modal Confirmation */}
      <ConfirmModal
        isOpen={isResetOpen}
        title="Reset Billing Board"
        message="Are you sure you want to clear the POS panel? All added products and customer parameters will be deleted."
        confirmText="Yes, Reset"
        cancelText="No, Cancel"
        type="warning"
        onConfirm={handleResetBoard}
        onCancel={() => setIsResetOpen(false)}
      />

      {/* Checkout Success Modal Dialog */}
      {completedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setCompletedInvoice(null)}></div>
          {/* Modal Container */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left shadow-2xl transition-all w-full max-w-2xl border border-slate-200 dark:border-slate-800">
              
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Transaction Completed</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Invoice registered successfully</p>
              </div>

              {/* Printable Invoice Block */}
              <div id="printable-invoice" className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-200 space-y-4">
                {/* Invoice Header */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-white">STOCKPILOT</h4>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Wholesale Inventory System</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-sky-500 block">{completedInvoice.invoiceNumber}</span>
                    <span className="text-[10px] text-slate-400">{new Date(completedInvoice.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Directory data */}
                <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-200/50 dark:border-slate-800/80 pt-3">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-medium block uppercase tracking-wider text-[9px]">Vendor Details</span>
                    <span className="font-semibold block text-slate-800 dark:text-white">StockPilot Wholesale Ltd.</span>
                    <span className="block text-slate-500 dark:text-slate-400">Sector 15, Industrial Hub</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-medium block uppercase tracking-wider text-[9px]">Bill To</span>
                    <span className="font-semibold block text-slate-800 dark:text-white">{completedInvoice.customer?.name}</span>
                    <span className="block text-slate-500 dark:text-slate-400">Phone: {completedInvoice.customer?.phone}</span>
                  </div>
                </div>

                {/* Items details table */}
                <table className="w-full text-left text-xs border-collapse border-t border-slate-200/50 dark:border-slate-800/80 pt-3">
                  <thead>
                    <tr className="text-slate-400 dark:text-slate-500 font-semibold border-b border-slate-200/50 dark:border-slate-800/80">
                      <th className="py-2">Item</th>
                      <th className="py-2">SKU</th>
                      <th className="py-2 text-right">Price</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {completedInvoice.items.map((item) => (
                      <tr key={item._id}>
                        <td className="py-2 font-medium">{item.name}</td>
                        <td className="py-2 text-slate-500 dark:text-slate-400 uppercase">{item.sku}</td>
                        <td className="py-2 text-right">{formatCurrency(item.sellingPrice)}</td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right font-semibold">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Final receipt calculations */}
                <div className="border-t border-slate-200/50 dark:border-slate-800/80 pt-3 space-y-1.5 text-xs text-right max-w-xs ml-auto">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400 dark:text-slate-500">Subtotal</span>
                    <span>{formatCurrency(completedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400 dark:text-slate-500">GST/Tax ({completedInvoice.taxRate}%)</span>
                    <span>{formatCurrency(completedInvoice.tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-800 dark:text-white border-t border-dashed border-slate-200 dark:border-slate-800 pt-1.5">
                    <span>Grand Total</span>
                    <span className="text-sky-500">{formatCurrency(completedInvoice.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex flex-wrap gap-3 justify-between items-center no-print">
                <div className="flex gap-2">
                  <button
                    onClick={triggerPrint}
                    className="flex items-center gap-1.5 border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all"
                  >
                    <FiPrinter size={14} /> Print Receipt
                  </button>
                  <button
                    onClick={() => downloadPDFInvoice(completedInvoice)}
                    className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-sky-500/10 transition-all animate-pulse"
                  >
                    <FiDownload size={14} /> Download PDF
                  </button>
                </div>
                
                <button
                  onClick={handleResetBoard}
                  className="px-5 py-2.5 text-xs font-bold border border-transparent bg-slate-900 hover:bg-slate-950 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 rounded-xl"
                >
                  Create New Bill
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Billing;
