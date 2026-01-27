import { Dialog, DialogContent } from "./ui/dialog";
import { Button } from "./ui/button";
import { X, Download, Printer } from "lucide-react";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingDetails: any;
  packageDetails: any;
  paymentDetails: {
    totalPrice: number;
    travelers: number;
    hasAirportTransfer: boolean;
  };
}

export default function InvoiceModal({
  isOpen,
  onClose,
  bookingDetails,
  packageDetails,
  paymentDetails,
}: InvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // --- PDF GENERATION LOGIC ---
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setIsDownloading(true);

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice-${bookingDetails.id}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  // --- CALCULATE LINE ITEMS ---
  const airportTransferPrice = 8000;
  // Calculate base price (Total - Addons)
  const basePriceTotal = paymentDetails.totalPrice - (paymentDetails.hasAirportTransfer ? airportTransferPrice : 0);
  
  // Prepare Invoice Items
  const invoiceItems = [];

  // 1. Tour Package / Itinerary Item
  if (bookingDetails.details && bookingDetails.details.length > 0) {
      // If it's a custom tour with multiple days, we can list them or bundle them
      // For a cleaner invoice, we often bundle "Custom Tour Package (X Days)"
      invoiceItems.push({
          description: `Custom Tour Package (${bookingDetails.details.length} Days) - ${paymentDetails.travelers} Travelers`,
          qty: 1,
          unitPrice: basePriceTotal,
          amount: basePriceTotal
      });
  } else {
      // Standard Package
      invoiceItems.push({
          description: `${packageDetails?.title || "Tour Package"} - ${paymentDetails.travelers} Travelers`,
          qty: 1, // We treat the whole group package as 1 unit usually, or you can split by person
          unitPrice: basePriceTotal,
          amount: basePriceTotal
      });
  }

  // 2. Add-ons
  if (paymentDetails.hasAirportTransfer) {
      invoiceItems.push({
          description: "Optional Add-on: Private Airport Transfer",
          qty: 1,
          unitPrice: airportTransferPrice,
          amount: airportTransferPrice
      });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-gray-100 h-[90vh] flex flex-col">
        
        {/* HEADER ACTIONS */}
        <div className="bg-white p-4 border-b flex justify-between items-center shrink-0">
            <h3 className="font-semibold text-gray-700">Invoice Preview</h3>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrint} className="hidden sm:flex">
                    <Printer className="w-4 h-4 mr-2" /> Print
                </Button>
                <Button variant="outline" size="sm" onClick={onClose}>
                    <X className="w-4 h-4 mr-2" /> Close
                </Button>
                <Button 
                    size="sm" 
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                >
                    {isDownloading ? "Generating..." : <><Download className="w-4 h-4 mr-2" /> Download PDF</>}
                </Button>
            </div>
        </div>

        {/* --- INVOICE CANVAS (Scrollable) --- */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-gray-100">
          <div 
            id="invoice-content" 
            ref={invoiceRef} 
            className="bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] p-12 text-gray-800 flex flex-col"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {/* 1. INVOICE HEADER */}
            <div className="flex justify-between items-start mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">U</div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">UNCLE SAM TOURS</h1>
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                        <p>123 Travel Road, Shinjuku</p>
                        <p>Tokyo, Japan 160-0022</p>
                        <p>support@unclesam-travel.com</p>
                        <p>+81 3-1234-5678</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-5xl font-extrabold text-gray-100 tracking-widest uppercase mb-4">INVOICE</h2>
                    <div className="text-sm space-y-1">
                        <div className="flex justify-end gap-4">
                            <span className="text-gray-500 font-medium">Invoice #:</span>
                            <span className="font-bold text-gray-900">{bookingDetails.id}</span>
                        </div>
                        <div className="flex justify-end gap-4">
                            <span className="text-gray-500 font-medium">Date:</span>
                            <span className="text-gray-900">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-end gap-4">
                            <span className="text-gray-500 font-medium">Status:</span>
                            <span className="text-green-600 font-bold bg-green-50 px-2 rounded">PAID</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. BILL TO SECTION */}
            <div className="border-t border-b border-gray-100 py-8 mb-8 flex justify-between items-start">
                <div className="w-1/2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill To</h3>
                    <p className="font-bold text-xl text-gray-900 mb-1">{bookingDetails.customerName}</p>
                    <p className="text-sm text-gray-600">{bookingDetails.email}</p>
                    <p className="text-sm text-gray-600">{bookingDetails.phone}</p>
                </div>
                <div className="w-1/2 text-right">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Trip Details</h3>
                    <p className="text-sm text-gray-600"><span className="font-medium">Travel Date:</span> {bookingDetails.travelDate}</p>
                    <p className="text-sm text-gray-600"><span className="font-medium">Travelers:</span> {paymentDetails.travelers}</p>
                </div>
            </div>

            {/* 3. LINE ITEMS TABLE */}
            <div className="mb-12">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="py-3 px-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-[50%]">Description</th>
                            <th className="py-3 px-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                            <th className="py-3 px-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Unit Price</th>
                            <th className="py-3 px-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoiceItems.map((item, index) => (
                            <tr key={index} className="border-b border-gray-50 last:border-none">
                                <td className="py-4 px-4 text-sm font-medium text-gray-900">{item.description}</td>
                                <td className="py-4 px-4 text-sm text-gray-600 text-center">{item.qty}</td>
                                <td className="py-4 px-4 text-sm text-gray-600 text-right">¥{item.unitPrice.toLocaleString()}</td>
                                <td className="py-4 px-4 text-sm font-bold text-gray-900 text-right">¥{item.amount.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* 4. TOTALS */}
            <div className="flex justify-end mb-16">
                <div className="w-5/12 space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span>¥{paymentDetails.totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Tax (Included)</span>
                        <span>¥0</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                        <span className="font-bold text-lg text-gray-900">Total Paid</span>
                        <span className="font-bold text-2xl text-red-600">¥{paymentDetails.totalPrice.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* 5. FOOTER */}
            <div className="mt-auto border-t border-gray-100 pt-8 text-center">
                <p className="font-bold text-gray-900 mb-2">Thank you for choosing Uncle Sam Tours!</p>
                <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                    This document serves as your official proof of payment. For any questions regarding this invoice, please contact support@unclesam-travel.com quoting your invoice number.
                </p>
                <p className="text-xs text-gray-400 mt-4">Registered Travel Agency No. 123456 • Tokyo, Japan</p>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}