# CMSC471 A2: White Hat / Black Hat

Two visualizations of one dataset, one honest (white hat) and one subtly misleading (black hat), for
[Assignment 2](https://zcliu.github.io/teaching/CMSC471/assignments/A2-hat.html) in CMSC471, Fall 2026.

## Dataset

[Civilian Complaints Against New York City Police Officers](https://www.propublica.org/datastore/dataset/civilian-complaints-against-new-york-city-police-officers),
from ProPublica, obtained from New York City's Civilian Complaint Review Board (CCRB) after New York repealed
section 50-a in June 2020.

### Get the data

```bash
./scripts/get_data.sh
```

This downloads the archive into `data/raw/`, which contains:

| File | What it is |
| --- | --- |
| `allegations_202007271729.csv` | The data: one row per allegation |
| `CCRB Data Layout Table.xlsx` | Field definitions plus rank, command, FADO and disposition glossaries |
| `ReadMe _ Civilian Complaints Against New York City Police Officers.pdf` | ProPublica's notes on the dataset |

`data/raw/` is gitignored. ProPublica's [terms of use](https://www.propublica.org/datastore/terms/) say we can't
republish the raw data on a stand-alone basis, and we must cite ProPublica wherever the data is used. Anything the
site loads should be a derived or aggregated file outside `data/raw/`.

### Shape

- 33,358 rows, one per **allegation**. A complaint can hold several allegations against several officers.
- 12,056 unique complaints (`complaint_id`) against 3,996 unique officers (`unique_mos_id`).
- Complaints received September 1985 through January 2020.

### Selection bias to keep in mind

- The data only covers officers who were **still on the force in late June 2020** and had **at least one
  substantiated allegation**. Officers with only unsubstantiated or exonerated allegations are absent.
- ProPublica removed allegations the CCRB found **unfounded** (did not occur).
- Only **closed** cases that the CCRB **fully investigated** are included.
- Complainant demographics are often blank or "Unknown" (about 4,500 rows have no complainant ethnicity).

### Fields

| Field | Description |
| --- | --- |
| `unique_mos_id` | Unique officer ID ("member of service") |
| `first_name`, `last_name` | Officer's name |
| `command_now` | Officer's command assignment as of July 2020 |
| `shield_no` | Officer's shield number |
| `complaint_id` | Unique complaint ID |
| `month_received`, `year_received` | When the CCRB received the complaint |
| `month_closed`, `year_closed` | When the CCRB closed the investigation |
| `command_at_incident` | Officer's command at the time of the incident |
| `rank_abbrev_incident`, `rank_incident` | Officer's rank at the time of the incident |
| `rank_abbrev_now`, `rank_now` | Officer's rank as of July 2020 |
| `mos_ethnicity`, `mos_gender`, `mos_age_incident` | Officer demographics (age at incident) |
| `complainant_ethnicity`, `complainant_gender`, `complainant_age_incident` | Complainant demographics (age at incident) |
| `fado_type` | Top-level category: Force, Abuse of Authority, Discourtesy, Offensive Language |
| `allegation` | Specific allegation within the FADO category |
| `precinct` | Precinct associated with the complaint |
| `contact_reason` | Why the officer made contact with the complainant |
| `outcome_description` | Outcome of the contact (arrest, summons, none, ...) |
| `board_disposition` | CCRB finding; see below |

`board_disposition` starts with one of three findings, and Substantiated also names the discipline the CCRB
recommended, such as `Substantiated (Charges)`:

- **Substantiated** (8,301 allegations): the conduct occurred and violated NYPD rules. The NYPD decides whether
  to follow the recommended discipline.
- **Exonerated** (9,609): the conduct occurred but NYPD rules allowed it.
- **Unsubstantiated** (15,448): the CCRB could not establish both that it occurred and that it broke the rules.
