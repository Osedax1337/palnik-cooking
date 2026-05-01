# Palnik — mini analytics / events plan

## Cel
Zobaczyć, czy Palnik pomaga szybciej dojść do decyzji: **co dziś ugotować**.

## Główne pytania
1. Czy ludzie startują od katalogu, czy od trybu lodówki?
2. Które filtry realnie pomagają, a które tylko wyglądają ładnie?
3. Czy porównywarka prowadzi do otwarcia przepisu?
4. Czy użytkownik kończy na detail page i trybie gotowania?

## Core events

### Discovery
- `home_view`
  - props: `recipe_count`
- `catalog_search_used`
  - props: `query_length`
- `filter_changed`
  - props: `filter_type` (`mood|cuisine|diet|collection`), `value`
- `random_recipe_clicked`
  - props: `active_filters_count`

### Fridge mode
- `fridge_mode_enabled`
  - props: `selected_count`
- `fridge_ingredient_toggled`
  - props: `ingredient_key`, `selected_count`
- `fridge_results_viewed`
  - props: `selected_count`, `result_count`

### Compare
- `compare_recipe_toggled`
  - props: `recipe_slug`, `compare_count`, `action` (`add|remove`)
- `compare_page_view`
  - props: `recipe_count`
- `compare_recipe_opened`
  - props: `recipe_slug`, `position`

### Recipe detail
- `recipe_opened`
  - props: `recipe_slug`, `source` (`card_image|card_cta|recent|compare|direct`)
- `portion_changed`
  - props: `recipe_slug`, `portion`
- `shopping_mode_toggled`
  - props: `recipe_slug`, `enabled`
- `shopping_item_checked`
  - props: `recipe_slug`, `checked_count`, `total_count`

## KPI v1
- % sesji z `recipe_opened`
- % sesji z `fridge_mode_enabled`
- % compare sessions kończących się `recipe_opened`
- średnia liczba filtrów przed otwarciem przepisu
- top 10 recipe entry sources

## Minimal dashboard
- Funnel: `home_view -> filter/search/fridge -> recipe_opened`
- Compare funnel: `compare_recipe_toggled -> compare_page_view -> recipe_opened`
- Top recipes by opens
- Top filters by usage
- Top fridge ingredients

## Interpretacja
- Jeśli `fridge_mode_enabled` jest rzadkie, feature jest za słabo pokazany.
- Jeśli compare ma dużo wejść i mało `recipe_opened`, UI porównania nie domyka decyzji.
- Jeśli search działa częściej niż filtry, warto uprościć chipsy i bardziej eksponować input.
- Jeśli większość wejść w detail idzie z obrazka, to dobrze — karta jest bardziej intuicyjna niż CTA.

## Wdrożenie v1
Najpierw tylko eventy i prosty dashboard. Bez overkillu, bez 40 custom dimensions z piekła rodem.
