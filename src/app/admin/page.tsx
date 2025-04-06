"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Loader2, Download, Upload, AlertTriangle } from "lucide-react";
import { buildApiUrl } from "@/config/api";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";

interface Backup {
  filename: string;
  size: string;
  date: string;
}

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [backupsLoaded, setBackupsLoaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar lista de backups automaticamente na primeira montagem do componente
  useEffect(() => {
    fetchBackups();
  }, []);

  const handleBackup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl('backup'));
      
      if (!response.ok) {
        throw new Error('Falha ao realizar backup');
      }
      
      const data = await response.json();
      
      toast({
        title: "Backup realizado com sucesso!",
        description: data.message,
      });
      
      // Atualizar a lista de backups após criar um novo
      fetchBackups();
    } catch (error) {
      toast({
        title: "Erro ao realizar backup",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      // Redirecionar para o endpoint de exportação
      window.location.href = buildApiUrl('backup/exportar');
      
      toast({
        title: "Exportação iniciada",
        description: "O download do arquivo JSON deve começar automaticamente",
      });
    } catch (error) {
      toast({
        title: "Erro ao exportar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      // Pequeno delay para garantir que o toast seja exibido antes de redefinir o estado
      setTimeout(() => {
        setIsExporting(false);
      }, 1000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Verificar se o arquivo é JSON
      if (!file.name.endsWith('.json') && file.type !== 'application/json') {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione apenas arquivos JSON",
          variant: "destructive",
        });
        
        // Limpar input
        e.target.value = '';
        setSelectedFile(null);
        return;
      }
      
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleImportJSON = async () => {
    if (!selectedFile) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo de backup JSON para importar",
        variant: "destructive",
      });
      return;
    }
    
    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('arquivo', selectedFile);
      
      const response = await fetch(buildApiUrl('backup/importar'), {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao importar dados');
      }
      
      const data = await response.json();
      
      // Limpar o arquivo selecionado e o input
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Importação concluída com sucesso!",
        description: `Importados: ${data.detalhes.lutadores} lutadores, ${data.detalhes.eventos} eventos, ${data.detalhes.lutas} lutas`,
      });
    } catch (error) {
      toast({
        title: "Erro ao importar dados",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const fetchBackups = async () => {
    try {
      const response = await fetch(buildApiUrl('backup/list'));
      
      if (!response.ok) {
        throw new Error('Falha ao listar backups');
      }
      
      const data = await response.json();
      setBackups(data.backups);
      setBackupsLoaded(true);
    } catch (error) {
      toast({
        title: "Erro ao listar backups",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const downloadBackup = (filename: string) => {
    window.open(buildApiUrl(`backup/download/${filename}`), '_blank');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  return (
    <div className="container mx-auto py-6">
      <Toaster />
      <h1 className="text-3xl font-bold mb-6">Administração do Sistema</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Backup do Banco de Dados</CardTitle>
            <CardDescription>
              Realize um backup do banco de dados PostgreSQL e baixe-o para armazenamento seguro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleBackup} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando Backup...
                </>
              ) : (
                "📦 Fazer Backup do Banco"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backups Disponíveis</CardTitle>
            <CardDescription>
              Lista de backups disponíveis para download.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {backups.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.filename}>
                      <TableCell>{backup.filename}</TableCell>
                      <TableCell>{backup.size}</TableCell>
                      <TableCell>{formatDate(backup.date)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadBackup(backup.filename)}
                        >
                          ⬇️ Baixar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-4 text-muted-foreground">
                {backupsLoaded ? "Nenhum backup disponível" : "Carregando backups..."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Exportar Dados (JSON)</CardTitle>
            <CardDescription>
              Exporte todos os dados do sistema em formato JSON para backup ou migração.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleExportJSON} 
              disabled={isExporting}
              className="w-full"
              variant="secondary"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando Dados...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Dados
                </>
              )}
            </Button>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Exporta todos os lutadores, eventos e lutas em um único arquivo JSON.
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Importar Dados (JSON)</CardTitle>
            <CardDescription>
              Importe dados de um arquivo JSON de backup para restaurar o sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-md p-4">
              <label className="block text-sm font-medium mb-2">
                Selecione o arquivo de backup:
              </label>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="block w-full text-sm"
                ref={fileInputRef}
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-green-600">
                  Arquivo selecionado: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </p>
              )}
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="secondary"
                  className="w-full"
                  disabled={!selectedFile || isImporting}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importando Dados...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Importar Dados
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                    Confirmação de Importação
                  </DialogTitle>
                  <DialogDescription>
                    Esta operação irá substituir TODOS os dados atuais do sistema pelos dados do arquivo.
                    Esta ação não pode ser desfeita.
                  </DialogDescription>
                </DialogHeader>
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-800">
                  <p className="font-medium">Atenção:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Todos os lutadores serão substituídos</li>
                    <li>Todos os eventos serão substituídos</li>
                    <li>Todas as lutas serão substituídas</li>
                    <li>Os rankings serão recalculados</li>
                  </ul>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button 
                      variant="destructive" 
                      onClick={handleImportJSON}
                      disabled={isImporting}
                    >
                      Confirmar Importação
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Atenção: A importação substituirá todos os dados existentes no sistema.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 