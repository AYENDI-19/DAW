import os

# Correcciones: UTF-8 mal decodificado como Latin-1 -> correcto
CORRECCIONES = [
    # Vocales con tilde
    ('\u00c3\u00a1', '\u00e1'),  # Ã¡ -> á
    ('\u00c3\u00a9', '\u00e9'),  # Ã© -> é
    ('\u00c3\u00ad', '\u00ed'),  # Ã­ -> í
    ('\u00c3\u00b3', '\u00f3'),  # Ã³ -> ó
    ('\u00c3\u00ba', '\u00fa'),  # Ãº -> ú
    ('\u00c3\u0081', '\u00c1'),  # Ã\x81 -> Á
    ('\u00c3\u0089', '\u00c9'),  # Ã\x89 -> É
    ('\u00c3\u008d', '\u00cd'),  # Ã\x8d -> Í
    ('\u00c3\u0093', '\u00d3'),  # Ã\x93 -> Ó
    ('\u00c3\u009a', '\u00da'),  # Ã\x9a -> Ú
    # Ñ y ñ
    ('\u00c3\u00b1', '\u00f1'),  # Ã± -> ñ
    ('\u00c3\u0091', '\u00d1'),  # Ã\x91 -> Ñ
    # ¡ y ¿
    ('\u00c2\u00a1', '\u00a1'),  # Â¡ -> ¡
    ('\u00c2\u00bf', '\u00bf'),  # Â¿ -> ¿
    # Emojis corruptos comunes
    ('\u00f0\u009f\u0094\u00a5', '\U0001f525'),  # ðŸ"¥ -> 🔥
    ('\u00f0\u009f\u008c\u0085', '\U0001f305'),  # ðŸŒ… -> 🌅
    ('\u00f0\u009f\u008f\u008b', '\U0001f3cb'),  # ðŸ‹ -> 🏋
    ('\u00f0\u009f\u0095\u00ba', '\U0001f57a'),  # ðŸ•º -> 🕺
    ('\u00f0\u009f\u0094\u0088', '\U0001f4c8'),  # ðŸ"ˆ -> 📈
    # Guiones y puntos especiales
    ('\u00e2\u0080\u00a2', '\u2022'),  # â€¢ -> •
    ('\u00e2\u0086\u0091', '\u2191'),  # â†' -> ↑
]

def corregir_archivo(path):
    try:
        with open(path, 'r', encoding='utf-8', errors='replace') as f:
            contenido = f.read()
        
        original = contenido
        for malo, bueno in CORRECCIONES:
            contenido = contenido.replace(malo, bueno)
        
        if contenido != original:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(contenido)
            print(f"CORREGIDO: {os.path.basename(path)}")
        else:
            print(f"OK: {os.path.basename(path)}")
    except Exception as e:
        print(f"ERROR en {path}: {e}")

frontend_src = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend', 'src')
)

for root, dirs, files in os.walk(frontend_src):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.js'):
            corregir_archivo(os.path.join(root, file))

print("\nCorreccion completada.")
