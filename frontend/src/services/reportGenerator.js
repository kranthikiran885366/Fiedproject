import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

class ReportGenerator {
  generatePDF(data, options) {
    const doc = new jsPDF();
    const { title, subtitle, columns, startDate, endDate, scope } = options;

    // Add header
    doc.setFontSize(18);
    doc.text(title, 14, 15);
    doc.setFontSize(12);
    doc.text(subtitle, 14, 25);
    doc.text(`Period: ${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`, 14, 35);
    doc.text(`Scope: ${scope}`, 14, 45);

    // Add table
    doc.autoTable({
      head: [columns.map(col => col.header)],
      body: data.map(row => columns.map(col => row[col.key])),
      startY: 55,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    // Add summary if available
    if (options.summary) {
      const finalY = doc.previousAutoTable.finalY || 150;
      doc.text('Summary', 14, finalY + 10);
      Object.entries(options.summary).forEach(([key, value], index) => {
        doc.text(`${key}: ${value}`, 14, finalY + 20 + (index * 10));
      });
    }

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Generated on ${format(new Date(), 'dd/MM/yyyy HH:mm')} - Page ${i} of ${pageCount}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }

    return doc;
  }

  generateExcel(data, options) {
    const { columns, title, startDate, endDate, scope } = options;

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Add metadata sheet
    const metaData = [
      ['Report Title', title],
      ['Period', `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`],
      ['Scope', scope],
      ['Generated On', format(new Date(), 'dd/MM/yyyy HH:mm')],
      [],
      ['Summary'],
      ...Object.entries(options.summary || {})
    ];
    const metaWs = XLSX.utils.aoa_to_sheet(metaData);
    XLSX.utils.book_append_sheet(wb, metaWs, 'Metadata');

    // Add data sheet
    const wsData = [
      columns.map(col => col.header),
      ...data.map(row => columns.map(col => row[col.key]))
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = columns.map(col => ({ wch: Math.max(col.header.length, 15) }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Data');

    return wb;
  }

  async generateInteractiveData(data, options) {
    // Transform data for interactive charts
    const { type, groupBy } = options;
    
    switch (type) {
      case 'daily':
        return this.transformDailyData(data, groupBy);
      case 'weekly':
        return this.transformWeeklyData(data, groupBy);
      case 'monthly':
        return this.transformMonthlyData(data, groupBy);
      default:
        return data;
    }
  }

  transformDailyData(data, groupBy) {
    // Group data by date and calculate statistics
    const grouped = data.reduce((acc, record) => {
      const date = format(new Date(record.date), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = {
          name: format(new Date(record.date), 'dd MMM'),
          attendance: 0,
          total: 0,
          onTime: 0,
          late: 0
        };
      }
      acc[date].total++;
      if (record.status === 'present') {
        acc[date].attendance++;
        if (record.isLate) {
          acc[date].late++;
        } else {
          acc[date].onTime++;
        }
      }
      return acc;
    }, {});

    // Calculate percentages
    return Object.values(grouped).map(day => ({
      ...day,
      attendance: Math.round((day.attendance / day.total) * 100),
      onTime: Math.round((day.onTime / day.total) * 100),
      late: Math.round((day.late / day.total) * 100)
    }));
  }

  transformWeeklyData(data, groupBy) {
    // Similar to daily but grouped by week
    // Implementation similar to transformDailyData but with week-based grouping
    return [];
  }

  transformMonthlyData(data, groupBy) {
    // Similar to daily but grouped by month
    // Implementation similar to transformDailyData but with month-based grouping
    return [];
  }
}

export const reportGenerator = new ReportGenerator();
