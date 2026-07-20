# UI Font Guide

Docelowo interfejs powinien używać najwyżej trzech rodzin fontów: ekspresyjnej dla nagłówków, czytelnej dla treści oraz opcjonalnej technicznej dla bardzo małych liczb. Konkretne pliki fontów wymagają później sprawdzenia licencji, polskich znaków i jakości renderowania.

## Heading Font

Charakter: rzeźbiony, historyczny, poważny, bez przesadnej ornamentyki. Kandydat stylistyczny: rodzina w duchu `Cinzel` albo czytelnego display serif.

- Użycie: nazwy ekranów, rozdziały ksiąg, ważne lokacje.
- Bez długich akapitów i bez agresywnego kapitalizowania.
- Nagłówek musi pozostawać czytelny także przy zmniejszeniu okna.

## Body Font

Charakter: humanistyczny serif o otwartych znakach, np. kierunek `Source Serif 4` lub `Noto Serif`.

- Użycie: dialog, opisy przedmiotów, instrukcje, questy.
- Pełny zestaw polskich znaków.
- Stabilne cyfry oraz wyraźne rozróżnienie `I/l/1` i `O/0`.

## Tooltip Font

Tooltip może używać czytelnego sans-serif obecnego w systemie albo rodziny w duchu `Atkinson Hyperlegible`/`Noto Sans`.

- Priorytetem jest odczyt w małej skali.
- Minimalny docelowy rozmiar należy ustalić po testach urządzeń, nie intuicyjnie.
- Liczby, wymagania i skróty nie używają dekoracyjnych kapitalików.

## Book Font

Ta sama rodzina co Body Font, z większą interlinią i spokojniejszą szerokością kolumny. Kursywa służy cytatom i marginaliom, nie całym stronom.

## Journal Font

Podstawowa treść pozostaje złożona czytelnym serifem. Pismo odręczne może pojawiać się tylko w krótkich dopiskach, datach i podpisach. Nigdy w krytycznym celu questa.

## Button Font

Czytelna odmiana półgruba fontu nagłówkowego albo body. Etykiety są krótkie, jednoznaczne i zapisane naturalną wielkością liter. Wersaliki dopuszczalne wyłącznie dla krótkich kategorii.

## Zasady czytelności

- Maksymalnie trzy rodziny fontów w całej grze.
- Pełne wsparcie polskich znaków przed zatwierdzeniem fontu.
- Kontrast i wielkość są ważniejsze niż „średniowieczny” charakter.
- Nie umieszczamy tekstu bezpośrednio na hałaśliwej teksturze bez warstwy uspokajającej.
- Długie linie ograniczamy do około 55–75 znaków.
- Stan disabled nadal musi dać się przeczytać.
- Keybindy i liczby stosują stabilne wyrównanie.
- Font fallback nie może radykalnie zmieniać wymiarów układu.
