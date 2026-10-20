# Joc X și 0 (Tic-Tac-Toe)

O aplicație web modernă și receptivă pentru jocul clasic **X și 0** (Tic-Tac-Toe), scrisă în HTML5, CSS3 și JavaScript pur (fără dependențe externe).

## ✨ Caracteristici

- 🎮 **Moduri multiple de joc**:
  - **2 Jucători (Local)**: Joacă în doi pe același dispozitiv.
  - **vs AI (Ușor)**: Mișcări preponderent aleatorii.
  - **vs AI (Mediu)**: O combinație între mișcări tactice și aleatorii.
  - **vs AI (Imbatabil)**: Folosește algoritmul Minimax — AI-ul nu pierde niciodată.
- 🎨 **Design Modern & Responsive**:
  - Teme vizuale dark mode cu accente neon (Cyan pentru X, Magenta pentru 0).
  - Efecte de luminozitate (glow), animații la plasarea simbolurilor și evidențierea liniei câștigătoare.
  - Efect de artificii / confetti la victorie.
- 🔊 **Efecte Audio Sintetizate**:
  - Sunete generate dinamic prin Web Audio API (fără descărcare de fișiere audio externe).
  - Buton pentru activare / dezactivare sunet.
- 📊 **Tabelă de scor persistentă**:
  - Scorurile pentru X, 0 și Remize sunt memorate în `localStorage`.
  - Buton pentru resetarea scorului și runda nouă.

## 🚀 Rulare Server Local

Dacă serverul nu este deja pornit, poți rula în acest folder:

```bash
python3 -m http.server 8080
```

Apoi deschide în browser:
[http://localhost:8080](http://localhost:8080)
