import jsPDF from 'jspdf';
import type { NetworkHealthScore } from './network-health';

export async function exportNetworkHealthToPDF(healthData: NetworkHealthScore) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let currentY = margin;

  // Helper functions
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    pdf.setFont(options.font || 'helvetica', options.style || 'normal');
    pdf.setFontSize(options.size || 10);
    pdf.setTextColor(options.color || '#000000');
    pdf.text(text, x, y);
  };

  const addLine = (y: number, color = '#E5E7EB') => {
    pdf.setDrawColor(color);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
  };

  const addRect = (x: number, y: number, w: number, h: number, fillColor: string, borderColor?: string) => {
    pdf.setFillColor(fillColor);
    if (borderColor) {
      pdf.setDrawColor(borderColor);
      pdf.rect(x, y, w, h, 'FD');
    } else {
      pdf.rect(x, y, w, h, 'F');
    }
  };

  // Header
  pdf.setFillColor('#3B82F6');
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  addText('Network Health Report', margin, 20, { size: 24, style: 'bold', color: '#FFFFFF' });
  addText(new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }), margin, 30, { size: 10, color: '#FFFFFF' });

  currentY = 55;

  // Overall Score Section
  addText('Overall Health Score', margin, currentY, { size: 16, style: 'bold' });
  currentY += 10;

  // Score Circle (simulated with rectangles)
  const scoreBoxX = margin;
  const scoreBoxY = currentY;
  const scoreBoxSize = 40;

  // Determine color based on score
  let scoreColor = '#EF4444'; // red
  if (healthData.overall >= 80) scoreColor = '#10B981'; // green
  else if (healthData.overall >= 60) scoreColor = '#F59E0B'; // yellow
  else if (healthData.overall >= 40) scoreColor = '#F59E0B'; // yellow

  addRect(scoreBoxX, scoreBoxY, scoreBoxSize, scoreBoxSize, scoreColor);
  addText(healthData.overall.toString(), scoreBoxX + scoreBoxSize / 2, scoreBoxY + scoreBoxSize / 2 + 5, { 
    size: 20, 
    style: 'bold', 
    color: '#FFFFFF' 
  });

  // Rating text
  addText(`Rating: ${healthData.rating.toUpperCase()}`, scoreBoxX + scoreBoxSize + 10, scoreBoxY + 15, { 
    size: 12, 
    style: 'bold' 
  });
  addText(`Out of 100`, scoreBoxX + scoreBoxSize + 10, scoreBoxY + 25, { 
    size: 10, 
    color: '#6B7280' 
  });

  currentY += scoreBoxSize + 20;
  addLine(currentY);
  currentY += 10;

  // Component Scores
  addText('Component Breakdown', margin, currentY, { size: 14, style: 'bold' });
  currentY += 10;

  const components = Object.entries(healthData.components);
  components.forEach(([key, component]) => {
    // Component name
    addText(component.label, margin, currentY, { size: 11, style: 'bold' });
    
    // Score
    addText(`${component.score}/100`, pageWidth - margin - 30, currentY, { size: 11 });

    // Progress bar
    currentY += 5;
    const barWidth = contentWidth - 40;
    const barHeight = 6;
    const barX = margin;
    
    // Background bar
    addRect(barX, currentY, barWidth, barHeight, '#E5E7EB');
    
    // Filled bar
    const fillWidth = (component.score / 100) * barWidth;
    addRect(barX, currentY, fillWidth, barHeight, component.color);

    currentY += barHeight + 10;
  });

  currentY += 10;
  addLine(currentY);
  currentY += 10;

  // Top Recommendations
  if (healthData.recommendations.length > 0) {
    addText('Top Recommendations', margin, currentY, { size: 14, style: 'bold' });
    currentY += 10;

    const topRecs = healthData.recommendations.slice(0, 5);
    topRecs.forEach((rec, index) => {
      // Check if we need a new page
      if (currentY > pageHeight - 40) {
        pdf.addPage();
        currentY = margin;
      }

      // Severity badge
      let severityColor = '#3B82F6';
      if (rec.severity === 'critical') severityColor = '#EF4444';
      else if (rec.severity === 'warning') severityColor = '#F59E0B';

      const badgeX = margin;
      const badgeY = currentY;
      const badgeWidth = 20;
      const badgeHeight = 6;
      
      addRect(badgeX, badgeY, badgeWidth, badgeHeight, severityColor);
      addText(rec.severity.toUpperCase(), badgeX + 1, badgeY + 4.5, { 
        size: 7, 
        color: '#FFFFFF' 
      });

      // Title
      addText(`${index + 1}. ${rec.title}`, badgeX + badgeWidth + 5, currentY + 4, { 
        size: 10, 
        style: 'bold' 
      });
      
      currentY += 8;

      // Description
      const descLines = pdf.splitTextToSize(rec.description, contentWidth - 25);
      descLines.forEach((line: string) => {
        addText(line, badgeX + 5, currentY, { size: 9, color: '#6B7280' });
        currentY += 5;
      });

      currentY += 5;
    });
  }

  // Footer
  const footerY = pageHeight - 15;
  addLine(footerY - 5);
  addText('Generated by Network Health Dashboard', margin, footerY, { 
    size: 8, 
    color: '#6B7280' 
  });
  addText(`Page 1 of ${pdf.getNumberOfPages()}`, pageWidth - margin - 20, footerY, { 
    size: 8, 
    color: '#6B7280' 
  });

  // Save the PDF
  const fileName = `network-health-report-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}
