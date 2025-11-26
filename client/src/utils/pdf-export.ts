import jsPDF from 'jspdf';
import { JobState } from '@/hooks/useJobStream';

export const exportJobToPdf = (job: JobState) => {
    if (!job || !job.data.final) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    let yPosition = margin;

    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageWidth, 40, 'F');

    pdf.setFontSize(22);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Research Report', margin, 25);

    pdf.setFontSize(10);
    pdf.setTextColor(219, 234, 254);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin, 32);

    yPosition = 55;

    pdf.setFontSize(12);
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Research Query:', margin, yPosition);

    pdf.setFontSize(12);
    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'normal');
    const queryLines = pdf.splitTextToSize(job.query, contentWidth - 40);
    pdf.text(queryLines, margin + 40, yPosition);
    yPosition += (queryLines.length * 7) + 15;

    pdf.setDrawColor(37, 99, 235);
    pdf.setLineWidth(0.5);
    pdf.setFillColor(239, 246, 255);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const summaryText = job.data.final.summary.replace(/\[\d+\]/g, '');
    const summaryLines = pdf.splitTextToSize(summaryText, contentWidth - 10);
    const summaryHeight = (summaryLines.length * 6) + 25;

    pdf.roundedRect(margin, yPosition, contentWidth, summaryHeight, 2, 2, 'FD');

    pdf.setFontSize(12);
    pdf.setTextColor(30, 58, 138);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Executive Summary', margin + 5, yPosition + 10);

    pdf.setFontSize(11);
    pdf.setTextColor(51, 65, 85);
    pdf.setFont('helvetica', 'normal');
    pdf.text(summaryLines, margin + 5, yPosition + 20);

    yPosition += summaryHeight + 20;

    pdf.setFontSize(16);
    pdf.setTextColor(30, 58, 138);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Detailed Analysis', margin, yPosition);
    yPosition += 10;

    const detailedText = job.data.final.detailed
        .replace(/#{1,3}\s/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\[\d+\]/g, '');

    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'normal');

    const lines = pdf.splitTextToSize(detailedText, contentWidth);
    const lineHeight = 7;

    for (let i = 0; i < lines.length; i++) {
        if (yPosition + lineHeight > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin + 10; // Extra margin on new pages
        }
        pdf.text(lines[i], margin, yPosition);
        yPosition += lineHeight;
    }

    // --- Sources Section ---
    pdf.addPage();
    yPosition = margin + 10;

    pdf.setFontSize(16);
    pdf.setTextColor(30, 58, 138); // Blue-900
    pdf.setFont('helvetica', 'bold');
    pdf.text('Sources & References', margin, yPosition);
    yPosition += 15;

    job.data.final.citations.forEach((citation, idx) => {
        if (yPosition + 25 > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin + 10;
        }

        // Citation Number Badge
        pdf.setFillColor(219, 234, 254); // Blue-100
        pdf.circle(margin + 4, yPosition - 1, 4, 'F');

        pdf.setFontSize(9);
        pdf.setTextColor(30, 58, 138); // Blue-900
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${idx + 1}`, margin + 2.5, yPosition);

        // URL
        pdf.setFontSize(10);
        pdf.setTextColor(37, 99, 235); // Blue-600
        pdf.setFont('helvetica', 'normal');
        const urlLines = pdf.splitTextToSize(citation.source, contentWidth - 20);
        pdf.text(urlLines, margin + 15, yPosition);
        yPosition += (urlLines.length * 5) + 2;

        // Snippet
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139); // Slate-500
        pdf.setFont('helvetica', 'italic');
        const snippetLines = pdf.splitTextToSize(`"${citation.snippet}"`, contentWidth - 20);
        pdf.text(snippetLines, margin + 15, yPosition);
        yPosition += (snippetLines.length * 5) + 10; // Extra spacing between citations
    });

    // --- Footer ---
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);

        // Footer Line
        pdf.setDrawColor(226, 232, 240); // Slate-200
        pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184); // Slate-400
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
        pdf.text('Research Agent', pageWidth - margin, pageHeight - 8, { align: 'right' });
    }

    // Save
    const fileName = `research-${job.query.substring(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.pdf`;
    pdf.save(fileName);
};