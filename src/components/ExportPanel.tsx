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
    csvContent += "Jira ID,Title,Status,Tags,Created At\n";
    state.cards.forEach(card => {
      const row = [
        card.jiraId,
        `"${card.title}"`,
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
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
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
      className="fixed inset-0 bg-[#141414]/95 backdrop-blur-md z-[100] flex items-center justify-center p-6"
    >
      <button 
        onClick={onClose}
        className="absolute top-8 right-8 p-3 text-white/40 hover:text-white transition-colors"
      >
        <X size={32} />
      </button>

      <div className="max-w-xl w-full">
        <div className="text-center mb-16">
          <Briefcase size={48} className="mx-auto text-white/20 mb-6" />
          <h2 className="text-4xl font-serif italic text-white mb-4 tracking-tighter">Export Workspace</h2>
          <p className="text-white/40 text-sm max-w-sm mx-auto">
            Securely export your documentation in multiple formats for archiving or reporting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={exportJSON}
            className="flex flex-col items-center gap-4 p-8 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 hover:border-white/20 transition-all group"
          >
            <div className="p-4 bg-blue-500/20 text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
              <FileJson size={32} />
            </div>
            <div className="text-center">
              <h3 className="text-white font-bold text-sm mb-1 uppercase tracking-widest">JSON</h3>
              <p className="text-white/40 text-[10px]">Full state backup</p>
            </div>
          </button>

          <button 
            onClick={exportCSV}
            className="flex flex-col items-center gap-4 p-8 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 hover:border-white/20 transition-all group"
          >
            <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-2xl group-hover:scale-110 transition-transform">
              <FileText size={32} />
            </div>
            <div className="text-center">
              <h3 className="text-white font-bold text-sm mb-1 uppercase tracking-widest">CSV</h3>
              <p className="text-white/40 text-[10px]">Table spreadsheet</p>
            </div>
          </button>

          <button 
            onClick={exportPDF}
            className="flex flex-col items-center gap-4 p-8 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/10 hover:border-white/20 transition-all group"
          >
            <div className="p-4 bg-rose-500/20 text-rose-400 rounded-2xl group-hover:scale-110 transition-transform">
              <Download size={32} />
            </div>
            <div className="text-center">
              <h3 className="text-white font-bold text-sm mb-1 uppercase tracking-widest">PDF</h3>
              <p className="text-white/40 text-[10px]">Printable document</p>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
