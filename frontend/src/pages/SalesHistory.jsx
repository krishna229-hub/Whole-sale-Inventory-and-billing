import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import Spinner from '../components/Spinner';
import ConfirmModal from '../components/ConfirmModal';
import { FiSearch, FiFileText, FiCalendar, FiEye, FiDownload, FiPrinter, FiX, FiEdit2, FiTrash2, FiCheck } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SalesHistory = () => {
  const { showError, showSuccess } = useContext(ToastContext);
  const { user } = useContext(AuthContext);

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter queries
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected invoice detail modal state
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Edit invoice modal state (admin only)
  const [editInvoice, setEditInvoice] = useState(null);
  const [editCustomer, setEditCustomer] = useState({ name: '', phone: '', email: '' });
  const [editItems, setEditItems] = useState([]);
  const [editPayment, setEditPayment] = useState('Cash');
  const [editTaxRate, setEditTaxRate] = useState(18);
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const openEditModal = (inv) => {
    setEditInvoice(inv);
    setEditCustomer({ name: inv.customer?.name || '', phone: inv.customer?.phone || '', email: '' });
    setEditItems(inv.items.map(i => ({ product: i.product?._id || i.product, name: i.name, sku: i.sku, quantity: i.quantity, sellingPrice: i.sellingPrice })));
    setEditPayment(inv.paymentMethod);
    setEditTaxRate(inv.taxRate);
  };

  const handleEditSave = async () => {
    if (!editCustomer.name || !editCustomer.phone) { showError('Customer name and phone required'); return; }
    if (editItems.length === 0) { showError('At least one item required'); return; }
    try {
      setEditLoading(true);
      const payload = {
        customer: editCustomer,
        items: editItems.map(i => ({ product: i.product, quantity: i.quantity })),
        paymentMethod: editPayment,
        taxRate: editTaxRate
      };
      const res = await API.put(`/invoices/${editInvoice._id}`, payload);
      if (res.data.success) {
        showSuccess('Invoice updated successfully');
        setEditInvoice(null);
        fetchInvoices();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update invoice');
    } finally {
      setEditLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await API.get('/invoices', { params });
      if (response.data.success) {
        setInvoices(response.data.data);
      }
    } catch (error) {
      showError('Failed to fetch invoice listings.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchInvoices();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, startDate, endDate]);

  const requestModification = async (id, action) => {
    try {
      const response = await API.put(`/invoices/${id}/request-modification`, { action, reason: 'Staff requested' });
      if (response.data.success) {
        showSuccess('Request sent to admin');
        fetchInvoices();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to send request');
      console.error(err);
    }
  };

  const handleOpenDeleteModal = (id) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await API.delete(`/invoices/${deleteId}`);
      if (response.data.success) {
        showSuccess('Invoice deleted successfully');
        setIsDeleteOpen(false);
        fetchInvoices();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete invoice');
      console.error(err);
    }
  };

  const resolveModification = async (id, status) => {
    try {
      const response = await API.put(`/invoices/${id}/resolve-modification`, { status });
      if (response.data.success) {
        showSuccess(`Request marked as ${status}`);
        fetchInvoices();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update request status');
      console.error(err);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  // Reusable PDF generator
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
    showSuccess('PDF downloaded successfully.');
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">
          Sales & Invoices History
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review, search and filter all historical sales invoices issued by staff or administrators.
        </p>
      </div>

      {/* Filters & Search Panels */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Keyword Search */}
          <div className="relative sm:col-span-2">
            <FiSearch className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by customer name, phone, or invoice number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-sm"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-sm"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Database Listing Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-24">
            <Spinner size="lg" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-24 text-center text-slate-400 dark:text-slate-500 text-sm">
            No invoices cataloged for current settings.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Customer Details</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Issue Date</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Payment Method</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Items count</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Grand Total</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => {
                  const totalItems = inv.items.reduce((sum, i) => sum + i.quantity, 0);
                  return (
                    <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                      {/* Invoice ID */}
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 rounded-lg">
                          {inv.invoiceNumber}
                        </span>
                      </td>

                      {/* Customer info */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800 dark:text-white block">
                          {inv.customer?.name}
                        </span>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          {inv.customer?.phone}
                        </span>
                      </td>

                      {/* Created date */}
                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {new Date(inv.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      {/* Payment */}
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded-sm">
                          {inv.paymentMethod}
                        </span>
                      </td>

                      {/* Items count */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {totalItems} items
                        </span>
                      </td>

                      {/* Revenue amount */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {formatCurrency(inv.totalAmount)}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          
                          {/* Request Status Badge */}
                          {inv.modificationRequest?.status && inv.modificationRequest.status !== 'none' && (
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-sm uppercase ${
                              inv.modificationRequest.status.includes('pending') ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                              inv.modificationRequest.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {inv.modificationRequest.status.replace('_', ' ')}
                            </span>
                          )}

                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/20 rounded-lg transition-colors"
                            title="View Invoice details"
                          >
                            <FiEye size={16} />
                          </button>
                          <button
                            onClick={() => downloadPDFInvoice(inv)}
                            className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/20 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <FiDownload size={16} />
                          </button>

                          {/* Staff Actions */}
                          {user?.role === 'staff' && (
                            <>
                              {inv.modificationRequest?.status !== 'pending_edit' && (
                                <button
                                  onClick={() => requestModification(inv._id, 'pending_edit')}
                                  className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg transition-colors"
                                  title="Request Edit"
                                >
                                  <FiEdit2 size={16} />
                                </button>
                              )}
                              {inv.modificationRequest?.status !== 'pending_delete' && (
                                <button
                                  onClick={() => requestModification(inv._id, 'pending_delete')}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                                  title="Request Delete"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              )}
                            </>
                          )}

                          {/* Admin Actions */}
                          {user?.role === 'admin' && (
                            <>
                              {inv.modificationRequest?.status && inv.modificationRequest.status.includes('pending') && (
                                <>
                                  <button
                                    onClick={() => resolveModification(inv._id, 'approved')}
                                    className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors"
                                    title="Approve Request"
                                  >
                                    <FiCheck size={16} />
                                  </button>
                                  <button
                                    onClick={() => resolveModification(inv._id, 'rejected')}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                                    title="Reject Request"
                                  >
                                    <FiX size={16} />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => openEditModal(inv)}
                                className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg transition-colors"
                                title="Edit Invoice"
                              >
                                <FiEdit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteModal(inv._id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                                title="Delete Permanently"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </>
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

      {/* Invoice Detail Modal Overlay */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setSelectedInvoice(null)}></div>
          {/* Container */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left shadow-2xl transition-all w-full max-w-2xl border border-slate-200 dark:border-slate-800">
              
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FiFileText className="text-sky-500" /> Invoice Details
                </h3>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Printable Area */}
              <div id="printable-invoice" className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50/50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-200 space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-white">STOCKPILOT</h4>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">Wholesale Inventory System</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-sky-500 block">{selectedInvoice.invoiceNumber}</span>
                    <span className="text-[10px] text-slate-400">{new Date(selectedInvoice.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Directory metadata details */}
                <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-200/50 dark:border-slate-800/80 pt-3">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-semibold block uppercase tracking-wider text-[9px]">Vendor Details</span>
                    <span className="font-semibold block text-slate-800 dark:text-white">StockPilot Wholesale Ltd.</span>
                    <span className="block text-slate-500 dark:text-slate-400">Sector 15, Industrial Hub</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-semibold block uppercase tracking-wider text-[9px]">Bill To</span>
                    <span className="font-semibold block text-slate-800 dark:text-white">{selectedInvoice.customer?.name}</span>
                    <span className="block text-slate-500 dark:text-slate-400">Phone: {selectedInvoice.customer?.phone}</span>
                  </div>
                </div>

                {/* Table details */}
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
                    {selectedInvoice.items.map((item) => (
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

                {/* Aggregated sums */}
                <div className="border-t border-slate-200/50 dark:border-slate-800/80 pt-3 space-y-1.5 text-xs text-right max-w-xs ml-auto">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400 dark:text-slate-500">Subtotal</span>
                    <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-400 dark:text-slate-500">GST/Tax ({selectedInvoice.taxRate}%)</span>
                    <span>{formatCurrency(selectedInvoice.tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-slate-800 dark:text-white border-t border-dashed border-slate-200 dark:border-slate-800 pt-1.5">
                    <span>Grand Total</span>
                    <span className="text-sky-500">{formatCurrency(selectedInvoice.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-6 flex gap-3 justify-end items-center no-print">
                <button
                  onClick={triggerPrint}
                  className="flex items-center gap-1.5 border border-slate-300 bg-white dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-4.5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all"
                >
                  <FiPrinter size={14} /> Print Invoice
                </button>
                <button
                  onClick={() => downloadPDFInvoice(selectedInvoice)}
                  className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-600 text-white px-4.5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-sky-500/15 transition-all"
                >
                  <FiDownload size={14} /> Download PDF
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal (Admin Only) */}
      {editInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setEditInvoice(null)}></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-800 space-y-5">

              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FiEdit2 className="text-amber-500" /> Edit Invoice — {editInvoice.invoiceNumber}
                </h3>
                <button onClick={() => setEditInvoice(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-lg">
                  <FiX size={18} />
                </button>
              </div>

              {/* Customer Fields */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Name *" value={editCustomer.name} onChange={e => setEditCustomer({...editCustomer, name: e.target.value})}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500" />
                  <input type="tel" placeholder="Phone *" value={editCustomer.phone} onChange={e => setEditCustomer({...editCustomer, phone: e.target.value.replace(/[^0-9+]/g, '')})}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>

              {/* Items with editable quantities */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Line Items</h4>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  {editItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 gap-3">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-slate-800 dark:text-white block truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{item.sku} • {formatCurrency(item.sellingPrice)}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input type="number" min="1" value={item.quantity}
                          onChange={e => { const v = parseInt(e.target.value, 10); if (v > 0) { const u = [...editItems]; u[idx].quantity = v; setEditItems(u); }}}
                          className="w-16 px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-center font-bold text-sm bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500" />
                        <button type="button" onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors">
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Tax */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Payment Method</label>
                  <select value={editPayment} onChange={e => setEditPayment(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500">
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">GST/Tax Rate (%)</label>
                  <input type="number" min="0" max="100" value={editTaxRate} onChange={e => setEditTaxRate(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>

              {/* Save / Cancel */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => setEditInvoice(null)}
                  className="px-5 py-2.5 text-sm font-bold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  Cancel
                </button>
                <button onClick={handleEditSave} disabled={editLoading}
                  className="px-5 py-2.5 text-sm font-bold bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-md shadow-sky-500/15 transition-all disabled:opacity-50">
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Delete Wholesale Invoice"
        message="Are you sure you want to permanently delete this invoice? This will revert stock and customer balances."
        confirmText="Yes, Delete"
        cancelText="No, Keep"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />

    </div>
  );
};

export default SalesHistory;
