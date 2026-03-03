import { NavLink } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  FileSpreadsheet, 
  Calendar,
  Download,
  Eye,
  ArrowRight,
  Edit3,
  FileCheck
} from "lucide-react";

export default function RapportsPage() {
  const reportTypes = [
    {
      title: "Feuille de Caisse",
      description: "Vue détaillée des opérations de caisse avec solde progressif",
      icon: FileSpreadsheet,
      path: "/rapports/feuille-caisse",
      color: "primary"
    },
    {
      title: "Sommaire Mensuel",
      description: "Synthèse des recettes et dépenses par rubrique",
      icon: FileText,
      path: "/rapports/sommaire",
      color: "blue"
    },
    {
      title: "Programmation",
      description: "État de la programmation mensuelle des dépenses",
      icon: Calendar,
      path: "/rapports/programmation",
      color: "warning"
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapports"
        description="Accédez aux rapports officiels DGDA : Feuille de Caisse, Sommaire et Programmation"
      />

      {/* Lien vers la gestion des rapports par défaut */}
      <NavLink to="/rapports/par-defaut">
        <Card className="p-6 border-l-4 border-l-blue-500 hover:shadow-lg transition-all bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/30 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                <FileCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Configuration des Rapports Par Défaut</h3>
                <p className="text-sm text-muted-foreground">
                  Gérez les trois rapports officiels DGDA et leur configuration d'export
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-blue-600" />
          </div>
        </Card>
      </NavLink>

      {/* Lien vers l'éditeur avancé */}
      <NavLink to="/rapports/editeur-avance">
        <Card className="p-6 border-l-4 border-l-primary hover:shadow-lg transition-all bg-gradient-to-r from-primary/5 to-transparent dark:from-primary/10 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Edit3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Éditeur de Rapports Avancé</h3>
                <p className="text-sm text-muted-foreground">
                  Personnalisez les en-têtes, pieds de page et exportez en PDF, Excel ou Word
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-primary" />
          </div>
        </Card>
      </NavLink>

      {/* Lien vers les exemples PDF */}
      <NavLink to="/rapports/exemples-pdf">
        <Card className="p-6 border-l-4 border-l-emerald-500 hover:shadow-lg transition-all bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Exemples de Rapports PDF</h3>
                <p className="text-sm text-muted-foreground">
                  Visualisez le rendu des rapports avec des données fictives de démonstration
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-emerald-600" />
          </div>
        </Card>
      </NavLink>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportTypes.map((report) => (
          <NavLink key={report.title} to={report.path}>
            <Card className="p-6 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer h-full">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <report.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-lg">{report.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
                  <Button size="sm" variant="default" className="gap-2">
                    <Eye className="w-4 h-4" />
                    Ouvrir
                  </Button>
                </div>
              </div>
            </Card>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
