import { useState } from "react";
import { Plus, Search, Edit, Trash2, FolderOpen, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRubriques, Rubrique } from "@/hooks/useRubriques";
import { useLocalUserRole } from "@/hooks/useLocalUserRole";
import { useToast } from "@/hooks/use-toast";
import { useSoldeMoisAnterieurs } from "@/hooks/useSoldeMoisAnterieurs";
import { sortRubriquesWithSoldeFirst } from "@/lib/rubriquesSortUtils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useRubriquesStats } from "@/hooks/useRubriquesStats";

const MOIS_LABELS = [
  { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },    { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },     { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },{ value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },{ value: 12, label: 'Décembre' },
];

const formatMontant = (val: number): string =>
  val > 0 ? val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';

// Fonction pour générer un UUID simple
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const categories = ["Recette", "Dépense"];

export default function RubriquesPage() {
  const { rubriques, isLoading, createRubrique, updateRubrique, deleteRubrique } = useRubriques();
  const { isAdmin } = useLocalUserRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Période sélectionnée pour les montants
  const currentDate = new Date();
  const [selectedMois, setSelectedMois] = useState(currentDate.getMonth() + 1);
  const [selectedAnnee, setSelectedAnnee] = useState(currentDate.getFullYear());

  // Hook pour gérer automatiquement la rubrique "Solde du mois (antérieur)"
  const { soldeMoisRubrique } = useSoldeMoisAnterieurs();

  // Montants par code IMP depuis resultats
  const { data: statsData = [] } = useRubriquesStats(selectedMois, selectedAnnee);
  const statsMap = new Map(statsData.map(s => [s.imp, s]));

  const getRecettes = (imp: string | null) => imp ? (statsMap.get(imp)?.totalRecettes ?? 0) : 0;
  const getDepenses = (imp: string | null) => imp ? (statsMap.get(imp)?.totalDepenses ?? 0) : 0;

  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRubrique, setEditingRubrique] = useState<Rubrique | null>(null);
  const [deletedRubriques, setDeletedRubriques] = useState<Rubrique[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "columns">("list");
  const [sortBy, setSortBy] = useState<"imp" | "libelle">("imp");
  const [formData, setFormData] = useState({
    libelle: "",
    categorie: "Recette",
    imp: "",
  });

  // Fonction de tri
  const sortRubriques = (items: Rubrique[]) => {
    return [...items].sort((a, b) => {
      if (sortBy === "imp") {
        const impA = a.imp || "";
        const impB = b.imp || "";
        return impA.localeCompare(impB);
      } else {
        return a.libelle.localeCompare(b.libelle);
      }
    });
  };

  const filteredRubriques = sortRubriques(
    sortRubriquesWithSoldeFirst(
      (rubriques || []).filter(
        (r) =>
          r.libelle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.categorie || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.imp || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  );

  // Séparer par catégorie
  const recettes = filteredRubriques.filter(r => r.categorie === "Recette");
  const depenses = filteredRubriques.filter(r => r.categorie === "Dépense");

  const resetForm = () => {
    setFormData({ libelle: "", categorie: "Recette", imp: "" });
    setEditingRubrique(null);
  };

  const openEditDialog = (rubrique: Rubrique) => {
    setEditingRubrique(rubrique);
    setFormData({
      libelle: rubrique.libelle,
      categorie: rubrique.categorie || "",
      imp: rubrique.imp || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation du code IMP : doit contenir exactement 6 chiffres
    if (!formData.imp || !/^\d{6}$/.test(formData.imp)) {
      toast({
        title: "Erreur de validation",
        description: "Le code IMP doit contenir exactement 6 chiffres",
        variant: "destructive",
      });
      return;
    }

    // Vérification de l'unicité de la désignation pour ce code IMP
    const existingWithSameCodeAndLibelle = rubriques?.find(
      (r) => 
        r.imp === formData.imp && 
        r.libelle.toLowerCase() === formData.libelle.toLowerCase() &&
        r.id !== editingRubrique?.id
    );

    if (existingWithSameCodeAndLibelle) {
      toast({
        title: "Erreur de validation",
        description: "Une rubrique avec ce code IMP et cette désignation existe déjà",
        variant: "destructive",
      });
      return;
    }

    // Utiliser le code existant ou générer un code unique basé sur UUID
    const submissionData = {
      ...formData,
      code: editingRubrique?.code || `RUB-${generateUUID()}`,
    };
    
    if (editingRubrique) {
      await updateRubrique.mutateAsync({
        id: editingRubrique.id,
        code: editingRubrique.code,
        libelle: submissionData.libelle,
        categorie: submissionData.categorie || undefined,
        imp: submissionData.imp || undefined,
      });
    } else {
      await createRubrique.mutateAsync({
        code: submissionData.code,
        libelle: submissionData.libelle,
        categorie: submissionData.categorie || undefined,
        imp: submissionData.imp || undefined,
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette rubrique ?")) {
      await deleteRubrique.mutateAsync(id);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer toutes les rubriques ?")) {
      return;
    }

    const { data, error } = await supabase
      .from('rubriques')
      .delete()
      .select('*');

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      return;
    }

    const removed = (data || []) as Rubrique[];
    setDeletedRubriques(removed);
    queryClient.invalidateQueries({ queryKey: ['rubriques'] });
    toast({ title: 'Succès', description: `${removed.length} rubriques supprimées` });
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsDialogOpen(open);
  };

  const columns = [
    {
      key: "imp",
      header: "IMP",
      render: (item: Rubrique) => (
        <span className="inline-flex px-2 py-1 rounded-md text-xs font-mono font-medium bg-primary/10 text-primary">
          {item.imp || "-"}
        </span>
      ),
    },
    {
      key: "libelle",
      header: "Désignation",
      render: (item: Rubrique) => {
        const isSolde = item.libelle.toLowerCase().includes('solde');
        return (
          <div className="flex items-center gap-2">
            <FolderOpen className={`w-4 h-4 ${isSolde ? 'text-yellow-500' : item.categorie === 'Recette' ? 'text-green-600' : 'text-red-500'}`} />
            <span className={`font-medium ${isSolde ? 'text-yellow-600 font-semibold' : ''}`}>
              {item.libelle}
            </span>
          </div>
        );
      },
    },
    {
      key: "recettes",
      header: "Recettes",
      render: (item: Rubrique) => {
        const val = item.categorie === 'Recette' ? getRecettes(item.imp) : 0;
        return (
          <span className={`text-right block font-mono text-sm ${val > 0 ? 'text-green-700 font-semibold' : 'text-muted-foreground'}`}>
            {formatMontant(val)}
          </span>
        );
      },
    },
    {
      key: "depenses",
      header: "Dépenses",
      render: (item: Rubrique) => {
        const val = item.categorie === 'Dépense' ? getDepenses(item.imp) : 0;
        return (
          <span className={`text-right block font-mono text-sm ${val > 0 ? 'text-red-700 font-semibold' : 'text-muted-foreground'}`}>
            {formatMontant(val)}
          </span>
        );
      },
    },
    ...(isAdmin ? [{
      key: "actions",
      header: "Actions",
      render: (item: Rubrique) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => openEditDialog(item)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive"
            onClick={() => handleDelete(item.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rubriques des Recettes et Dépenses"
        description="Gérez les rubriques avec code IMP et désignations pour les recettes et dépenses"
        actions={
          isAdmin ? (
            <div className="flex items-center gap-2">
              <Button variant="destructive" onClick={handleDeleteAll}>
                Supprimer toutes
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle rubrique
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingRubrique ? "Modifier la rubrique" : "Créer une rubrique"}</DialogTitle>
                  <DialogDescription>
                    {editingRubrique ? "Modifiez les informations de la rubrique" : "Définissez une nouvelle catégorie de dépenses"}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  {/* 1. Code IMP - 6 chiffres */}
                  <div className="space-y-2">
                    <Label htmlFor="imp">Code IMP (6 chiffres) *</Label>
                    <Input
                      id="imp"
                      placeholder="Ex: 123456"
                      value={formData.imp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setFormData({ ...formData, imp: value });
                      }}
                      maxLength={6}
                      pattern="\d{6}"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Le code IMP doit contenir exactement 6 chiffres. Il peut être utilisé plusieurs fois avec des désignations différentes.
                    </p>
                  </div>

                  {/* 2. Désignations */}
                  <div className="space-y-2">
                    <Label htmlFor="libelle">Désignations *</Label>
                    <Input
                      id="libelle"
                      placeholder="Ex: Fournitures informatiques"
                      value={formData.libelle}
                      onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                      required
                    />
                  </div>

                  {/* 3. Types */}
                  <div className="space-y-2">
                    <Label>Types *</Label>
                    <Select
                      value={formData.categorie}
                      onValueChange={(value) => setFormData({ ...formData, categorie: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" disabled={createRubrique.isPending || updateRubrique.isPending}>
                      {(createRubrique.isPending || updateRubrique.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingRubrique ? "Mettre à jour" : "Créer la rubrique"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
              </Dialog>
            </div>
          ) : undefined
        }
      />

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par désignation ou IMP..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Sélecteur de période pour les montants */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Période:</label>
          <select
            value={selectedMois}
            onChange={(e) => setSelectedMois(Number(e.target.value))}
            className="border rounded-md px-3 py-2 text-sm bg-background"
            aria-label="Sélectionner le mois"
          >
            {MOIS_LABELS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={selectedAnnee}
            onChange={(e) => setSelectedAnnee(Number(e.target.value))}
            className="border rounded-md px-3 py-2 text-sm bg-background"
            aria-label="Sélectionner l'année"
          >
            {[2022, 2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Affichage:</label>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as "list" | "columns")}
            className="border rounded-md px-3 py-2 text-sm bg-background"
            aria-label="Sélectionner le mode d'affichage"
          >
            <option value="list">Liste complète</option>
            <option value="columns">Deux colonnes</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Trier par:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "imp" | "libelle")}
            className="border rounded-md px-3 py-2 text-sm bg-background"
            aria-label="Sélectionner le critère de tri"
          >
            <option value="imp">Code IMP</option>
            <option value="libelle">Désignation</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-6 p-4 bg-accent rounded-lg">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-primary" />
          <span className="font-semibold">{(rubriques ?? []).length}</span>
          <span className="text-muted-foreground">rubriques au total</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Total Recettes :</span>
          <span className="font-semibold text-green-700 font-mono text-sm">
            {formatMontant(statsData.reduce((s, r) => s + r.totalRecettes, 0))}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Total Dépenses :</span>
          <span className="font-semibold text-red-700 font-mono text-sm">
            {formatMontant(statsData.reduce((s, r) => s + r.totalDepenses, 0))}
          </span>
        </div>
        {!isAdmin && (
          <div className="ml-auto text-sm text-muted-foreground italic">
            📌 Seuls les administrateurs peuvent créer ou modifier des rubriques
          </div>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : viewMode === "list" ? (
        <DataTable columns={columns} data={filteredRubriques} emptyMessage="Aucune rubrique créée" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h3 className="text-base lg:text-lg font-semibold text-green-800 flex items-center justify-between">
                <span>RECETTES</span>
                <span className="text-sm font-normal">({recettes.length})</span>
              </h3>
            </div>
            <DataTable
              columns={columns}
              data={recettes}
              emptyMessage="Aucune rubrique de recette"
            />
          </div>

          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h3 className="text-base lg:text-lg font-semibold text-red-800 flex items-center justify-between">
                <span>DÉPENSES</span>
                <span className="text-sm font-normal">({depenses.length})</span>
              </h3>
            </div>
            <DataTable
              columns={columns}
              data={depenses}
              emptyMessage="Aucune rubrique de dépense"
            />
          </div>
        </div>
      )}

      {deletedRubriques.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Rubriques supprimées</h3>
          <DataTable columns={columns.filter(c => c.key !== 'actions')} data={deletedRubriques} />
        </div>
      )}
    </div>
  );
}