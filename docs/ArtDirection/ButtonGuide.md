# Button Guide

Przycisk ma wyglądać jak element, który reaguje na nacisk: skórzana zakładka, drewniana płytka, metalowe okucie albo zaznaczony fragment pergaminu. Metafora zależy od okna, ale zachowanie pozostaje wspólne.

## Default

- Czytelna etykieta opisująca rezultat.
- Wyraźna granica między przyciskiem a tłem.
- Umiarkowany kontrast bez stałego efektu „świecenia”.
- Minimalny obszar kliknięcia odpowiedni dla myszy i dotyku.

## Hover

- Delikatne rozjaśnienie krawędzi lub powierzchni.
- Subtelne podniesienie kontrastu, nie gwałtowne skalowanie całego układu.
- Kursor i tooltip tylko wtedy, gdy etykieta nie wyjaśnia działania.

## Focus

- Widoczny pierścień lub narożniki w kolorze Fire Gold.
- Focus nie może być usuwany ze względów estetycznych.
- Stan różni się od hover, ponieważ służy klawiaturze.

## Pressed

- Krótkie przesunięcie o 1–2 px, zmniejszenie cienia lub przyciemnienie powierzchni.
- Reakcja natychmiastowa, bez sprężystej animacji aplikacyjnej.
- Toggle pozostaje wizualnie zaznaczony po puszczeniu.

## Disabled

- Stonowane tło, obramowanie i tekst zgodne z paletą disabled.
- Brak hover i pressed.
- Etykieta nadal czytelna.
- Jeśli powód nie jest oczywisty, dostępne jest krótkie wyjaśnienie.

## Danger

Akcja nieodwracalna używa palety Danger i konkretnej etykiety: `Destroy`, `Delete Save`, `Leave Without Taking`. Nie używa ogólnego `OK`.

## Tempo

Zmiany wizualne przycisku trwają zwykle 80–160 ms. Przycisk nie pulsuje, chyba że wskazuje krytyczny, czasowy stan świata.
