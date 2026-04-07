import pdfplumber

with pdfplumber.open(r"C:\Users\Congo\Downloads\feuille_caisse_décembre_2025 (26).pdf") as pdf:
    page = pdf.pages[0]
    words = page.extract_words()
    print("=== PAGE 1 - premiers mots ===")
    for w in words[:80]:
        print("  x0={:6.1f}  x1={:6.1f}  top={:5.1f}  text={}".format(
            w['x0'], w['x1'], w['top'], w['text']))
    print("\n=== Mots contenant BEO ou IMP ===")
    for w in words:
        if 'BEO' in w['text'] or w['text'] == 'IMP' or w['text'] == 'DEPENSE' or w['text'] == 'RECETTE':
            print("  x0={:6.1f}  x1={:6.1f}  top={:5.1f}  text={}".format(
                w['x0'], w['x1'], w['top'], w['text']))
