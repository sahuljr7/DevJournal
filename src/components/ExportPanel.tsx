import { motion } from 'motion/react';
import { X, FileJson, FileText, Download, Briefcase } from 'lucide-react';
import { AppState } from '../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ExportPanelProps {
  state: AppState;
  onClose: () => void;
}

export default function ExportPanel({ state, onClose }: ExportPanelProps) {
  const exportJSON = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `devjournal_backup_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Jira ID,Title,Description,Status,Tags,Created At\n";
    state.cards.forEach(card => {
      const row = [
        card.jiraId,
        `"${card.title}"`,
        `"${(card.description || "").replace(/"/g, '""')}"`,
        card.status,
        `"${card.tags.join(', ')}"`,
        card.createdAt
      ].join(",");
      csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `jira_cards_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('DevJournal Work Log Export', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 14, 28);

    let y = 40;
    state.cards.forEach((card, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${card.jiraId}: ${card.title}`, 14, y);
      y += 8;
      
      if (card.description) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(120);
        const splitDesc = doc.splitTextToSize(card.description, 180);
        doc.text(splitDesc, 14, y);
        y += (splitDesc.length * 4) + 4;
      }
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);
      doc.text(`Status: ${card.status} | Tags: ${card.tags.join(', ')}`, 14, y);
      y += 12;

      const cardLogs = state.logs.filter(l => l.cardId === card.id);
      cardLogs.forEach(log => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Log dated: ${new Date(log.timestamp).toLocaleString()}`, 14, y);
        y += 5;
        doc.setTextColor(0);
        doc.setFontSize(10);
        const splitText = doc.splitTextToSize(log.content, 180);
        doc.text(splitText, 14, y);
        y += (splitText.length * 5) + 10;
      });

      y += 10;
    });

    doc.save(`devjournal_full_export_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 p-3 text-white/40 hover:text-white transition-colors"
      >
        <X size={32} />
      </button>

      <div className="max-w-xl w-full bg-[var(--bg-color)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-12" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-16">
          <Briefcase size={32} className="mx-auto text-[var(--muted-color)] mb-6 transition-colors" />
          <h2 className="text-3xl font-serif italic text-[var(--ink-color)] mb-4 tracking-tight transition-colors">Export Workspace</h2>
          <p className="text-[var(--muted-color)] text-sm max-w-sm mx-auto transition-colors">
            Securely export your documentation in multiple formats for archiving or reporting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={exportJSON}
            className="flex flex-col items-center gap-4 p-6 bg-[var(--secondary-bg)] border border-[var(--border-color)] rounded-xl hover:border-[var(--muted-color)] transition-all group"
          >
            <div className="p-3 bg-blue-500/20 text-blue-500 rounded-lg group-hover:scale-110 transition-transform">
              <FileJson size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-[var(--ink-color)] font-bold text-[10px] mb-1 uppercase tracking-widest transition-colors">JSON</h3>
              <p className="text-[var(--muted-color)] text-[8px] transition-colors">Backup</p>
            </div>
          </button>

          <button 
            onClick={exportCSV}
            className="flex flex-col items-center gap-4 p-6 bg-[var(--secondary-bg)] border border-[var(--border-color)] rounded-xl hover:border-[var(--muted-color)] transition-all group"
          >
            <div className="p-3 bg-emerald-500/20 text-emerald-500 rounded-lg group-hover:scale-110 transition-transform">
              <FileText size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-[var(--ink-color)] font-bold text-[10px] mb-1 uppercase tracking-widest transition-colors">CSV</h3>
              <p className="text-[var(--muted-color)] text-[8px] transition-colors">Sheets</p>
            </div>
          </button>

          <button 
            onClick={exportPDF}
            className="flex flex-col items-center gap-4 p-6 bg-[var(--secondary-bg)] border border-[var(--border-color)] rounded-xl hover:border-[var(--muted-color)] transition-all group"
          >
            <div className="p-3 bg-rose-500/20 text-rose-500 rounded-lg group-hover:scale-110 transition-transform">
              <Download size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-[var(--ink-color)] font-bold text-[10px] mb-1 uppercase tracking-widest transition-colors">PDF</h3>
              <p className="text-[var(--muted-color)] text-[8px] transition-colors">Print</p>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
