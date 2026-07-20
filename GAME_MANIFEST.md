# GAME MANIFEST

Ten plik jest indeksem obowiązujących zasad projektu MegaGiera. Nadrzędnym dokumentem projektu pozostaje [Constitution](docs/CONSTITUTION.md). Szczegółowe rozwinięcia znajdują się w `docs/GameDesignBook`.

## Tożsamość gry

MegaGiera jest proceduralnym Adventure RPG opartym na eksploracji, odkrywaniu, ryzyku i rozwoju. Każda nowa gra tworzy nową wyprawę, a zapis zachowuje jej postać, seed, wygenerowany świat i postęp.

## Początek przygody

Obowiązujący przepływ startowy:

`Main Menu → New Game → Character Creation → World Generation → Meadows → Exploration`

Tworzenie postaci obejmuje:

1. nazwę, rozdzielenie statystyk i wybór startowej broni;
2. wybór dwóch startowych Subskilli.

Powrót pomiędzy ekranami kreatora nie może usuwać wprowadzonych danych. Zatwierdzenie tworzy nowy zapis, generuje istniejącym generatorem region Meadows, ustawia istniejący punkt startowy i umieszcza na nim gracza.

## Zapis i kontynuacja

- `Continue` jest dostępne wyłącznie dla poprawnego zapisu.
- Kontynuacja wczytuje zapisaną mapę i nie generuje nowego seeda.
- `Quick Start (DEV)` przechodzi przez ten sam proces tworzenia świata i zapisu, ale używa kompletnej losowej konfiguracji postaci.

## Granice implementacji

Nie należy tworzyć systemów „na zapas” ani zastępować istniejącego generatora równoległą implementacją. Szczegółowe zasady gameplayu, regionów, UI, kierunku artystycznego i zakresu wykluczonego określa `docs/CONSTITUTION.md`.

## Miejsce na rozwinięcia

Kolejne zatwierdzone rozdziały manifestu należy najpierw uzgodnić z Constitution, a następnie opisać w Game Design Book.
