import jsPDF from 'jspdf';
import type { PNode } from './types';

const COLORS = {
  primary: '#7B3FF2',
  aqua: '#14f195',
  excellent: '#10B981',
  good: '#3B82F6',
  warning: '#F59E0B',
  critical: '#EF4444',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1000;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds: number) => {
  if (seconds <= 0) return 'N/A';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
};

export async function exportPNodeToPDF(
  pnode: PNode,
  health: string,
  credits?: number | null,
  creditsRank?: number | null
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Helper: Draw section divider
  const drawDivider = (y: number) => {
    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
  };

  // Helper: Add section header (without emojis for PDF compatibility)
  const addSectionHeader = (title: string, y: number) => {
    doc.setFillColor(COLORS.primary);
    doc.rect(20, y - 2, 3, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.text);
    doc.text(title, 26, y + 4);
    return y + 12;
  };

  // Header with gradient effect (simulated with rectangles)
  doc.setFillColor(123, 63, 242);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('XANDEUM PNODE REPORT', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString('en-US')}`, pageWidth / 2, 25, { align: 'center' });
  doc.text('Xandeum pNode Analytics Platform', pageWidth / 2, 32, { align: 'center' });

  yPos = 50;

  // NODE OVERVIEW
  yPos = addSectionHeader('NODE OVERVIEW', yPos);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.textLight);
  
  const overviewData = [
    ['IP Address:', pnode.ip],
    ['Location:', [pnode.city, pnode.country].filter(Boolean).join(', ') || 'Unknown'],
    ['Status:', `${health} (${pnode.status === 'active' ? 'Public' : 'Private'} Node)`],
    ['Version:', pnode.version || 'Unknown'],
  ];
  
  overviewData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.text);
    doc.text(label, 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.textLight);
    doc.text(value, 70, yPos);
    yPos += 6;
  });

  yPos += 5;
  drawDivider(yPos);
  yPos += 10;

  // IDENTITY
  if (pnode.pubkey || (pnode.lat !== null && pnode.lng !== null)) {
    yPos = addSectionHeader('IDENTITY & CREDENTIALS', yPos);
    
    if (pnode.pubkey) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.text);
      doc.text('Public Key:', 25, yPos);
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(COLORS.primary);
      doc.text(pnode.pubkey, 25, yPos + 5);
      yPos += 12;
      doc.setFontSize(10);
    }
    
    if (pnode.stats.uptime > 0) {
      const firstSeen = new Date(Date.now() - pnode.stats.uptime * 1000);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.text);
      doc.text('First Seen:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.textLight);
      doc.text(firstSeen.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), 70, yPos);
      yPos += 6;
    }
    
    if (pnode.lat !== null && pnode.lat !== undefined && pnode.lng !== null && pnode.lng !== undefined) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.text);
      doc.text('Coordinates:', 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.textLight);
      doc.text(`${pnode.lat.toFixed(4)}, ${pnode.lng.toFixed(4)}`, 70, yPos);
      yPos += 6;
    }
    
    yPos += 5;
    drawDivider(yPos);
    yPos += 10;
  }

  // SYSTEM METRICS
  yPos = addSectionHeader('SYSTEM METRICS', yPos);
  
  const systemData = [
    ['CPU Usage:', `${pnode.stats.cpu_percent.toFixed(1)}%`],
    ['RAM Usage:', `${((pnode.stats.ram_used / pnode.stats.ram_total) * 100).toFixed(1)}%`],
    ['RAM:', `${formatBytes(pnode.stats.ram_used)} / ${formatBytes(pnode.stats.ram_total)}`],
    ['Uptime:', formatUptime(pnode.stats.uptime)],
  ];
  
  systemData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.text);
    doc.text(label, 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.textLight);
    doc.text(value, 70, yPos);
    yPos += 6;
  });

  yPos += 5;
  drawDivider(yPos);
  yPos += 10;

  // STORAGE ANALYTICS
  yPos = addSectionHeader('STORAGE ANALYTICS', yPos);
  
  const storageCommitted = pnode.stats.storage_committed ?? 0;
  const storageUsed = pnode.stats.storage_used ?? 0;
  const storageAvailable = Math.max(0, storageCommitted - storageUsed);
  const storagePercent = storageCommitted > 0 ? ((storageUsed / storageCommitted) * 100).toFixed(1) : '0';
  
  const storageData = [
    ['Committed Capacity:', formatBytes(storageCommitted)],
    ['Actually Used:', formatBytes(storageUsed)],
    ['Available Space:', formatBytes(storageAvailable)],
    ['Utilization:', `${storagePercent}%`],
  ];
  
  storageData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.text);
    doc.text(label, 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.textLight);
    doc.text(value, 70, yPos);
    yPos += 6;
  });

  yPos += 5;
  drawDivider(yPos);
  yPos += 10;

  // BLOCKCHAIN METRICS
  yPos = addSectionHeader('BLOCKCHAIN METRICS', yPos);
  
  const blockchainData = [
    ['Active Streams:', (pnode.stats.active_streams ?? 0).toLocaleString()],
    ['Total Pages:', (pnode.stats.total_pages ?? 0).toLocaleString()],
    ['Current Index:', (pnode.stats.current_index ?? 0).toLocaleString()],
    ['Packets Sent:', (pnode.stats.packets_sent ?? 0).toLocaleString()],
    ['Packets Received:', (pnode.stats.packets_received ?? 0).toLocaleString()],
    ['Total Packets:', ((pnode.stats.packets_sent ?? 0) + (pnode.stats.packets_received ?? 0)).toLocaleString()],
  ];
  
  blockchainData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.text);
    doc.text(label, 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.textLight);
    doc.text(value, 70, yPos);
    yPos += 6;
  });

  // ECONOMIC METRICS (if available)
  if (credits !== null && credits !== undefined && credits > 0) {
    // Check if we need a new page before adding this section
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 20;
    }
    
    yPos += 5;
    drawDivider(yPos);
    yPos += 10;
    
    yPos = addSectionHeader('ECONOMIC PERFORMANCE', yPos);
    
    const tier = creditsRank && creditsRank <= 10 ? 'Top 10 Elite' 
      : creditsRank && creditsRank <= 50 ? 'Top 50 Performer' 
      : 'Active Earner';
    
    const economicData = [
      ['Credits Earned:', credits.toLocaleString() + ' XAN'],
      ['Network Rank:', creditsRank ? `#${creditsRank}` : 'N/A'],
      ['Performance Tier:', tier],
    ];
    
    economicData.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.text);
      doc.text(label, 25, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.textLight);
      doc.text(value, 70, yPos);
      yPos += 6;
    });
  }

  // Footer - always at the end with proper spacing
  yPos += 10;
  
  // If we're too close to the bottom, add a new page
  if (yPos > pageHeight - 25) {
    doc.addPage();
    yPos = 20;
  }
  
  // Draw footer
  drawDivider(yPos);
  yPos += 7;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(COLORS.textLight);
  doc.text('Report generated by Xandeum pNode Analytics Platform', pageWidth / 2, yPos, { align: 'center' });
  doc.text('https://xandeum-dashboard-topaz.vercel.app', pageWidth / 2, yPos + 4, { align: 'center' });

  // Save
  doc.save(`pnode-${pnode.ip}-report.pdf`);
}
