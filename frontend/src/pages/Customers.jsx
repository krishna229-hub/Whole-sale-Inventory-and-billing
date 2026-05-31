import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { ToastContext } from '../context/ToastContext';
import Spinner from '../components/Spinner';
import { FiSearch, FiUsers, FiClock, FiDollarSign, FiArrowRight, FiFileText, FiEye, FiDownload } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Customers = () => {
  const { showError, showInfo, showSuccess } = useContext(ToastContext);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected customer history modal state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [historyInvoices, setHistoryInvoices] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/customers?search=${searchQuery}`);
      if (response.data.success) {
        setCustomers(response.data.data);
      }
    } catch (error) {
      showError('Failed to load customers.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleOpenHistory = async (cust) => {
    setSelectedCustomer(cust);
    setIsModalOpen(true);
    setModalLoading(true);
    try {
      const response = await API.get(`/customers/${cust._id}`);
      if (response.data.success) {
        setHistoryInvoices(response.data.invoices);
      }
    } catch (error) {
      showError('Could not fetch customer history.');
      console.error(error);
    } finally {
      setModalLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val);
  };

  // Reusable PDF download
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

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">
          Customer Management
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review buyer records, frequency of invoices, and cumulative transactions spent volume.
        </p>
      </div>

      {/* Filters Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs">
        <div className="max-w-md relative">
          <FiSearch className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by customer name or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 text-sm"
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-24">
            <Spinner size="lg" />
          </div>
        ) : customers.length === 0 ? (
          <div className="py-24 text-center text-slate-400 dark:text-slate-500 text-sm">
            No customers registered. Invoices will automatically create customer logs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Buyer Name</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Purchases Count</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Amount Spent</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Joined Date</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                    {/* Name */}
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800 dark:text-white block">
                        {c.name}
                      </span>
                    </td>

                    {/* Phone & Email */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium block">
                        {c.phone}
                      </span>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        {c.email || '— No Email —'}
                      </span>
                    </td>

                    {/* Count */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-800 dark:text-white font-semibold">
                        {c.totalPurchases} orders
                      </span>
                    </td>

                    {/* Total spent */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-sky-600 dark:text-sky-400 font-bold">
                        {formatCurrency(c.totalAmountSpent)}
                      </span>
                    </td>

                    {/* Registration Date */}
                    <td className="px-6 py-4 text-xs text-slate-400 dark:text-slate-500">
                      {new Date(c.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenHistory(c)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-sky-500 hover:text-sky-600 hover:underline transition-all"
                      >
                        View History <FiArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Purchase History Modal */}
      {isModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-slide-in">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsModalOpen(false)}></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-slate-900 p-6 text-left shadow-2xl transition-all w-full max-w-3xl border border-slate-200 dark:border-slate-800">
              
              {/* Header profile */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-5 mb-5 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <FiUsers className="text-sky-500" /> {selectedCustomer.name}
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400 dark:text-slate-500 font-semibold">
                    <span>Phone: {selectedCustomer.phone}</span>
                    {selectedCustomer.email && <span>Email: {selectedCustomer.email}</span>}
                  </div>
                </div>
                {/* Stats indicators */}
                <div className="flex gap-4 shrink-0">
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center min-w-28">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total spent</span>
                    <span className="text-base font-extrabold text-sky-500 mt-0.5 block">{formatCurrency(selectedCustomer.totalAmountSpent)}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-center min-w-24">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Invoices</span>
                    <span className="text-base font-extrabold text-slate-800 dark:text-white mt-0.5 block">{selectedCustomer.totalPurchases} bills</span>
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Order Invoice History</h4>

              <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
                {modalLoading ? (
                  <div className="py-12">
                    <Spinner size="md" />
                  </div>
                ) : historyInvoices.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
                    No orders verified for this profile.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    {historyInvoices.map((inv) => (
                      <div key={inv._id} className="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-900/60 transition-colors flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-sm font-bold text-slate-800 dark:text-white block">
                            {inv.invoiceNumber}
                          </span>
                          <div className="flex items-center gap-2 text-xxs text-slate-400 dark:text-slate-500 font-semibold">
                            <span>{new Date(inv.createdAt).toLocaleString()}</span>
                            <span>•</span>
                            <span>{inv.paymentMethod}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {formatCurrency(inv.totalAmount)}
                          </span>
                          <button
                            onClick={() => downloadPDFInvoice(inv)}
                            className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/20 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <FiDownload size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Close footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-6 flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-950 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 font-bold text-sm rounded-xl transition-all"
                >
                  Close History
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Customers;
