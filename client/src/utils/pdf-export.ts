import jsPDF from 'jspdf';
import { Job, Message } from '@/types';

export const generateJobPdf = (job: Job, messages: Message[]) => {
    if (!job || !messages) return null;

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
    pdf.setFontSize(20);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Research Report', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Date: ${new Date(job.createdAt).toLocaleDateString()}`, margin, yPosition);
    yPosition += 15;

    messages.forEach(msg => {
        if (msg.role === 'assistant' && msg.data?.final) {
            pdf.setFontSize(16);
            pdf.setTextColor(0, 0, 0);
            const title = msg.content || 'Research Result';
            const splitTitle = pdf.splitTextToSize(title, pageWidth - (margin * 2));
            pdf.text(splitTitle, margin, yPosition);
            yPosition += (splitTitle.length * 7) + 5;

            if (msg.data.final.summary) {
                pdf.setFontSize(14);
                pdf.text('Summary', margin, yPosition);
                yPosition += 8;

                pdf.setFontSize(11);
                pdf.setTextColor(50, 50, 50);
                const splitSummary = pdf.splitTextToSize(msg.data.final.summary, pageWidth - (margin * 2));

                if (yPosition + (splitSummary.length * 5) > pageHeight - margin) {
                    pdf.addPage();
                    yPosition = margin;
                }

                pdf.text(splitSummary, margin, yPosition);
                yPosition += (splitSummary.length * 5) + 10;
            }

            if (msg.data.final.detailed) {
                if (yPosition + 20 > pageHeight - margin) {
                    pdf.addPage();
                    yPosition = margin;
                }

                pdf.setFontSize(14);
                pdf.setTextColor(0, 0, 0);
                pdf.text('Detailed Analysis', margin, yPosition);
                yPosition += 8;

                pdf.setFontSize(11);
                pdf.setTextColor(50, 50, 50);

                const cleanText = msg.data.final.detailed.replace(/[*#_`]/g, '');
                const splitDetailed = pdf.splitTextToSize(cleanText, pageWidth - (margin * 2));

                splitDetailed.forEach((line: string) => {
                    if (yPosition + 5 > pageHeight - margin) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    pdf.text(line, margin, yPosition);
                    yPosition += 5;
                });

                yPosition += 10;
            }

            if (msg.data.final.citations && msg.data.final.citations.length > 0) {
                if (yPosition + 20 > pageHeight - margin) {
                    pdf.addPage();
                    yPosition = margin;
                }

                pdf.setFontSize(14);
                pdf.setTextColor(0, 0, 0);
                pdf.text('Sources & References', margin, yPosition);
                yPosition += 8;

                msg.data.final.citations.forEach((citation: { source: string; snippet?: string }, idx: number) => {
                    if (yPosition + 15 > pageHeight - margin) {
                        pdf.addPage();
                        yPosition = margin;
                    }

                    pdf.setFontSize(10);
                    pdf.setTextColor(0, 0, 255);
                    const sourceText = `[${idx + 1}] ${citation.source}`;
                    pdf.textWithLink(sourceText, margin, yPosition, { url: citation.source });
                    yPosition += 5;

                    if (citation.snippet) {
                        pdf.setFontSize(9);
                        pdf.setTextColor(100, 100, 100);
                        const snippet = citation.snippet.substring(0, 150) + '...';
                        const splitSnippet = pdf.splitTextToSize(snippet, pageWidth - (margin * 2) - 10);
                        pdf.text(splitSnippet, margin + 5, yPosition);
                        yPosition += (splitSnippet.length * 4) + 5;
                    }
                });
                yPosition += 10;
            }

            yPosition += 10;
            if (yPosition > pageHeight - margin) {
                pdf.addPage();
                yPosition = margin;
            }
        }
    });

    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);

        pdf.setDrawColor(226, 232, 240);
        pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
        pdf.text('Research Agent', pageWidth - margin, pageHeight - 8, { align: 'right' });
    }

    return pdf;
};

export const exportJobToPdf = (job: Job, messages: Message[]) => {
    const pdf = generateJobPdf(job, messages);
    if (!pdf) return;
    pdf.save(`research-report-${job.jobId.slice(0, 8)}.pdf`);
};

export const getJobPdfBlobUrl = (job: Job, messages: Message[]) => {
    const pdf = generateJobPdf(job, messages);
    if (!pdf) return null;
    return pdf.output('bloburl');
};