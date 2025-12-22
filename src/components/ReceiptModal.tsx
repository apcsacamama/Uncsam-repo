import { Dialog, DialogContent } from "./ui/dialog";
import { Button } from "./ui/button";
import { X, Download } from "lucide-react";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ReceiptModalProps {
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

export default function ReceiptModal({
  isOpen,
  onClose,
  bookingDetails,
  packageDetails,
  paymentDetails,
}: ReceiptModalProps) {
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
      
      // Filename is set to Receipt-[ID].pdf
      pdf.save(`Receipt-${bookingDetails.id}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  const airportTransferPrice = 8000;
  const basePrice = paymentDetails.totalPrice - (paymentDetails.hasAirportTransfer ? airportTransferPrice : 0);
  const unitPrice = basePrice / paymentDetails.travelers;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-gray-100">
        
        {/* Actions Header */}
        <div className="bg-white p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Receipt Preview</h3>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>
                    <X className="w-4 h-4 mr-2" /> Close
                </Button>
                <Button 
                    size="sm" 
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleDownloadPDF}
                    disabled={isDownloading}
                >
                    {isDownloading ? (
                        "Generating..."
                    ) : (
                        <>
                            <Download className="w-4 h-4 mr-2" /> Export to PDF
                        </>
                    )}
                </Button>
            </div>
        </div>

        {/* --- ACTUAL RECEIPT CONTENT --- */}
        <div className="overflow-y-auto max-h-[80vh] p-8 flex justify-center">
          <div 
            id="receipt-content" 
            ref={invoiceRef} 
            className="bg-white shadow-lg p-10 w-full max-w-2xl min-h-[800px] text-gray-800"
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-10 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-red-600 mb-2">UNCLE SAM TOURS</h1>
                    <p className="text-sm text-gray-500">123 Travel Road, Tokyo, Japan</p>
                    <p className="text-sm text-gray-500">support@unclesam-travel.com</p>
                    <p className="text-sm text-gray-500">+81-3-1234-5678</p>
                </div>
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-gray-400 uppercase tracking-widest">Receipt</h2>
                    <p className="font-semibold mt-2"># {bookingDetails.id}</p>
                    <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                    <p className="text-xs text-green-600 font-bold mt-1 uppercase border border-green-600 px-2 py-0.5 inline-block rounded">Paid</p>
                </div>
            </div>

            {/* Bill To */}
            <div className="mb-10">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</h3>
                <p className="font-bold text-lg">{bookingDetails.customerName}</p>
                <p className="text-gray-600">{bookingDetails.email}</p>
                <p className="text-gray-600">{bookingDetails.phone}</p>
            </div>

            {/* Line Items Table */}
            <table className="w-full mb-10 collapse">
                <thead>
                    <tr className="bg-gray-50 text-left border-b border-gray-200">
                        <th className="py-3 px-4 font-semibold text-sm text-gray-600">Description</th>
                        <th className="py-3 px-4 font-semibold text-sm text-gray-600 text-center">Qty</th>
                        <th className="py-3 px-4 font-semibold text-sm text-gray-600 text-right">Unit Price</th>
                        <th className="py-3 px-4 font-semibold text-sm text-gray-600 text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Main Package */}
                    <tr className="border-b border-gray-100">
                        <td className="py-4 px-4">
                            <p className="font-bold text-gray-800">{packageDetails?.title || "Tour Package"}</p>
                            <p className="text-xs text-gray-500">Travel Date: {bookingDetails.travelDate}</p>
                        </td>
                        <td className="py-4 px-4 text-center">{paymentDetails.travelers}</td>
                        <td className="py-4 px-4 text-right">¥{unitPrice.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right font-medium">¥{basePrice.toLocaleString()}</td>
                    </tr>

                    {/* Airport Transfer Add-on */}
                    {paymentDetails.hasAirportTransfer && (
                         <tr className="border-b border-gray-100 bg-blue-50/30">
                            <td className="py-4 px-4">
                                <p className="font-bold text-gray-800">Airport Transfer (Add-on)</p>
                                <p className="text-xs text-gray-500">Private pickup service</p>
                            </td>
                            <td className="py-4 px-4 text-center">1</td>
                            <td className="py-4 px-4 text-right">¥{airportTransferPrice.toLocaleString()}</td>
                            <td className="py-4 px-4 text-right font-medium">¥{airportTransferPrice.toLocaleString()}</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-12">
                <div className="w-1/2 space-y-3">
                    <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>¥{paymentDetails.totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>Tax (Included)</span>
                        <span>¥0</span>
                    </div>
                    <div className="flex justify-between font-bold text-xl text-gray-900 border-t pt-3 mt-3">
                        <span>Total Paid</span>
                        <span className="text-red-600">¥{paymentDetails.totalPrice.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center border-t pt-8 text-gray-500 text-sm">
                <p className="mb-2 font-semibold">Thank you for traveling with us!</p>
                <p>If you have any questions about this receipt, please contact support@unclesam-travel.com</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}