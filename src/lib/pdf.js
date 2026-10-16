import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Convert any data URL (including SVG) to a raster PNG/JPEG data URL for jsPDF compatibility.
 * @param {string} dataUrl
 * @returns {Promise<{ dataUrl: string, width: number, height: number }>}
 */
async function getRasterImageInfo(dataUrl) {
  return new Promise((resolve) => {
    // If not data URL or empty, resolve null
    if (!dataUrl || typeof dataUrl !== 'string') {
      return resolve(null);
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const width = img.naturalWidth || 600;
      const height = img.naturalHeight || 800;

      // If already a standard JPEG or PNG, we can use it directly
      if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/png')) {
        return resolve({ dataUrl, width, height });
      }

      // If SVG or other formats, rasterize to PNG via canvas
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(width, 1600);
        canvas.height = Math.min(height, 2200);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const rasterUrl = canvas.toDataURL('image/jpeg', 0.92);
          return resolve({ dataUrl: rasterUrl, width: canvas.width, height: canvas.height });
        }
      } catch (err) {
        console.warn('Canvas rasterization error:', err);
      }
      resolve({ dataUrl, width, height });
    };

    img.onerror = () => {
      console.warn('Failed to load image for PDF embedding');
      resolve(null);
    };

    img.src = dataUrl;
  });
}

/**
 * Format currency number to 2 decimal places with commas
 */
function formatNumber(num) {
  const val = Number(num);
  if (isNaN(val)) return '0.00';
  return val.toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Generate and download the Approval-Ready Claim PDF
 * 
 * @param {object} params
 * @param {object} params.claimDetails - { staffName, department, claimPeriod, submissionDate }
 * @param {Array<object>} params.receipts - array of receipt objects
 * @returns {Promise<boolean>}
 */
export async function generateClaimPdf({ claimDetails, receipts }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const staffName = claimDetails.staffName || 'Unnamed Staff';
  const department = claimDetails.department || 'Not Specified';
  const claimPeriod = claimDetails.claimPeriod || 'Current Period';
  const submissionDate = claimDetails.submissionDate || new Date().toISOString().split('T')[0];

  // ==========================================
  // PAGE 1: CLAIM SUMMARY & EXPENSE LINES
  // ==========================================

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, margin, pageWidth - margin * 2, 22, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('STAFF EXPENSE CLAIM REPORT', margin + 6, margin + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text('CLAIM SMARTER · APPROVAL-READY FORM', margin + 6, margin + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text('FOR FINANCE & AUDIT', pageWidth - margin - 6, margin + 12, { align: 'right' });

  // Details Info Card
  const detailsY = margin + 26;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, detailsY, pageWidth - margin * 2, 26, 2, 2, 'FD');

  const col1 = margin + 6;
  const col2 = margin + 65;
  const col3 = margin + 120;

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('CLAIMANT / STAFF NAME', col1, detailsY + 8);
  doc.text('DEPARTMENT', col2, detailsY + 8);
  doc.text('SUBMISSION DATE', col3, detailsY + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(staffName, col1, detailsY + 15);
  doc.text(department, col2, detailsY + 15);
  doc.text(submissionDate, col3, detailsY + 15);

  // Row 2
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CLAIM PERIOD', col1, detailsY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(claimPeriod, col2, detailsY + 22);

  // Claim Lines Table
  const tableData = receipts.map((r, index) => {
    const rateUsedStr = r.currency === 'SGD' ? '1.0000' : (r.rate ? Number(r.rate).toFixed(4) : '-');
    return [
      String(index + 1),
      r.date || '-',
      r.receiptNo || 'N/A',
      r.expenseItem || 'Expense item',
      r.currency || 'SGD',
      formatNumber(r.amount),
      rateUsedStr,
      formatNumber(r.amountSgd),
    ];
  });

  const totalSgd = receipts.reduce((acc, curr) => {
    const val = parseFloat(curr.amountSgd);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  autoTable(doc, {
    startY: detailsY + 30,
    head: [[
      '#',
      'Date',
      'Receipt / Inv No.',
      'Expense Item',
      'Currency',
      'Amount',
      'Rate Used',
      'Amount (SGD)'
    ]],
    body: tableData,
    foot: [[
      { content: 'TOTAL CLAIMABLE (SGD)', colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `SGD ${formatNumber(totalSgd)}`, styles: { halign: 'right', fontStyle: 'bold', textColor: [2, 132, 199] } }
    ]],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 9.5,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 28 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 18, halign: 'right' },
      7: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: margin, right: margin },
  });

  // Calculate signature blocks position
  // @ts-ignore
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : detailsY + 120;

  // If table is too long and pushes near bottom, add a new page or fit neatly
  let sigY = finalY;
  if (sigY > pageHeight - 55) {
    doc.addPage();
    sigY = margin + 10;
  }

  // Signatures Section
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(margin, sigY, pageWidth - margin, sigY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('DECLARATION & APPROVAL AUTHORIZATION', margin, sigY + 6);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'I certify that the expenses claimed above were incurred for official company business in accordance with policy.',
    margin,
    sigY + 11
  );

  const blockWidth = (pageWidth - margin * 2 - 12) / 2;
  const claimantBoxX = margin;
  const approverBoxX = margin + blockWidth + 12;
  const boxTop = sigY + 15;
  const boxHeight = 28;

  // Claimant Signature Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(claimantBoxX, boxTop, blockWidth, boxHeight, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('CLAIMANT SIGNATURE & DATE', claimantBoxX + 4, boxTop + 6);

  doc.line(claimantBoxX + 4, boxTop + 18, claimantBoxX + blockWidth - 4, boxTop + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Claimant: ${staffName}`, claimantBoxX + 4, boxTop + 24);
  doc.text('Date: _______________', claimantBoxX + blockWidth - 36, boxTop + 24);

  // Approver Signature Box
  doc.roundedRect(approverBoxX, boxTop, blockWidth, boxHeight, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('APPROVER NAME, SIGNATURE & DATE', approverBoxX + 4, boxTop + 6);

  doc.line(approverBoxX + 4, boxTop + 18, approverBoxX + blockWidth - 4, boxTop + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Approver Name: _____________________', approverBoxX + 4, boxTop + 24);
  doc.text('Date: _______________', approverBoxX + blockWidth - 36, boxTop + 24);

  // Footer note on page 1
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Page 1 · Claim Summary & Table (Receipt vouchers follow on subsequent pages)',
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  // ==========================================
  // FOLLOWING PAGES: RECEIPT IMAGES
  // ==========================================
  for (let i = 0; i < receipts.length; i++) {
    const rcpt = receipts[i];
    doc.addPage();

    const pageNum = i + 2;

    // Top banner for each receipt
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, margin, pageWidth - margin * 2, 20, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, margin, pageWidth - margin * 2, 20, 'S');

    // Badge
    doc.setFillColor(2, 132, 199); // sky-600
    doc.roundedRect(margin + 4, margin + 4, 18, 12, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`#${i + 1}`, margin + 13, margin + 12, { align: 'center' });

    // Header metadata
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(rcpt.expenseItem || 'Expense Receipt', margin + 26, margin + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Receipt No: ${rcpt.receiptNo || 'N/A'}   |   Date: ${rcpt.date || 'N/A'}   |   Original: ${rcpt.currency} ${formatNumber(rcpt.amount)}   |   SGD: $${formatNumber(rcpt.amountSgd)}`,
      margin + 26,
      margin + 16
    );

    // Attempt to embed image
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2 - 30; // headroom for header & footer
    const imgStartY = margin + 24;

    const raster = await getRasterImageInfo(rcpt.dataUrl);

    if (raster && raster.dataUrl) {
      try {
        // Calculate dimensions to preserve aspect ratio
        const imgAspect = raster.width / raster.height;
        const boxAspect = availableWidth / availableHeight;

        let renderWidth = availableWidth;
        let renderHeight = availableHeight;

        if (imgAspect > boxAspect) {
          // Image is wider than container
          renderWidth = availableWidth;
          renderHeight = availableWidth / imgAspect;
        } else {
          // Image is taller than container
          renderHeight = availableHeight;
          renderWidth = availableHeight * imgAspect;
        }

        // Center horizontally in container
        const renderX = margin + (availableWidth - renderWidth) / 2;
        const renderY = imgStartY + (availableHeight - renderHeight) / 2;

        // Subtle background border
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, imgStartY, availableWidth, availableHeight, 'FD');

        // Draw image
        const format = raster.dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(raster.dataUrl, format, renderX, renderY, renderWidth, renderHeight, undefined, 'FAST');
      } catch (err) {
        console.warn('PDF image draw fallback:', err);
        renderImageFallbackBox(doc, margin, imgStartY, availableWidth, availableHeight, rcpt);
      }
    } else {
      renderImageFallbackBox(doc, margin, imgStartY, availableWidth, availableHeight, rcpt);
    }

    // Page footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${pageNum} of ${receipts.length + 1} · Receipt Line #${i + 1} (${rcpt.fileName || 'voucher'})`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Generate clean filename: YYYY-MM-DD-claim-<staffname>.pdf
  const safeStaffSlug = staffName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'staff';

  const fileName = `${submissionDate}-claim-${safeStaffSlug}.pdf`;
  doc.save(fileName);
  return true;
}

function renderImageFallbackBox(doc, x, y, width, height, rcpt) {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(x, y, width, height, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text('Receipt Document Attached', x + width / 2, y + height / 2 - 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(`File: ${rcpt.fileName || 'Attached Voucher'}`, x + width / 2, y + height / 2, { align: 'center' });
  doc.text(`Original: ${rcpt.currency} ${formatNumber(rcpt.amount)} (SGD ${formatNumber(rcpt.amountSgd)})`, x + width / 2, y + height / 2 + 7, { align: 'center' });
}
