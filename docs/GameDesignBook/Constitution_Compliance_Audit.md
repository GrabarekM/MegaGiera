# Constitution Compliance Audit — v1.0

Audyt porównuje Constitution v1.0 z aktualnym repozytorium i dokumentacją. Nie zmienia projektu ani nie autoryzuje implementacji. Rozbieżności powinny wejść do właściwych sprintów dopiero po ustaleniu priorytetu.

## Zgodne obszary

### Vision i DNA

- Projekt jest opisany jako proceduralne Adventure RPG, a nowy run otrzymuje własny seed.
- Wiedza, książki, odkrycia, POI i stopniowe poznawanie systemów wspierają rozwój gracza przez wiedzę.
- Dokumenty Out of Scope odrzucają MMORPG, survival, multiplayer oraz walkę na mapie.

### Filary

- Generator regionu, podróż, POI i encountery wspierają Adventure, Exploration i Discovery.
- Zagrożenie nocy, źródła światła, Wardwood, ograniczone zasoby i nagrody tworzą fundament Risk vs Reward.
- Atrybuty, biegłości, umiejętności, trenerzy, mentorzy, wiedza i wyposażenie wspierają Growth.

### Exploration i Combat

- Logiczna pozycja gracza jest kafelkowa.
- Jedno naciśnięcie `WASD` przekazuje zamiar ruchu o jeden kafel.
- Przechodniość i granice mapy mają wspólną, testowaną walidację.
- Combat działa na oddzielnym ekranie. Na mapie nie ma hitboxów, pocisków ani zręcznościowego atakowania.

### Encounters, questy i NPC

- Encountery uwzględniają region, biome/terrain, lokalizację, porę dnia, zagrożenie i kontekst World State.
- Encounter meter oraz cooldowny ograniczają częstotliwość zdarzeń.
- Questy mają data-driven etapy, wymagania i efekty powiązane ze stanem świata.
- NPC mają definicje ról, harmonogramów, dostępności, dialogów, handlu i treningu.

### UI, Art Direction i platforma

- Game Design Book oraz Art Direction opisują UI jako część świata i stawiają czytelność na pierwszym miejscu.
- Główne panele mają keybindy i blokują ruch w tle.
- Dokumentacja artystyczna rozwija naturalny, surowy, spokojny i niepokojący kierunek bez kopiowania inspiracji.
- Repozytorium nie zawiera systemów multiplayer, PvP, survival, hunger ani thirst.

### Zasady implementacji

- Projekt posiada automatyczne testy domenowe i produkcyjny build Vite.
- Systemy są w dużej części data-driven oraz testowalne poza Vue.
- Save/load zachowuje seed, region, pozycję i stany systemów.

## Rozbieżności wymagające późniejszej decyzji implementacyjnej

### 1. Interpolacja ruchu — brak zgodności

Constitution wymaga animowanego przejścia trwającego około 0,3 sekundy przy zachowaniu kafelkowej pozycji logicznej. Aktualnie `movePlayerBy` natychmiast zmienia `playerPosition`, a znacznik gracza jest renderowany od razu w nowym kaflu. Nie znaleziono warstwy wizualnej interpolującej pozycję gracza.

**Propozycja:** osobny, ograniczony sprint prezentacyjny. Logika ruchu i kolizji pozostaje kafelkowa; renderer animuje wyłącznie pozycję wizualną przez około 300 ms. Input podczas animacji wymaga jawnej decyzji: kolejka jednego ruchu albo blokada do zakończenia przejścia.

### 2. World State podczas generowania — częściowa zgodność

Istnieje rozbudowany `WorldEventRuntime`, `WorldState`, `RegionState`, wpływ na encountery, NPC, dialogi, questy, POI, ekonomię i eventy. Nowy run inicjalizuje jednak w większości bezpieczny stan początkowy; generator Meadows tworzy przede wszystkim mapę i strukturę regionu. Nie ma jeszcze wyraźnego etapu, w którym generowany wariant World State tworzy historię konkretnego regionu.

**Propozycja:** najpierw opisać kontrakt historii regionu i ograniczony zestaw wariantów Meadows. Dopiero później integrować go z istniejącym runtime, bez budowania drugiego World State.

### 3. Pełna kolejność ośmiu regionów — fundament nieukończony

Repozytorium implementuje Meadows. Pozostałe regiony z Constitution nie mają jeszcze kompletnych generatorów, historii, bossów i zawartości. Nie jest to sprzeczność istniejącego kodu, lecz brak produkcyjny względem pełnej wizji.

**Propozycja:** nie rozpoczynać następnego regionu przed ukończeniem pionowego slice Meadows i kontraktu przejścia po bossie regionu.

### 4. Początek, ostatni boss i koniec gry — brak pełnej pętli

Meadows posiada strukturę bossa, ale nie istnieje jeszcze pełna, grywalna sekwencja wszystkich regionów prowadząca do ostatniego bossa oraz jednoznacznego końca gry.

**Propozycja:** najpierw dowieść pełnej mini-pętli Meadows: eksploracja → encounter → combat → nagroda → boss regionu → kontrolowane zakończenie regionu.

### 5. Śmierć jako czytelna lekcja — częściowa zgodność

Combat rozpoznaje porażkę i prezentuje wynik, ale pełna ścieżka śmierci, wyjaśnienia przyczyny, wiedzy wyniesionej z porażki i powrotu do kolejnego runu nie jest jeszcze ukończonym doświadczeniem.

**Propozycja:** zaprojektować ekran podsumowania porażki wokół przyczyny, możliwego przygotowania i odkrytej wiedzy, bez karania gracza ukrytymi stratami.

### 6. UI jako fizyczna część świata — kierunek zatwierdzony, implementacja prototypowa

Obecne UI jest czytelne i funkcjonalne, lecz w dużej części wygląda jak granatowo‑indygo aplikacja fantasy. Metafory pergaminu, księgi, mapy, skrzyni i sakiewki istnieją w dokumentacji, ale nie są jeszcze konsekwentnie wdrożone.

**Propozycja:** wdrażać kierunek ekran po ekranie po zatwierdzeniu tokenów, typografii i wzorcowego okna. Nie wykonywać jednorazowego rewrite całego UI.

### 7. Keybind dla każdego okna — wymaga pełnej inwentaryzacji

Podstawowe panele mają keybindy. Część nakładek kontekstowych uruchamia się przez zdarzenie świata lub akcję i nie ma osobnego bezpośredniego skrótu. Constitution używa sformułowania „każde okno”, które może oznaczać również Dialogue, Merchant, Loot i potwierdzenia.

**Problem do rozstrzygnięcia przez właściciela projektu:** czy okna kontekstowe muszą mieć skrót otwierający, czy wystarcza konsekwentny skrót zamykający (`Escape`). Rekomendacja: nie pozwalać otwierać kontekstowego Merchant/Dialogue bez właściwego zdarzenia świata; wymóg interpretować jako dostępność klawiatury i zamknięcie, nie globalny skrót otwarcia.

## Zgodność dokumentacji

- `Design_Decisions.md`, `Out_of_Scope.md`, `UI_Philosophy.md` i dokumenty Art Direction są zgodne z Constitution.
- Dotychczasowy Game Design Book nie definiował pełnej listy regionów ani nadrzędności dokumentu. Manifest został uzupełniony o jawne odwołanie do Constitution.
- Przyszłe decyzje projektowe nie mogą zmieniać pięciu filarów, kolejności regionów, modelu walki ani odrzuconych mechanik bez jawnej rewizji Constitution.

## Rekomendowana kolejność prac zgodności

1. Ukończyć pionowy slice Meadows bez nowych dużych systemów.
2. Dodać wyłącznie wizualną interpolację ruchu przy zachowaniu logiki tile-by-tile.
3. Zdefiniować i wdrożyć generowany wariant historii/World State Meadows z użyciem istniejącego runtime.
4. Ukończyć ścieżkę bossa regionu i przejścia do kontrolowanego końca Meadows.
5. Ukończyć edukacyjną pętlę śmierci i powrotu.
6. Wdrażać docelowe UI etapami zgodnie z Art Direction.
7. Dopiero po tym rozpocząć produkcję Dark Forest.
