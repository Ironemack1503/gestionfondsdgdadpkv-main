"""
Extraction NBEO->IMP par coordonnées X précises depuis Crystal Reports PDF.
Positions calibrées depuis debug: N°BEO x0~101, IMP x0~556
"""
import pdfplumber
import re
import csv
from collections import defaultdict

pdf_path = r"C:\Users\Congo\Downloads\feuille_caisse_décembre_2025 (26).pdf"
output_csv = r"C:\Users\Congo\Desktop\clonne\gestionfondsdgdadpkv-main\tools\pdf_beo_imp.csv"

# Positions X calibrées depuis la page 1
X_ORD   = 71    # N°ORD  (x0 ~ 71)
X_BEO   = 103   # N°BEO  (x0 ~ 103)
X_IMP   = 549   # IMP    (x0 ~ 549)
TOL     = 20    # tolérance en pixels

def is_6digit(s):
    return bool(re.match(r'^\d{6}$', s.strip()))

def group_by_line(words, y_tol=3):
    lines = defaultdict(list)
    for w in words:
        y = round(w['top'] / y_tol) * y_tol
        lines[y].append(w)
    return lines

all_rows = []

with pdfplumber.open(pdf_path) as pdf:
    for page_num, page in enumerate(pdf.pages):
        words = page.extract_words(keep_blank_chars=False, x_tolerance=3, y_tolerance=3)
        if not words:
            continue

        lines = group_by_line(words)

        for y_key in sorted(lines.keys()):
            line_words = sorted(lines[y_key], key=lambda w: w['x0'])

            # --- Extraire IMP : mot 6-chiffres dans zone IMP ---
            imp_val = ''
            for w in line_words:
                if is_6digit(w['text']) and abs(w['x0'] - X_IMP) < TOL + 10:
                    imp_val = w['text'].strip()
                    break

            if not imp_val:
                continue

            # --- Extraire N°BEO : mot numérique dans zone BEO ---
            nbeo_val = ''
            for w in line_words:
                txt = w['text'].strip()
                # Zone BEO : x0 entre 80 et 135
                if 80 <= w['x0'] <= 135:
                    # Accepter: chiffres purs OU chiffres + suffixe lettre (7165A, 7165/B)
                    if re.match(r'^\d+[A-Z/]?[A-Z]?$', txt) and any(c.isdigit() for c in txt):
                        # Exclure les codes IMP 6 chiffres qui pourraient se retrouver là
                        if not is_6digit(txt):
                            nbeo_val = txt
                            break
                        # Les codes 6-chiffres valides comme 000000 ne sont PAS des BEO
                        # Mais si len < 6, c'est un BEO (ex: 7165 = 4 chiffres)
                        if len(txt) <= 5:
                            nbeo_val = txt
                            break

            # Gérer aussi les suffixes séparés ex: "7165" + "B" sur 2 tokens adjacents
            if not nbeo_val:
                # Chercher un token BEO dans la zone élargie
                for w in line_words:
                    txt = w['text'].strip()
                    if 75 <= w['x0'] <= 145 and re.match(r'^\d{3,6}$', txt):
                        nbeo_val = txt
                        break

            # Gestion du cas "7165 B" = deux tokens "7165" et "B" dans la zone BEO
            if nbeo_val:
                # Chercher un token lettre juste après dans la même zone
                next_tokens = [w['text'].strip() for w in line_words
                               if w['x0'] > 80 + len(nbeo_val)*5
                               and w['x0'] <= 155
                               and re.match(r'^[A-Z/]+$', w['text'].strip())]
                if next_tokens:
                    nbeo_val = nbeo_val + next_tokens[0]

            if nbeo_val and nbeo_val not in ('0',):
                libelle_words = [w['text'] for w in line_words
                                 if 138 <= w['x0'] <= 470]
                all_rows.append({
                    'NBEO': nbeo_val,
                    'IMP': imp_val,
                    'page': page_num + 1,
                    'libelle': ' '.join(libelle_words)[:80]
                })

print("Total brut: {} lignes".format(len(all_rows)))

# Dédoublonner par NBEO (garder première occurrence)
seen = {}
unique = []
for r in all_rows:
    k = r['NBEO']
    if k not in seen:
        seen[k] = r
        unique.append(r)

print("NBEOs uniques: {}".format(len(unique)))

with open(output_csv, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['NBEO','IMP','page','libelle'])
    writer.writeheader()
    writer.writerows(unique)

print("\nAperçu des 30 premières:")
for r in unique[:30]:
    print("  NBEO={:>8}  IMP={}  {}".format(r['NBEO'], r['IMP'], r['libelle'][:55]))

# Vérification des entrées critiques vues en rouge dans les captures
check = {
    '1955': '604710', '1965': '659800', '1202': '659800', '1981': '659800',
    '1219': '604720', '1217': '624000', '1249': '000000', '1250': '000000',
    '1251': '000000', '1252': '000000', '1253': '000000', '1256': '000000',
    '1257': '000000', '1259': '000000', '1263': '659800', '1274': '624000',
    '1277': '604000', '1286': '604720', '1290': '659800', '1291': '659800',
    '1322': '659800', '1328': '659800', '40001': '000000', '40004': '604300',
    '40032': '659800', '7174': '659800', '7191': '659800', '7192': '604210',
}
print("\nVérification NBEOs critiques:")
ok, ko, manq = 0, 0, 0
for nbeo, expected in sorted(check.items()):
    got = seen.get(nbeo, {}).get('IMP', 'MANQUANT')
    if got == 'MANQUANT':
        manq += 1
        print("  ? NBEO={:>6} MANQUANT  (attendu={})".format(nbeo, expected))
    elif got == expected:
        ok += 1
    else:
        ko += 1
        print("  x NBEO={:>6} got={}  (attendu={})".format(nbeo, got, expected))
print("\nCorrects: {}/{}, Faux: {}, Manquants: {}".format(ok, len(check), ko, manq))

import pdfplumber
import re
import csv
from collections import defaultdict

pdf_path = r"C:\Users\Congo\Downloads\feuille_caisse_décembre_2025 (26).pdf"
output_csv = r"C:\Users\Congo\Desktop\clonne\gestionfondsdgdadpkv-main\tools\pdf_beo_imp.csv"

def is_6digit(s):
    return bool(re.match(r'^\d{6}$', s.strip()))

# Regrouper les mots par ligne (même y0 approximatif)
def group_by_line(words, y_tol=3):
    lines = defaultdict(list)
    for w in words:
        y = round(w['top'] / y_tol) * y_tol
        lines[y].append(w)
    return lines

# Détecter la position X des colonnes N°BEO et IMP via les en-têtes
def detect_column_x(page):
    words = page.extract_words()
    x_nbeo, x_imp = None, None
    for w in words:
        if 'BEO' in w['text']:
            x_nbeo = w['x0']
        if w['text'] == 'IMP':
            x_imp = w['x0']
    return x_nbeo, x_imp

all_rows = []
x_nbeo_global = None
x_imp_global = None

with pdfplumber.open(pdf_path) as pdf:
    for page_num, page in enumerate(pdf.pages):
        words = page.extract_words(keep_blank_chars=False, x_tolerance=3, y_tolerance=3)
        if not words:
            continue

        # Recalibrer les colonnes si l'en-tête est sur cette page
        x_nbeo, x_imp = detect_column_x(page)
        if x_nbeo is not None:
            x_nbeo_global = x_nbeo
        if x_imp is not None:
            x_imp_global = x_imp

        if x_nbeo_global is None or x_imp_global is None:
            continue

        lines = group_by_line(words)

        for y_key in sorted(lines.keys()):
            line_words = sorted(lines[y_key], key=lambda w: w['x0'])

            # IMP = dernier mot 6-chiffres dans la zone droite de la ligne
            imp_val = ''
            for w in reversed(line_words):
                txt = w['text'].strip()
                if is_6digit(txt) and w['x0'] >= x_imp_global - 30:
                    imp_val = txt
                    break

            if not imp_val:
                continue

            # N°BEO = mot numérique (avec éventuel suffixe A/B) dans la zone NBEO
            # Chercher les tokens dans la plage x_nbeo ± 35px
            nbeo_val = ''
            for w in line_words:
                txt = w['text'].strip()
                if (abs(w['x0'] - x_nbeo_global) < 35 and
                        re.match(r'^\d+[A-Z/]?$', txt) and
                        any(c.isdigit() for c in txt) and
                        txt != imp_val):
                    nbeo_val = txt
                    break

            if nbeo_val and nbeo_val != '0':
                libelle_words = [w['text'] for w in line_words
                                 if w['x0'] > x_nbeo_global + 35
                                 and w['x0'] < x_imp_global - 10]
                all_rows.append({
                    'NBEO': nbeo_val,
                    'IMP': imp_val,
                    'page': page_num + 1,
                    'libelle': ' '.join(libelle_words)[:80]
                })

print(f"Total brut: {len(all_rows)} lignes")

# Dédoublonner par NBEO (garder première occurrence)
seen = {}
unique = []
for r in all_rows:
    k = r['NBEO']
    if k not in seen:
        seen[k] = r
        unique.append(r)

print(f"NBEOs uniques: {len(unique)}")

with open(output_csv, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['NBEO','IMP','page','libelle'])
    writer.writeheader()
    writer.writerows(unique)

print("\nAperçu des 30 premières:")
for r in unique[:30]:
    print(f"  NBEO={r['NBEO']:>8}  IMP={r['IMP']}  {r['libelle'][:55]}")

# Vérification des entrées critiques vues en rouge dans les captures
check = {
    '1955': '604710', '1965': '659800', '1202': '659800', '1981': '659800',
    '1219': '604720', '1217': '624000', '1249': '000000', '1250': '000000',
    '1251': '000000', '1252': '000000', '1253': '000000', '1256': '000000',
    '1257': '000000', '1259': '000000', '1263': '659800', '1274': '624000',
    '1277': '604000', '1286': '604720', '1290': '659800', '1291': '659800',
    '1322': '659800', '1328': '659800', '40001': '000000', '40004': '604300',
    '40032': '659800', '7174': '659800', '7191': '659800', '7192': '604210',
}
print("\nVérification NBEOs critiques (attendus vs extraits):")
ok, ko, manq = 0, 0, 0
for nbeo, expected in sorted(check.items()):
    got = seen.get(nbeo, {}).get('IMP', 'MANQUANT')
    if got == 'MANQUANT':
        manq += 1
        print(f"  ✗ NBEO={nbeo:>6} MANQUANT  (attendu={expected})")
    elif got == expected:
        ok += 1
    else:
        ko += 1
        print(f"  ✗ NBEO={nbeo:>6} got={got}  (attendu={expected})")
print(f"\nCorrects: {ok}/{len(check)}, Faux: {ko}, Manquants: {manq}")
