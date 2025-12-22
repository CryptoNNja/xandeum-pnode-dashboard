import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PNode } from './types';

interface PDFReportData {
  nodes: PNode[];
  summary: {
    totalNodes: number;
    publicNodes: number;
    privateNodes: number;
    avgCPU: number;
    avgRAM: number;
    avgUptime: number;
    healthyNodes: number;
    networkThroughput: number;
    totalStorage: number;
  };
  isCustomSelection?: boolean;
}

export const generatePDFReport = (data: PDFReportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Colors
  const primaryColor: [number, number, number] = [123, 63, 242]; // Purple
  const secondaryColor: [number, number, number] = [20, 241, 149]; // Green
  const textColor: [number, number, number] = [15, 23, 42]; // Dark blue
  const lightGray: [number, number, number] = [243, 244, 246];
  
  let yPosition = 20;

  // ===== HEADER =====
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const title = data.isCustomSelection 
    ? `Xandeum pNode Report - ${data.nodes.length} Selected Nodes`
    : 'Xandeum pNode Analytics Report';
  doc.text(title, pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const timestamp = new Date().toLocaleString('en-US', { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  });
  doc.text(`Generated: ${timestamp}`, pageWidth / 2, 32, { align: 'center' });
  
  yPosition = 50;

  // ===== EXECUTIVE SUMMARY =====
  doc.setTextColor(...textColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 14, yPosition);
  
  yPosition += 10;

  // Calculate storage metrics
  const totalStorageCommitted = data.nodes.reduce((sum, n) => sum + (n.stats?.storage_committed || 0), 0);
  const totalStorageUsed = data.nodes.reduce((sum, n) => sum + (n.stats?.storage_used || 0), 0);
  const storageUtilization = totalStorageCommitted > 0 ? (totalStorageUsed / totalStorageCommitted * 100) : 0;

  // Summary boxes
  const summaryData: Array<{ label: string; value: string; color: [number, number, number] }> = [
    { label: 'Total Nodes', value: data.summary.totalNodes.toString(), color: primaryColor },
    { label: 'Public Nodes', value: data.summary.publicNodes.toString(), color: secondaryColor },
    { label: 'Healthy Nodes', value: `${data.summary.healthyNodes} (${((data.summary.healthyNodes / data.summary.totalNodes) * 100).toFixed(1)}%)`, color: [16, 185, 129] },
    { label: 'Avg CPU Usage', value: `${(data.summary.avgCPU || 0).toFixed(1)}%`, color: [59, 130, 246] },
    { label: 'Storage Committed', value: formatBytes(totalStorageCommitted), color: [168, 85, 247] },
    { label: 'Storage Used', value: formatBytes(totalStorageUsed), color: [236, 72, 153] },
    { label: 'Storage Utilization', value: `${storageUtilization.toFixed(1)}%`, color: [34, 197, 94] },
    { label: 'Avg RAM Usage', value: `${(data.summary.avgRAM || 0).toFixed(1)}%`, color: [251, 146, 60] },
  ];

  const boxWidth = (pageWidth - 40) / 2;
  const boxHeight = 20;
  let xPos = 14;
  let yPos = yPosition;

  summaryData.forEach((item, index) => {
    if (index % 2 === 0 && index > 0) {
      yPos += boxHeight + 5;
      xPos = 14;
    }

    // Box background
    doc.setFillColor(...lightGray);
    doc.roundedRect(xPos, yPos, boxWidth - 5, boxHeight, 3, 3, 'F');
    
    // Label
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(item.label, xPos + 5, yPos + 8);
    
    // Value
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...item.color);
    doc.text(item.value, xPos + 5, yPos + 16);

    xPos += boxWidth;
  });
  
  doc.setFont('helvetica', 'normal');

  yPosition = yPos + boxHeight + 15;

  // ===== NETWORK METRICS =====
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Network Metrics', 14, yPosition);
  
  yPosition += 8;

  const metricsData = [
    ['Average RAM Usage', `${(data.summary.avgRAM || 0).toFixed(1)}%`],
    ['Average Uptime', formatUptime(data.summary.avgUptime || 0)],
    ['Network Throughput', `${((data.summary.networkThroughput || 0) / 1000).toFixed(1)}K pkt/s`],
    ['Total Storage', formatBytes(data.summary.totalStorage || 0)],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Metric', 'Value']],
    body: metricsData,
    theme: 'grid',
    headStyles: { 
      fillColor: primaryColor,
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 'auto', fontStyle: 'bold' }
    },
    margin: { left: 14, right: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // ===== TOP PERFORMERS =====
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const topNodesTitle = data.isCustomSelection 
    ? `Top ${Math.min(data.nodes.filter(n => n.status === 'active').length, 10)} Selected Nodes`
    : 'Top 10 Performing Nodes';
  doc.text(topNodesTitle, 14, yPosition);
  
  yPosition += 8;

  // Sort nodes by score (use _score from augmented nodes or calculate)
  const topNodes = [...data.nodes]
    .filter(n => n.status === 'active')
    .sort((a, b) => ((b as any)._score || 0) - ((a as any)._score || 0))
    .slice(0, 10);

  const nodeTableData = topNodes.map((node, index) => {
    const score = (node as any)._score || 0;
    const healthText = score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Warning' : 'Critical';
    const ramPercent = node.stats?.ram_used && node.stats?.ram_total 
      ? ((node.stats.ram_used / node.stats.ram_total) * 100).toFixed(1) 
      : '0.0';
    const storageCommitted = formatBytes(node.stats?.storage_committed || 0);
    const storageUsed = formatBytes(node.stats?.storage_used || 0);
    const pubkeyShort = node.pubkey ? `${node.pubkey.substring(0, 8)}...${node.pubkey.substring(node.pubkey.length - 6)}` : 'N/A';
    
    return [
      `#${index + 1}`,
      node.ip || 'N/A',
      pubkeyShort,
      score.toFixed(1),
      `${(node.stats?.cpu_percent || 0).toFixed(1)}%`,
      `${ramPercent}%`,
      storageCommitted,
      storageUsed,
      formatUptime(node.stats?.uptime || 0),
      healthText
    ];
  });

  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'IP Address', 'PubKey', 'Score', 'CPU', 'RAM', 'Storage\nCommitted', 'Storage\nUsed', 'Uptime', 'Health']],
    body: nodeTableData,
    theme: 'striped',
    headStyles: { 
      fillColor: primaryColor,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle'
    },
    bodyStyles: {
      fontSize: 7,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 28, halign: 'left', fontSize: 7 },
      2: { cellWidth: 30, halign: 'left', fontSize: 6, fontStyle: 'italic' },
      3: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 15, halign: 'right' },
      5: { cellWidth: 15, halign: 'right' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 20, halign: 'right' },
      8: { cellWidth: 22, halign: 'center' },
      9: { cellWidth: 20, halign: 'center' }
    },
    margin: { left: 14, right: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // ===== HEALTH DISTRIBUTION =====
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Health Distribution', 14, yPosition);
  
  yPosition += 8;

  const healthCounts = {
    excellent: data.nodes.filter(n => ((n as any)._score || 0) >= 90).length,
    good: data.nodes.filter(n => ((n as any)._score || 0) >= 70 && ((n as any)._score || 0) < 90).length,
    warning: data.nodes.filter(n => ((n as any)._score || 0) >= 50 && ((n as any)._score || 0) < 70).length,
    critical: data.nodes.filter(n => ((n as any)._score || 0) < 50).length,
  };

  const healthData = [
    ['Excellent (>=90%)', healthCounts.excellent.toString()],
    ['Good (70-89%)', healthCounts.good.toString()],
    ['Warning (50-69%)', healthCounts.warning.toString()],
    ['Critical (<50%)', healthCounts.critical.toString()],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Health Status', 'Count']],
    body: healthData,
    theme: 'striped',
    headStyles: { 
      fillColor: primaryColor,
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 10
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 40, fontStyle: 'bold', halign: 'right' }
    },
    margin: { left: 14, right: 14 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // ===== STORAGE ANALYTICS =====
  if (yPosition > pageHeight - 80) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text('Storage Analytics (Decentralized Storage Network)', 14, yPosition);
  
  yPosition += 8;

  // Top storage contributors
  const topStorageNodes = [...data.nodes]
    .filter(n => n.status === 'active')
    .sort((a, b) => (b.stats?.storage_committed || 0) - (a.stats?.storage_committed || 0))
    .slice(0, 10);

  const storageTableData = topStorageNodes.map((node, index) => {
    const committed = node.stats?.storage_committed || 0;
    const used = node.stats?.storage_used || 0;
    const utilization = committed > 0 ? ((used / committed) * 100).toFixed(1) : '0.0';
    const pubkeyShort = node.pubkey ? `${node.pubkey.substring(0, 8)}...${node.pubkey.substring(node.pubkey.length - 6)}` : 'N/A';
    
    return [
      `#${index + 1}`,
      node.ip || 'N/A',
      pubkeyShort,
      formatBytes(committed),
      formatBytes(used),
      `${utilization}%`,
      formatUptime(node.stats?.uptime || 0)
    ];
  });

  autoTable(doc, {
    startY: yPosition,
    head: [['#', 'IP Address', 'PubKey', 'Committed', 'Used', 'Util%', 'Uptime']],
    body: storageTableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [168, 85, 247], // Purple for storage
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle'
    },
    bodyStyles: {
      fontSize: 7,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 28, halign: 'left', fontSize: 7 },
      2: { cellWidth: 35, halign: 'left', fontSize: 6, fontStyle: 'italic' },
      3: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 22, halign: 'center' }
    },
    margin: { left: 14, right: 14 },
  });

  // ===== FOOTER =====
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'Generated by Xandeum pNode Analytics Platform',
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // ===== SAVE PDF =====
  const filename = `xandeum-pnodes-report-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

// Helper functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatUptime(seconds: number): string {
  if (seconds === 0) return '0s';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getHealthEmoji(score: number): string {
  if (score >= 90) return '🟢';
  if (score >= 70) return '🔵';
  if (score >= 50) return '🟡';
  return '🔴';
}
