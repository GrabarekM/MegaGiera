# Repository Analysis — Sprint 0

Analiza opisuje stan repozytorium w dniu utworzenia Sprintu 0. Nie jest listą zmian do wykonania natychmiast.

## Co już istnieje

- Vue 3 i Vite bez dodatkowego frameworka stanu.
- Przepływ Main Menu → tworzenie postaci → świat Meadows → Continue.
- Deterministyczny generator Meadows z seedowanym RNG, walidacją i testami.
- Ruch tile-by-tile, przechodniość, kamera, zoom, save/load i wersjonowanie zapisu.
- Warstwowy renderer widocznego fragmentu mapy oraz pierwsze atlasy terenu.
- Osobny ekran walki, inicjatywa, umiejętności, przeciwnicy i log walki.
- Atrybuty, biegłości, rozwój, trenerzy, mentorzy i wiedza.
- Ekwipunek, wyposażenie, przedmioty, książki, używanie przedmiotów i tooltipy.
- Merchant, crafting, salvage, loot i nagrody.
- POI, encountery podróżne, dialogi, questy, harmonogramy NPC i eventy świata.
- Centralne modele domenowe w wielu systemach oraz rozbudowany zestaw 535 testów.

## Czego brakuje względem Game Design Book

- Zatwierdzonych i rozwiniętych filarów, reguł pętli przygody oraz modelu risk versus reward.
- Jednej pełnej, ręcznie zweryfikowanej ścieżki pierwszych 15 minut z właściwym NPC, questem i encounterem.
- Docelowej biblioteki spójnych assetów dla większości terenów, obiektów, postaci oraz ikon.
- Jednego wdrożonego systemu tokenów wizualnych UI zgodnego ze Style Guide.
- Kompletnej dostępności klawiatury, focus managementu i przeglądu czytelności wszystkich modalnych ekranów.
- Pełnej dokumentacji wersjonowania generatora świata i kompatybilności seedów pomiędzy zmianami algorytmu.
- Mierzalnych budżetów wydajności, rozmiaru bundle i czasu generowania mapy.

## Systemy zgodne z kierunkiem

- Oddzielny ekran walki jest zgodny z Decision #002.
- Ruch i kolizje kafelkowe są zgodne z Decision #003.
- Meadows jako pierwszy deterministyczny region odpowiada Decisions #004–005.
- Panel manager i istniejące skróty wspierają filozofię keybindów.
- Data-driven definicje przedmiotów, przeciwników, encounterów, questów, merchantów, NPC i eventów wspierają Decision #011.
- Save/load przechowuje seed, region i pozycję oraz ma migracje i testy.
- Systemy nocy, światła, Wardwood, encounter meter i ograniczone zasoby tworzą podstawę risk versus reward.

## Systemy wymagające późniejszej poprawy

- `MenuThree.vue` pozostaje bardzo dużym komponentem integracyjnym; dalszy podział powinien być stopniowy i wynikać z realnych granic odpowiedzialności.
- Obecny UI jest funkcjonalny, ale wizualnie bliższy technicznemu panelowi niż księdze, mapie, skrzyni czy sakiewce.
- Emoji i proste symbole nadal pełnią rolę wielu ikon produkcyjnych.
- Część systemów jest dostępna głównie przez Dev Tools i nie tworzy jeszcze spójnej podróży gracza.
- Pierwszy NPC, pierwszy quest oraz pierwszy encounter istnieją jako fundamenty systemowe, ale wymagają później kuracji zawartości i integracji w jeden onboarding.
- Generator i testy mapy są kosztowne; potrzebny jest osobny pomiar przed optymalizacją.
- Główny bundle przekracza ostrzegawczy próg Vite i w przyszłości może wymagać code-splittingu.
- Styl mapy łączy gotowe atlasy z placeholderami CSS; potrzebna jest kontrolowana wymiana placeholderów na finalne assety.

## Wniosek

Projekt posiada ponadprzeciętnie szeroki fundament systemowy i testowy jak na etap przedprodukcyjny. Największym ryzykiem nie jest brak mechanik, lecz brak jednej zatwierdzonej hierarchii produktu, nierówny stopień integracji oraz możliwość dalszego rozszerzania systemów bez ukończenia grywalnej ścieżki. Kolejne sprinty powinny skupiać się na pionowym slice, spójności UI i produkcji zawartości, a nie na nowych dużych mechanikach.
