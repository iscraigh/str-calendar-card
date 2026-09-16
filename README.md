# STR Multi-Calendar Card for Home Assistant

A custom Lovelace calendar card designed specifically for short-term rental (STR) operators. Unlike default calendar cards that block out full 24-hour days, this card renders reservations as continuous horizontal bars mimicking the native multi-calendar views on platforms like Airbnb and Vrbo.

It accurately visualizes:
* **Check-In Days:** Stays begin at the midpoint (afternoon) with rounded caps, showing the morning is unoccupied.
* **Check-Out Days:** Stays end at the midpoint (morning) with rounded caps, showing the afternoon is open.
* **Turnover Days:** Same-day departures and arrivals meet seamlessly in the center of the same date cell.
* **Multi-Listing Stacking:** Handles multiple properties with collision detection and customizable colors so bars never overlap illegibly.
* **Full UI Configuration:** Add and edit listings, labels, and colors directly from the Home Assistant visual editor.

---

## Preview

<!-- Replace this image link with your own screenshot once uploaded to your repo -->
![STR Multi-Calendar Card Preview](https://raw.githubusercontent.com/iscraigh/str-calendar-card/main/preview.png)

---

## Installation

### Method 1: HACS (Recommended)

1. Ensure [HACS](https://hacs.xyz/) is installed and running.
2. In Home Assistant, open **HACS** > **Frontend**.
3. Click the **three dots (⋮)** in the top right corner and select **Custom repositories**.
4. Enter the repository URL:
   ```text
   [https://github.com/iscraigh/str-calendar-card](https://github.com/iscraigh/str-calendar-card)
5.   Select Lovelace (Dashboard) as the category and click Add.

6.    Find STR Multi-Calendar Card in the store list and click Download.

7.    Reload your browser window when prompted.

Method 2: Manual Installation

1.    Download str-calendar-card.js from the dist/ directory of this repository.

2.    Copy str-calendar-card.js to your Home Assistant configuration directory under www/ (e.g. /config/www/str-calendar-card.js).

3.    In Home Assistant, go to Settings > Dashboards > Three dots (⋮) > Resources.

4.    Click Add Resource:

        URL: /local/str-calendar-card.js

        Resource Type: JavaScript Module

5.    Hard-refresh your browser (Ctrl+Shift+R or Cmd+Shift+R).

Configuration
Visual Editor

1.    Go to your dashboard, click Edit Dashboard, then click Add Card.

2.    Search for STR Multi-Calendar Card.

3.    Use the form to enter a card title, select your calendar entities from the dropdown, assign display names, and pick bar colors.

YAML Configuration

You can also configure the card using YAML.

type: custom:str-calendar-card
title: "Turnover Schedule"
entities:
  - entity: calendar.crystal_hollows_rental_control
    name: "Crystal Hollows"
    color: "#ff385c"
  - entity: calendar.suite_two_rental_control
    name: "Garden Suite"
    color: "#008489"

    
