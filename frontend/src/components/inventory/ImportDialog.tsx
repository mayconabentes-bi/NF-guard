import * as React from 'react';
import { 
  FileUp, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { productService } from '@/lib/productService';
import { useAuth } from '@/lib/AuthContext';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportDialog({ open, onOpenChange, onSuccess }: ImportDialogProps) {
  const { profile } = useAuth();
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [previewData, setPreviewData] = React.useState<any[]>([]);
  const [step, setStep] = React.useState<'upload' | 'preview'>('upload');

  const processFile = (file: File) => {
    setIsProcessing(true);
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setPreviewData(results.data);
          setStep('preview');
          setIsProcessing(false);
        },
        error: (error) => {
          toast.error("Erro ao ler CSV: " + error.message);
          setIsProcessing(false);
        }
      });
    } else if (['xlsx', 'xls'].includes(extension || '')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);
        setPreviewData(json);
        setStep('preview');
        setIsProcessing(false);
      };
      reader.readAsBinaryString(file);
    } else {
      toast.error("Formato de arquivo não suportado (.csv, .xlsx, .xls)");
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!profile?.organizationId || previewData.length === 0) return;
    
    setIsProcessing(true);
    try {
      const result = await productService.importBatch(profile.organizationId, previewData);
      toast.success(`${result.success} itens importados com sucesso!`);
      onSuccess();
      onOpenChange(false);
      reset();
    } catch (error) {
      toast.error("Erro na importação em lote");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreviewData([]);
    setStep('upload');
  };

  const downloadTemplate = () => {
    const template = [
      {
        sku: 'PROD-001',
        name: 'Produto Exemplo',
        category: 'Materiais',
        item_unit: 'UN',
        min_stock: '10',
        description: 'Descrição do item'
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "meta_import_template.xlsx");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if(!v) reset(); }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            Importação Inteligente de Dados
          </DialogTitle>
          <DialogDescription>
            Carregue planilhas CSV ou Excel para atualização massiva do estoque.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {step === 'upload' ? (
            <div className="space-y-6">
              <div 
                className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center space-y-4 hover:border-primary/50 transition-colors cursor-pointer bg-slate-50/50"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  {isProcessing ? <Loader2 className="h-6 w-6 text-primary animate-spin" /> : <FileUp className="h-6 w-6 text-primary" />}
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-900">Clique para selecionar ou arraste o arquivo</p>
                  <p className="text-sm text-slate-500">Suporta .CSV, .XLSX, .XLS até 10MB</p>
                </div>
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden" 
                  accept=".csv,.xlsx,.xls" 
                  onChange={handleFileUpload}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-900 uppercase">Excel Nativo</h4>
                    <p className="text-[10px] text-emerald-700">Importe diretamente do seu arquivo de controle sem conversões.</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex gap-3">
                  <FileCode className="h-5 w-5 text-blue-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-900 uppercase">Standard CSV</h4>
                    <p className="text-[10px] text-blue-700">Compatível com exportações de outros ERPs e sistemas legados.</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-900 uppercase">Campos Obrigatórios</p>
                  <p className="text-[10px] text-amber-700">Certifique-se de que sua planilha tenha as colunas: <span className="font-bold">sku, name, category, uom</span>.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-bold">{file?.name}</span>
                    <Badge variant="outline">{previewData.length} registros detectados</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={reset}>Trocar arquivo</Button>
               </div>

               <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                 <table className="w-full text-[10px]">
                   <thead className="bg-slate-50 sticky top-0">
                     <tr>
                        {previewData.length > 0 && Object.keys(previewData[0]).map(key => (
                          <th key={key} className="px-3 py-2 text-left font-bold uppercase text-slate-500 border-b">{key}</th>
                        ))}
                     </tr>
                   </thead>
                   <tbody className="divide-y">
                     {previewData.slice(0, 5).map((row, i) => (
                       <tr key={i} className="hover:bg-slate-50">
                          {Object.values(row).map((val: any, j) => (
                            <td key={j} className="px-3 py-2 whitespace-nowrap">{String(val)}</td>
                          ))}
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {previewData.length > 5 && (
                   <div className="p-2 text-center text-[10px] text-slate-500 bg-slate-50/50">
                     E mais {previewData.length - 5} linhas...
                   </div>
                 )}
               </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={downloadTemplate} className="gap-2">
            <Download className="h-4 w-4" /> Baixar Template
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button 
            onClick={handleImport} 
            disabled={isProcessing || previewData.length === 0}
            className="gap-2"
          >
            {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar Importação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
