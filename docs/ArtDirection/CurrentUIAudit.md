# Current UI Audit — Sprint 0.2

Audyt porównuje obecny interfejs z docelowym kierunkiem. Nie jest poleceniem natychmiastowej przebudowy.

## Co pasuje

- Globalny ciemny fundament dobrze wspiera atmosferę i czytelność mapy.
- Tekst podstawowy zwykle ma wysoki kontrast, a stany ostrzegawcze, danger i success są rozróżniane.
- `GameButton` ma kompletne stany default, hover, pressed i disabled.
- Widoczny `focus-visible` jest zdefiniowany globalnie.
- Tworzenie postaci używa ciemnego muru, wyraźnych sekcji, podsumowania i widocznych kosztów wyboru.
- HUD pozostawia środek mapy dostępny i pokazuje keybindy podstawowych paneli.
- Panel manager zapewnia wspólny model aktywnego okna i blokuje ruch w tle.
- Inventory, Merchant, Dialogue, Quest, Tooltip i pozostałe systemy mają działające modele prezentacyjne oraz wyraźne akcje.
- Destrukcyjne działania używają potwierdzenia i czerwonego kodu stanu.
- Mapa jest warstwowa, a zwykła siatka kafli została ograniczona do kontekstu/debugowania.

## Co wymaga później zmiany

### Spójność wizualna

- Obecna paleta granat/indygo wygląda bardziej jak aplikacja fantasy niż materialny interfejs świata.
- Kolory, promienie narożników, cienie i obramowania są deklarowane lokalnie w wielu komponentach.
- Brakuje wspólnych tokenów dla powierzchni, tekstu, stanów, odstępów i animacji.
- `GameButton` jest znacznie większy i bardziej „mobilno-aplikacyjny” niż liczne przyciski w `MenuThree.vue`.

### Metafory okien

- Inventory, Merchant, Character i Quest działają funkcjonalnie, ale korzystają z podobnych granatowych paneli zamiast rozpoznawalnych metafor skrzyni, stołu handlowego, księgi i notatnika.
- Dialog i książki nie mają jeszcze docelowej typografii oraz rytmu dłuższego tekstu.
- Panele developerskie wizualnie mieszają się z właściwym ekranem gry.

### HUD

- Fundament jest właściwy, ale panel gracza ma dużo informacji i na części ekranów zajmuje znaczącą wysokość.
- Stały pasek wszystkich wejść do systemów może rosnąć wraz z projektem; potrzebna jest twarda granica liczby pozycji.
- Niektóre komunikaty, statusy i kontrolki konkurują o najwyższe warstwy `z-index`.

### Ikony i grafika

- Emoji są nadal używane jako ikony postaci, broni, nagród i stanów.
- Występuje mieszanka tekstowych symboli, emoji, CSS-owych placeholderów i pierwszych atlasów pixel-art.
- Brakuje zatwierdzonej siatki ikon, skali postaci i kompletnego zestawu assetów UI.

### Typografia i ruch

- Projekt polega głównie na fontach systemowych i klasach grubości; brak hierarchii fontów świata.
- Część etykiet używa wersalików i dużego tracking bez jednej reguły.
- Animacje są na ogół krótkie, co jest zgodne z kierunkiem, ale skalowanie przycisku `GameButton` jest bardziej energiczne niż docelowe spokojne zachowanie.

### Dostępność

- Istnieją dobre fundamenty ARIA, focusu i keybindów.
- Potrzebny jest późniejszy pełny audyt focus trapów, kolejności tabulacji, kontrastu docelowej palety, tekstów statusów oraz `prefers-reduced-motion`.

## Ocena

Aktualne UI jest funkcjonalnym i testowalnym prototypem produkcyjnym. Kierunek informacyjny jest w dużej części poprawny, ale warstwa artystyczna wymaga ujednolicenia przed masową produkcją komponentów i assetów.
