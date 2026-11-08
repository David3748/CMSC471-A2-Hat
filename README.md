# CMSC471 A2: White Hat / Black Hat

Two visualizations of one dataset, one honest (white hat) and one subtly misleading (black hat), for
[Assignment 2](https://zcliu.github.io/teaching/CMSC471/assignments/A2-hat.html) in CMSC471, Fall 2026.

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
| `health-raw-2021.csv` | Health indicators, used only for female population by age (`SP.POP.TOTL.FE.IN`, `SP.POP.*.FE.5Y`) |

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
