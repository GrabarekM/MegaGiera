# Animation Guide

Animacja MegaGiery jest spokojna, krótka i naturalna. Ma potwierdzać działanie, kierować uwagę albo nadawać życie światu. Nie służy do ciągłego demonstrowania efektów.

## Zasady

- Najpierw czytelna klatka statyczna, potem ruch.
- Jedna animacja przekazuje jedną zmianę.
- UI reaguje szybko; świat może poruszać się wolniej.
- Ruch kończy się stabilnym stanem, bez zbędnego odbijania.
- Kilka elementów nie konkuruje jednocześnie o uwagę.

## UI

- Hover/focus: 80–160 ms.
- Otwarcie małego okna: około 140–220 ms.
- Duże przejście widoku: maksymalnie około 300 ms, jeśli nie maskuje ładowania.
- Komunikat może łagodnie pojawić się i zniknąć, lecz musi pozostać wystarczająco długo do odczytu.

## World

- Trawa, liście, dym i woda poruszają się niesynchronicznie i z małą amplitudą.
- Pogoda narasta oraz ustępuje stopniowo.
- `Idle` nie może wyglądać jak nerwowe podskakiwanie.
- `Walk` komunikuje kierunek i tempo ruchu tile-by-tile.

## Combat

Walka ma własny ekran i może używać mocniejszego rytmu. Nie przenosimy animacji Attack, Hurt, Cast ani Death na mapę eksploracji.

## Dostępność i wydajność

- Respektujemy `prefers-reduced-motion` przy animacjach UI.
- Nie animujemy kosztownych filtrów na setkach kafli.
- Informacja pozostaje zrozumiała po wyłączeniu animacji.
- Migotanie i szybkie błyski nie są używane jako standardowa informacja.
