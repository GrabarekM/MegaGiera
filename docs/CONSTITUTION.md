# MegaGiera Constitution v1.0

Ten dokument jest nadrzędnym dokumentem projektu.

Każda implementacja musi być zgodna z tym dokumentem.

Jeżeli kod jest sprzeczny z Constitution — poprawiany jest kod.

Jeżeli implementacja wymaga zmiany Constitution — nie zmieniaj jej samodzielnie. Zgłoś problem i zaproponuj rozwiązanie.

## 1. Vision

MegaGiera jest Procedural Adventure RPG.

Nie jest MMORPG. Nie jest Hack'n'Slashem. Nie jest Survivalem. Nie jest Sandboxem.

Każda nowa gra jest nową wyprawą przez proceduralnie wygenerowany świat.

Gra posiada początek. Gra posiada zakończenie.

Ostatecznym celem jest pokonanie ostatniego bossa znajdującego się w ostatnim regionie.

## 2. DNA gry

MegaGiera nie sprawdza, jak szybko klikasz. MegaGiera sprawdza, jak dobrze poznajesz świat.

Gracz rozwija postać, ale przede wszystkim samego siebie.

Każdy kolejny run powinien być łatwiejszy dlatego, że gracz posiada większą wiedzę.

## 3. Pięć filarów

- Adventure.
- Exploration.
- Discovery.
- Risk vs Reward.
- Growth.

Każda nowa mechanika musi wzmacniać przynajmniej jeden z tych filarów.

## 4. Player Journey

Nowa Gra → Tworzenie Postaci → Generowanie Świata → Eksploracja → Encounter → Combat → Nagrody → Rozwój → Eksploracja → Boss Regionu → Nowy Region → … → Ostatni Boss → Koniec Gry.

## 5. Regiony

Regiony występują zawsze w tej kolejności:

1. Meadows.
2. Dark Forest.
3. Swamp.
4. Mountains.
5. Desert.
6. Ice Land.
7. Ancient Lands.
8. Scorched Kingdom.

Każdy region:

- posiada własny charakter;
- posiada własnych przeciwników;
- posiada własnego głównego bossa;
- posiada własną historię;
- uczy gracza czegoś nowego.

## 6. World State

Każdy region podczas generowania otrzymuje World State.

World State zmienia sytuację regionu.

Nie zmienia:

- głównego bossa;
- biomu;
- celu regionu.

Może zmieniać:

- encountery;
- NPC;
- dialogi;
- questy;
- część POI;
- ekonomię;
- wydarzenia.

Generator tworzy historię regionu. Nie tylko mapę.

## 7. Exploration

Eksploracja jest główną aktywnością gracza.

Ruch jest tile-by-tile. Każde naciśnięcie klawisza oznacza ruch o jedno pole.

Ruch jest interpolowany. Animacja przejścia trwa około 0,3 sekundy.

Logiczna pozycja gracza pozostaje kafelkowa.

## 8. Combat

Combat odbywa się na osobnym ekranie.

Na mapie świata nie istnieją:

- walka czasu rzeczywistego;
- hitboxy;
- atakowanie;
- obrażenia;
- pociski.

Mapa jedynie uruchamia Encounter.

## 9. Encounters

Encounter uruchamiany jest po wejściu na nowe pole.

Encounter zależy od:

- regionu;
- biomu;
- World State;
- typu terenu;
- pory dnia;
- specjalnych lokacji.

Nie każdy ruch kończy się Encounterem.

Encounter powinien być wydarzeniem. Nie codziennością.

## 10. Questy

Questy dzielą się na:

- Story Quest;
- Adventure Quest;
- Simple Quest.

Simple Questy są dozwolone, na przykład: zabij 10 wilków albo przynieś 5 skór.

Quest zawsze powinien wynikać z problemu świata. Nigdy odwrotnie.

## 11. NPC

NPC mają być nieliczni. Każdy NPC powinien mieć konkretną rolę.

Lepsze jest 6 świetnych NPC niż 60 przypadkowych.

## 12. Śmierć

Śmierć jest częścią gry. Nie jest karą.

Po śmierci gracz powinien wiedzieć, dlaczego przegrał.

Śmierć ma uczyć. Nie frustrować.

## 13. Difficulty

Gra jest wymagająca. Nie jest niesprawiedliwa.

Trudność wynika z:

- decyzji;
- przygotowania;
- wiedzy;
- ryzyka.

Nigdy z oszustw.

## 14. Risk vs Reward

Gracz może farmić. Nigdy nie jest do tego zmuszany.

Najbardziej efektywną metodą rozwoju jest eksploracja. Nie grind.

Największe nagrody znajdują się w najbardziej niebezpiecznych miejscach.

## 15. UI

UI jest częścią świata. Nie wygląda jak nowoczesny program.

Przypomina:

- pergamin;
- księgę;
- mapę;
- skrzynię;
- sakiewkę.

Każde okno posiada keybind.

Najważniejsza jest czytelność.

## 16. Art Direction

Inspiracje: Gothic 1 i Ultima Online.

Nie kopiujemy ich. Tworzymy własny świat.

Styl jest:

- naturalny;
- surowy;
- realistyczny;
- spokojny;
- niepokojący.

## 17. Platforma

Docelowa platforma: Windows i Steam.

Nie planujemy:

- Linux;
- Steam Deck;
- Controller Support.

## 18. Mechaniki świadomie odrzucone

Nie implementujemy:

- Frakcji;
- Reputacji;
- Kradzieży;
- PvP;
- Multiplayer;
- Survival;
- Hunger;
- Thirst;
- Durability Equipment;
- Walki na mapie.

## 19. Zasady implementacji

Każdy Sprint powinien poprawiać grywalność.

Nie implementujemy systemów „na zapas”.

Najpierw gracz. Potem kod.

Najpierw gameplay. Potem architektura.

Po każdym sprincie:

- uruchom build;
- uruchom testy;
- przedstaw raport.

## 20. Najważniejsza zasada

Nie implementujesz systemów. Budujesz MegaGierę.

Jeżeli podczas implementacji uznasz, że rozwiązanie techniczne jest sprzeczne z Constitution, nie zmieniaj samodzielnie projektu gry.

Przedstaw problem i zaproponuj rozwiązanie.
