# Sprint 0.2 Report — Art & UI Direction

## Zakres

Sprint utworzył kierunek wizualny i audyt istniejącego UI. Nie zmieniono komponentów Vue, gameplayu, systemów ani assetów produkcyjnych.

## Ocena gotowości UI

### Funkcjonalność: 7/10

Istnieją główne okna, panel manager, keybindy, responsywne układy, focus-visible, modalne potwierdzenia i prezentacja większości działających systemów.

### Spójność wizualna: 4/10

Interfejs używa czytelnego, lecz ogólnego języka granatowych paneli. Brakuje tokenów, materialnych metafor okien, docelowej typografii oraz wspólnego zestawu przycisków i ikon.

### Gotowość UI do produkcji assetów: 6/10

Role ekranów i hierarchia są wystarczająco czytelne, aby projektować ich oprawę. Przed wdrożeniem dużej liczby assetów należy zatwierdzić bazową skalę, tokeny i jeden wzorcowy ekran.

## Ocena gotowości grafiki

### Mapa i terrain: 5/10

Istnieją pierwsze spójne atlasy Grasslands, Flower Fields, Meadows i Tall Grass oraz warstwowy renderer. Pozostałe tereny, przejścia, drogi, obiekty i POI w dużej części wymagają finalnych assetów.

### Postacie i potwory: 2/10

Kierunek oraz referencje skali istnieją, ale w repozytorium nie ma jeszcze kompletnej produkcyjnej biblioteki postaci, animacji eksploracji i przeciwników.

### Ikony i oprawa UI: 2/10

Emoji, znaki tekstowe i CSS-owe placeholdery nadal pełnią wiele ról. Brakuje zatwierdzonej siatki, rodziny ikon, ramek oraz materialnych powierzchni UI.

### Ogólna gotowość grafiki: 3/10

Kierunek jest już możliwy do komunikowania, ale pipeline wymaga próbnego zestawu i technicznej specyfikacji eksportu przed produkcją masową.

## Proponowana kolejność produkcji assetów

1. **Specyfikacja techniczna** — skala bazowa, siatki, perspektywa, formaty, naming, marginesy i zasady eksportu.
2. **UI Foundation Pack** — powierzchnie ciemne/pergaminowe, obramowania, separatory, focus, scrollbar i kursor.
3. **Button State Pack** — default, hover, focus, pressed, selected, disabled, warning i danger.
4. **Core Icon Pack** — zamknięcie, nawigacja, ekwipunek, postać, umiejętności, quest, mapa, handel i podstawowe statusy.
5. **HUD Pack** — ramy zdrowia, czasu, zagrożenia, światła, zasobów i tracker celu.
6. **Window Skins** — księga, pergamin/dialog, skrzynia/inventory, stół merchant, notatnik quest i mapa.
7. **Meadows Terrain Completion** — brakujące warianty, przejścia, drogi, brzegi, woda i czytelność stanów ruchu.
8. **Meadows Props & Architecture** — wieś, płoty, znaki, obozy, ruiny, POI i obiekty środowiskowe.
9. **Player Exploration Set** — bazowa postać oraz `Idle` i `Walk` w wymaganych kierunkach.
10. **NPC Exploration Set** — najpierw postacie potrzebne w pierwszych 15 minutach.
11. **Monster Set** — przeciwnicy używani przez pierwszy encounter i oddzielny ekran walki.
12. **Effects & Atmosphere** — ogień, światło, dym, woda, pogoda i subtelne animacje natury.
13. **Polish Pass** — warianty, uszkodzenia, rzadkość, dostępność, reduced motion i optymalizacja atlasów.

## Bramy jakości

Przed przejściem do kolejnego dużego pakietu należy zweryfikować:

- czytelność w docelowej skali;
- zgodność z paletą i oświetleniem;
- zachowanie na tle mapy oraz UI;
- spójność nazw i eksportów;
- kontrast i dostępność;
- koszt pamięci, rozmiar atlasu i wydajność renderowania;
- brak kopiowania charakterystycznych elementów innych gier.
