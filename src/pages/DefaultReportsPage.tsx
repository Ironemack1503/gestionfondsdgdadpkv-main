/**
 * Page de gestion et configuration des rapports par défaut
 * Permet de voir et configurer les trois rapports officiels DGDA
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DefaultReportSelector } from "@/components/shared/DefaultReportSelector";
import { OfficialReportEditor } from "@/components/reports/OfficialReportEditor";
import { useDefaultReports } from "@/hooks/useDefaultReports";
import { 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Settings, 
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Lock,
  Edit3,
  Eye,
  List
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function DefaultReportsPage() {
  const navigate = useNavigate();
  const { 
    reports, 
    selectedReport: defaultSelectedReport, 
    exportConfig, 
    availableFormats 
  } = useDefaultReports();
  
  const [restrictExports, setRestrictExports] = useState<boolean>(exportConfig.restrictToDefaultReports);
  const [activeTab, setActiveTab] = useState<'overview' | 'edit'>('overview');
  const [selectedReportId, setSelectedReportId] = useState<string>(defaultSelectedReport);

  const selectedReportDetails = reports.find(r => r.id === selectedReportId);

  const handleGoToReport = (reportPath: string) => {
    navigate(reportPath);
  };

  const handleSelectReport = (reportId: string) => {
    setSelectedReportId(reportId);
  };

  // Mapper l'ID du rapport au type pour l'éditeur
  const getReportTypeForEditor = (reportId: string): 'programmation' | 'feuilleCaisse' | 'sommaire' | null => {
    switch (reportId) {
      case 'programmation':
        return 'programmation';
      case 'feuille-caisse':
        return 'feuilleCaisse';
      case 'sommaire':
        return 'sommaire';
      default:
        return null;
    }
  };

  const reportType = getReportTypeForEditor(selectedReportId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapports par Défaut"
        description="Configuration et gestion des trois rapports officiels DGDA"
      />

      {/* Alerte d'information */}
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Rapports Officiels DGDA</AlertTitle>
        <AlertDescription>
          Les trois rapports suivants sont définis comme rapports officiels et sont disponibles pour l'export 
          dans toute l'application : <strong>Feuille de Caisse</strong>, <strong>Sommaire Mensuel</strong> 
          et <strong>Programmation des Dépenses</strong>.
        </AlertDescription>
      </Alert>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'overview' | 'edit')} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Éditer les rapports
          </TabsTrigger>
        </TabsList>

        {/* Onglet Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6 mt-6">

      {/* Configuration globale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration des Exports
          </CardTitle>
          <CardDescription>
            Paramètres globaux pour l'exportation des rapports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="restrict-exports" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Restreindre aux rapports officiels
              </Label>
              <p className="text-sm text-muted-foreground">
                Lorsque activé, seuls les rapports officiels peuvent être exportés
              </p>
            </div>
            <Switch
              id="restrict-exports"
              checked={restrictExports}
              onCheckedChange={setRestrictExports}
            />
          </div>

          {restrictExports && (
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {exportConfig.restrictionMessage}
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          <div className="space-y-2">
            <Label>Formats d'export autorisés</Label>
            <div className="flex gap-2">
              {exportConfig.allowedFormats.map((format) => (
                <Badge key={format} variant="outline" className="gap-1">
                  {format === 'pdf' && <FileText className="h-3 w-3" />}
                  {format === 'excel' && <FileSpreadsheet className="h-3 w-3" />}
                  {format === 'word' && <Download className="h-3 w-3" />}
                  {format.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sélecteur de rapport */}
      <Card>
        <CardHeader>
          <CardTitle>Sélectionner un Rapport</CardTitle>
          <CardDescription>
            Choisissez le rapport officiel que vous souhaitez consulter ou exporter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DefaultReportSelector />
        </CardContent>
      </Card>

      {/* Détails du rapport sélectionné */}
      {selectedReportDetails && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedReportDetails.name}
                  <Badge variant="default">Sélectionné</Badge>
                </CardTitle>
                <CardDescription className="mt-2">
                  {selectedReportDetails.description}
                </CardDescription>
              </div>
              <Button
                onClick={() => handleGoToReport(selectedReportDetails.path)}
                className="gap-2"
              >
                Ouvrir le rapport
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Catégorie</Label>
                <div>
                  <Badge variant="outline">Rapport officiel DGDA</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Formats disponibles</Label>
                <div className="flex gap-2 flex-wrap">
                  {availableFormats.map((format) => (
                    <Badge key={format} variant="secondary">
                      {format.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Chemin</Label>
                <p className="text-sm text-muted-foreground font-mono">
                  {selectedReportDetails.path}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Statut</Label>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Actif et disponible</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des rapports avec accès rapide */}
      <Card>
        <CardHeader>
          <CardTitle>Accès Rapide aux Rapports</CardTitle>
          <CardDescription>
            Accédez directement à l'un des rapports officiels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-all"
              >
                <div>
                  <p className="font-medium">{report.name}</p>
                  <p className="text-sm text-muted-foreground">{report.description}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGoToReport(report.path)}
                  className="gap-2"
                >
                  Ouvrir
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            À propos des Rapports par Défaut
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Pourquoi ces trois rapports ?</h4>
            <p className="text-sm text-muted-foreground">
              Ces trois rapports correspondent aux documents officiels exigés par la DGDA pour la gestion 
              financière. Ils constituent la base de la comptabilité et du suivi budgétaire.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Formats d'export</h4>
            <p className="text-sm text-muted-foreground">
              Chaque rapport peut être exporté en PDF (pour l'archivage et l'impression), Excel (pour 
              l'analyse de données) et Word (pour l'édition et la personnalisation).
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Restriction des exports</h4>
            <p className="text-sm text-muted-foreground">
              Lorsque la restriction est activée, aucun autre rapport que ces trois rapports officiels 
              ne peut être exporté, garantissant ainsi la conformité aux standards DGDA.
            </p>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Onglet Éditer les rapports */}
        <TabsContent value="edit" className="space-y-6 mt-6">
          {/* Sélecteur de rapport en haut */}
          <Card>
            <CardHeader>
              <CardTitle>Sélectionner un rapport à éditer</CardTitle>
              <CardDescription>
                Choisissez le rapport dont vous souhaitez personnaliser la mise en forme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reports.map((report) => {
                  const isSelected = report.id === selectedReportId;
                  const reportTypeForEditor = getReportTypeForEditor(report.id);
                  
                  return (
                    <div
                      key={report.id}
                      onClick={() => handleSelectReport(report.id)}
                      className={`relative border-2 rounded-lg p-6 cursor-pointer transition-all hover:border-primary/50 ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-4 right-4">
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Sélectionné
                          </Badge>
                        </div>
                      )}
                      
                      <div className="flex flex-col items-center space-y-3">
                        <div className={`p-3 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <FileText className="w-8 h-8" />
                        </div>
                        
                        <div className="text-center space-y-2">
                          <h3 className="font-semibold text-lg">{report.name}</h3>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                          
                          <div className="flex items-center justify-center gap-2 pt-2">
                            <Badge variant="secondary" className="text-xs">
                              Rapport officiel
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              3 formats
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Zone d'édition - affichée uniquement si un rapport est sélectionné */}
          {reportType ? (
            <OfficialReportEditor
              reportType={reportType}
              reportName={selectedReportDetails?.name || ''}
            />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Aucun rapport sélectionné</AlertTitle>
              <AlertDescription>
                Veuillez sélectionner un rapport ci-dessus pour accéder à l'éditeur de configuration.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
