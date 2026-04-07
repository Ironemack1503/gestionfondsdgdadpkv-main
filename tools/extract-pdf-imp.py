import pdfplumber
import re
import csv

pdf_path = r"C:\Users\Congo\Downloads\feuille_caisse_décembre_2025 (26).pdf"
output_csv = r"C:\Users\Congo\Desktop\clonne\gestionfondsdgdadpkv-main\tools\pdf_beo_imp.csv"

# Colonnes tableau: date | N°ORD | N°BEO | LIBELLE | recette | dépense | IMP
# col[2] = N°BEO, col[-1] = IMP

rows = []
with pdfplumber.open(pdf_path) as pdf:
    for page_num, page in enumerate(pdf.pages):
        tables = page.extract_tables()
        if tables:
            for table in tables:
                for row in table:
                    if not row or len(row) < 5:
                        continue
                    cells = [str(c).strip().replace('\n', ' ') if c else '' for c in row]
                    # IMP = dernière cellule non vide avec 6 chiffres
                    imp_val = ''
                    for cell in reversed(cells):
                        if re.match(r'^\d{6}$', cell):
                            imp_val = cell
                            break
                    if not imp_val:
                        continue
                    # N°BEO = cells[2] (3ème colonne)
                    nbeo_val = cells[2] if len(cells) > 2 else ''
                    if not re.match(r'^\d+$', nbeo_val):
                        continue
                    rows.append({
                        'NBEO': nbeo_val,
                        'IMP': imp_val,
                        'date': cells[0],
                        'ord': cells[1],
                        'libelle': cells[3] if len(cells) > 3 else ''
                    })

print(f"Trouvé {len(rows)} lignes avec BEO→IMP")

# Dédoublonner par NBEO (garder premier)
seen = {}
unique_rows = []
for r in rows:
    key = r['NBEO']
    if key not in seen and key != '0':
        seen[key] = True
        unique_rows.append(r)

print(f"BEOs uniques (hors 0): {len(unique_rows)}")

with open(output_csv, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['NBEO','IMP','date','ord','libelle'])
    writer.writeheader()
    writer.writerows(rows)

# Afficher les 30 premières (avec doublons pour debug)
for r in rows[:30]:
    print(f"BEO={r['NBEO']:>5} → IMP={r['IMP']}  |  {r['libelle'][:60]}")
