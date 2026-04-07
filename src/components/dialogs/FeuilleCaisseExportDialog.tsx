/**
 * Formulaire pré-export Feuille de Caisse
 * Permet de saisir : Date de la feuille, Mois, Année, Nom du comptable
 * avant de lancer l'export PDF / Word / impression
 */

import { useState } from 'react';
import { Calendar, FileText, FileDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MOIS_NOMS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export type ExportType = 'pdf' | 'word';

export interface FeuilleCaisseExportParams {
  dateFeuille: string;
  mois: number;
  annee: number;
  nomComptable: string;
  exportType: ExportType;
}

interface FeuilleCaisseExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (params: FeuilleCaisseExportParams) => void;
  defaultMois: number;
  defaultAnnee: number;
}

export function FeuilleCaisseExportDialog({
  open,
  onClose,
  onExport,
  defaultMois,
  defaultAnnee,
}: FeuilleCaisseExportDialogProps) {
  const today = new Date();
  const [dateFeuille, setDateFeuille] = useState(
    `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`
  );
  const [mois, setMois] = useState(defaultMois);
  const [annee, setAnnee] = useState(defaultAnnee);
  const [nomComptable, setNomComptable] = useState('');

  const handleExport = (exportType: ExportType) => {
    onExport({
      dateFeuille,
      mois,
      annee,
      nomComptable: nomComptable.trim() || '____________________',
      exportType,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Paramètres Feuille de Caisse
          </DialogTitle>
          <DialogDescription>
            Renseignez les informations avant l'export du rapport
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date de la feuille */}
          <div className="space-y-2">
            <Label htmlFor="dateFeuille">Date Feuille de Caisse</Label>
            <Input
              id="dateFeuille"
              value={dateFeuille}
              onChange={(e) => setDateFeuille(e.target.value)}
              placeholder="JJ/MM/AAAA"
            />
          </div>

          {/* Mois */}
          <div className="space-y-2">
            <Label>Mois</Label>
            <Select value={String(mois)} onValueChange={(v) => setMois(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOIS_NOMS.map((nom, idx) => (
                  <SelectItem key={idx + 1} value={String(idx + 1)}>
                    {nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Année */}
          <div className="space-y-2">
            <Label htmlFor="annee">Année</Label>
            <Input
              id="annee"
              type="number"
              value={annee}
              onChange={(e) => setAnnee(Number(e.target.value))}
              min={2020}
              max={2030}
            />
          </div>

          {/* Nom du comptable */}
          <div className="space-y-2">
            <Label htmlFor="nomComptable">Nom du Comptable</Label>
            <Input
              id="nomComptable"
              value={nomComptable}
              onChange={(e) => setNomComptable(e.target.value)}
              placeholder="Nom du comptable provincial"
            />
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => handleExport('word')} className="gap-2">
            <FileDown className="w-4 h-4" />
            Word
          </Button>
          <Button onClick={() => handleExport('pdf')} className="gap-2">
            <FileText className="w-4 h-4" />
            PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
