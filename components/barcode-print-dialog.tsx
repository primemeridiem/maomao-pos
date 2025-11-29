"use client";

import Barcode from "react-barcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";

interface BarcodePrintDialogProps {
  item: {
    id: string;
    name: string;
    type: string;
    price: number;
    barcodeId: string;
    lot: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BarcodePrintDialog({
  item,
  open,
  onOpenChange,
}: BarcodePrintDialogProps) {

  const generateBarcodeImage = (id: string): string => {
    const canvas = document.createElement("canvas");
    // Extract just the numeric part from ID (e.g., "CLO001" -> "001")
    // Then pad to 8 digits (e.g., "001" -> "00000001")
    const numericId = id.replace(/\D/g, "").padStart(8, "0");
    JsBarcode(canvas, numericId, {
      format: "CODE128",
      width: 1.5,
      height: 35,
      displayValue: false,
      fontSize: 10,
      margin: 0,
    });
    return canvas.toDataURL("image/png");
  };

  const handleSavePDF = () => {
    // Convert mm to points (1mm = 2.834645669 points)
    const mmToPoints = 2.834645669;

    // Layout configuration
    const labelWidth = 32 * mmToPoints;
    const labelHeight = 25 * mmToPoints;
    const columnGap = 2 * mmToPoints;
    const rowGap = 3 * mmToPoints;
    const rollWidth = 100 * mmToPoints;
    const labelsPerRow = 3;
    const rows = 3;

    // Calculate total width needed for 3 labels with gaps
    const totalLabelsWidth = (labelsPerRow * labelWidth) + ((labelsPerRow - 1) * columnGap);

    // Calculate left margin to center labels on roll
    const leftMargin = (rollWidth - totalLabelsWidth) / 2;

    // Calculate page height
    const pageHeight = (rows * labelHeight) + ((rows - 1) * rowGap);

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: [rollWidth, pageHeight],
    });

    // Generate simple 8-digit barcode from product ID
    const barcode8Digit = item.id.replace(/\D/g, "").padStart(8, "0");
    const barcodeImg = generateBarcodeImage(item.id);

    // Draw labels
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < labelsPerRow; col++) {
        // Calculate position with left margin
        const x = leftMargin + (col * (labelWidth + columnGap));
        const y = row * (labelHeight + rowGap);

        // Draw label border for debugging (comment out for production)
        // pdf.setDrawColor(200, 200, 200);
        // pdf.rect(x, y, labelWidth, labelHeight);

        // Label padding
        const padding = 1.5 * mmToPoints;
        const contentWidth = labelWidth - (padding * 2);
        const centerX = x + (labelWidth / 2);

        // Start Y position
        let currentY = y + padding;

        // Product name
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        const nameLines = pdf.splitTextToSize(item.name, contentWidth);
        // Use baseline alignment for better positioning
        nameLines.forEach((line: string, index: number) => {
          pdf.text(line, centerX, currentY + (index * 2.5 * mmToPoints), { align: "center", baseline: "top" });
        });
        currentY += (nameLines.length * 2.5 * mmToPoints) + (1 * mmToPoints);

        // Barcode - centered and properly sized
        const barcodeWidth = contentWidth * 0.9;
        const barcodeHeight = 8 * mmToPoints;
        const barcodeX = x + (labelWidth - barcodeWidth) / 2;
        pdf.addImage(
          barcodeImg,
          "PNG",
          barcodeX,
          currentY,
          barcodeWidth,
          barcodeHeight
        );
        currentY += barcodeHeight + (0.3 * mmToPoints);

        // Barcode number below barcode
        pdf.setFontSize(6);
        pdf.setFont("helvetica", "normal");
        pdf.text(barcode8Digit, centerX, currentY, { align: "center", baseline: "top" });
        currentY += (1.5 * mmToPoints);

        // Price
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text(`$${item.price.toFixed(2)}`, centerX, currentY, { align: "center", baseline: "top" });
        currentY += (3 * mmToPoints);

        // Lot number
        pdf.setFontSize(6);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Lot: ${item.lot}`, centerX, currentY, { align: "center", baseline: "top" });
      }
    }

    // Save PDF
    pdf.save(`barcode-${item.id}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Barcode Label Preview</DialogTitle>
          <DialogDescription>
            Preview of label for thermal printer (32mm × 25mm)
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-6 py-4">
          {/* Large Label Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-center bg-gray-100 p-6 rounded-lg">
              <div
                className="border-2 border-gray-400 rounded bg-white shadow-lg"
                style={{
                  width: '96mm',
                  height: '75mm',
                  transform: 'scale(1)'
                }}
              >
                <div className="flex flex-col items-center justify-center h-full text-center px-3">
                  {/* Product Name */}
                  <div className="font-bold text-base leading-tight mb-3 line-clamp-2 px-2">
                    {item.name}
                  </div>

                  {/* Barcode */}
                  <div className="w-full flex flex-col items-center justify-center my-2">
                    <Barcode
                      value={item.id.replace(/\D/g, "").padStart(8, "0")}
                      format="CODE128"
                      width={2.5}
                      height={50}
                      displayValue={false}
                      fontSize={12}
                      margin={0}
                    />
                    <div className="text-xs font-mono mt-1">
                      {item.id.replace(/\D/g, "").padStart(8, "0")}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-2xl font-bold mt-3">
                    ${item.price.toFixed(2)}
                  </div>

                  {/* Lot Number */}
                  <div className="text-xs text-gray-500 mt-2">
                    Lot: {item.lot}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-xs text-center text-muted-foreground">
              <p className="font-semibold">Label scaled 3× for preview</p>
              <p>Actual size: 32mm × 25mm</p>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-2 bg-gray-50 rounded-lg p-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground text-xs">Product ID:</span>
                <p className="font-mono">{item.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Type:</span>
                <p className="font-medium">{item.type}</p>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground text-xs">Barcode:</span>
                <p className="font-mono text-xs break-all">{item.barcodeId}</p>
              </div>
            </div>
          </div>

          {/* Save PDF Button */}
          <div className="flex justify-center">
            <Button onClick={handleSavePDF} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Save as PDF (Actual Size)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
