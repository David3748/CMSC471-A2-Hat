# CMSC471 A2: White Hat / Black Hat

Two visualizations of one dataset, one honest (white hat) and one subtly misleading (black hat), for
[Assignment 2](https://zcliu.github.io/teaching/CMSC471/assignments/A2-hat.html) in CMSC471, Fall 2026.

## The site

Both visualizations use the World Bank's maternal mortality estimates for 2000–2017.

- **White hat:** maternal mortality by region in 2000 vs 2017, where the world's 295,000 maternal deaths happened,
  and the US against six wealthy peers, all on zero-based scales.
- **Black hat:** "The US is killing our mothers." Ranks countries by percent change (the US is #1 of 185, from 12 to
  19 per 100,000) on a Mercator map with a lopsided color scale, and indexes every series to 2000 = 100 so the US
  line climbs while regions with rates 10–40× higher fall.

To run it locally:

```bash
python3 -m http.server 8471
```

Then open http://localhost:8471.

| Path | What it is |
| --- | --- |
| `index.html`, `css/styles.css` | The page; color tokens for light and dark mode are at the top of the stylesheet |
| `js/helpers.js` | Shared formatting, tooltip, table and crosshair helpers |
| `js/whitehat.js`, `js/blackhat.js` | One file per visualization |
| `js/main.js` | Loads the data and draws both |
| `data/maternal_mortality.json` | Derived data, built by `scripts/build_data.py` |
| `data/countries-110m.json` | Country shapes from [world-atlas](https://github.com/topojson/world-atlas) 2.0.2 (Natural Earth) |

To rebuild the derived data:

```bash
./scripts/get_data.sh
python3 -I scripts/build_data.py
```

## Dataset

The World Bank's [Gender Statistics](https://data.worldbank.org/topic/gender) from the World Development Indicators,
via the pre-cleaned [World Bank Data by Indicators](https://github.com/light-and-salt/World-Bank-Data-by-Indicators/tree/master/gender)
mirror linked in the assignment. The World Bank last updated this snapshot on 2021-09-15. World Bank data is licensed
under [CC BY 4.0](https://datacatalog.worldbank.org/public-licenses#cc-by): we can publish derived data as long as we
credit the World Bank.

### Get the data

```bash
./scripts/get_data.sh
```

This downloads into `data/raw/` (gitignored; commit derived files instead):

| File | What it is |
| --- | --- |
| `gender-raw-2021.csv` | The data: one row per country × indicator, one column per year 1960–2020 |
| `Metadata_Country_API_17_DS2_en_csv_v2_3058240.csv` | Region and income group for each country |
| `Metadata_Indicator_API_17_DS2_en_csv_v2_3058240.csv` | Definition and source of each indicator |
| `health-raw-2021.csv` | Health indicators: number of maternal deaths (`SH.MMR.DTHS`) and female population by age |
| `iso-codes.json` | ISO alpha-3 to numeric codes ([i18n-iso-countries](https://github.com/michaelwittig/node-i18n-iso-countries)), to join countries to map shapes |

We use the raw file rather than the mirror's cleaned `gender.csv`, which keeps only 50 of the 156 indicators and
drops parliament seats, labor force participation and the Women, Business and the Law index.

### Reading the raw files

- The first 4 lines are a title block: `pd.read_csv(path, skiprows=4)`.
- Data is wide, one column per year. Melt it to long (country, indicator, year, value) and drop empty values.
- The 266 rows per indicator are 217 countries plus 49 aggregates such as World, Arab World and High income.
  Countries are the codes with a `Region` in the country metadata; filter on that or aggregates get counted twice.
- Aggregates like World are weighted averages (usually by population), so they won't match a simple average of
  countries. For example, 2019 female labor force participation is 47.3% for World but 52.1% averaged over countries.

### Coverage is uneven

156 indicators, but most are sparse. Which countries report, and when, varies a lot:

| Indicator | Countries | High-income share of reporters |
| --- | --- | --- |
| Life expectancy, fertility | 208 | (nearly every country, 1960–2019) |
| Labor force participation (ILO modeled) | 187 | (every year 1990–2019) |
| Seats held by women in parliament | 193 | 30% |
| Married by 18 | 132 | 8% |
| Believe wife-beating is justified | 107 | 5% |
| Unpaid domestic and care work | 89 | 39% (no India, Indonesia, Nigeria or Bangladesh) |

For reference, 37% of all 217 countries are high income. Survey-based indicators come from different years per
country (unpaid care work: 2001–2019), so a "latest value" map is not a single snapshot. There is no gender pay gap
indicator in this set.
