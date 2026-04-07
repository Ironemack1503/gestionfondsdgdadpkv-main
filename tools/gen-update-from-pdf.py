import csv
import subprocess
import os

csv_path = r"C:\Users\Congo\Desktop\clonne\gestionfondsdgdadpkv-main\tools\pdf_beo_imp.csv"
sql_path = r"C:\Users\Congo\Desktop\clonne\gestionfondsdgdadpkv-main\tools\update-imp-from-pdf.sql"

# Lire le CSV
rows = []
with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        nbeo = row['NBEO'].strip()
        imp = row['IMP'].strip()
        if nbeo and nbeo != '0' and imp and len(imp) == 6 and imp.isdigit():
            rows.append((nbeo, imp))

# Dédoublonner par NBEO (garder la première occurrence)
seen = {}
unique = []
for nbeo, imp in rows:
    if nbeo not in seen:
        seen[nbeo] = imp
        unique.append((nbeo, imp))

print(f"BEOs uniques à mettre à jour: {len(unique)}")

# Générer le SQL
sql_lines = []
sql_lines.append("-- Mise à jour imp_code depuis PDF Crystal Reports feuille_caisse_décembre_2025 (26)")
sql_lines.append("BEGIN;")
sql_lines.append("")
sql_lines.append("CREATE TEMP TABLE _pdf_imp (nbeo text, imp_code text);")
sql_lines.append("INSERT INTO _pdf_imp (nbeo, imp_code) VALUES")

value_lines = []
for nbeo, imp in unique:
    value_lines.append(f"  ('{nbeo}', '{imp}')")
sql_lines.append(",\n".join(value_lines) + ";")
sql_lines.append("")
sql_lines.append("UPDATE depenses d")
sql_lines.append("SET imp_code = p.imp_code")
sql_lines.append('FROM _pdf_imp p')
sql_lines.append('WHERE d."NBEO"::text = p.nbeo')
sql_lines.append("  AND d.imp_code IS DISTINCT FROM p.imp_code;")
sql_lines.append("")
sql_lines.append("-- Vérification")
sql_lines.append("SELECT COUNT(*) as updated FROM depenses WHERE imp_code IS NOT NULL;")
sql_lines.append("")

# Comparer les valeurs changées
sql_lines.append("-- Top 10 changements effectués (décembre 2025)")
sql_lines.append("SELECT d.\"NBEO\", d.imp_code as nouveau, d.motif")
sql_lines.append("FROM depenses d")
sql_lines.append("JOIN _pdf_imp p ON d.\"NBEO\"::text = p.nbeo")
sql_lines.append("WHERE d.date_transaction BETWEEN '2025-12-01' AND '2025-12-31'")
sql_lines.append("ORDER BY d.\"NBEO\"::int LIMIT 20;")
sql_lines.append("")
sql_lines.append("COMMIT;")

sql_content = "\n".join(sql_lines)
with open(sql_path, 'w', encoding='utf-8') as f:
    f.write(sql_content)

print(f"SQL généré: {sql_path}")
print("Premières lignes:")
for nbeo, imp in unique[:10]:
    print(f"  NBEO={nbeo} → {imp}")
