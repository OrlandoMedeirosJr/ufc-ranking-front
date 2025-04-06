"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";

interface Backup {
  filename: string;
  size: string;
  date: string;
}

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [backupsLoaded, setBackupsLoaded] = useState(false);

  const handleBackup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3333/backup');
      
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

  const fetchBackups = async () => {
    try {
      const response = await fetch('http://localhost:3333/backup/list');
      
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
    window.open(`http://localhost:3333/backup/download/${filename}`, '_blank');
  };

  // Carregar lista de backups automaticamente na primeira visita
  if (!backupsLoaded) {
    fetchBackups();
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  return (
    <div className="container mx-auto py-6">
      <Toaster />
      <h1 className="text-3xl font-bold mb-6">Administração do Sistema</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    </div>
  );
} 