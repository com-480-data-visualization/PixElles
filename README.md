# Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
| Morgane Magnin | 347041 |
| Luna Raithle   | 332446 |
| Annaelle Myriam Benlamri| 297135 |

[Milestone 1](#milestone-1) • [Milestone 2](#milestone-2) • [Milestone 3](#milestone-3)

## Milestone 1 (20th March, 5pm)

**10% of the final grade**

This is a preliminary milestone to let you set up goals for your final project and assess the feasibility of your ideas.
Please, fill the following sections about your project.

_(max. 2000 characters per section)_

### Dataset

Our project uses the **[EM-DAT Public Dataset](https://public.emdat.be/)**, a comprehensive global database of both natural and technological disasters spanning from 1900 to 2026. The dataset is maintained by the Centre for Research on the Epidemiology of Disasters (CRED) and provides detailed records of disaster events that meet strict inclusion criteria.

Each record in EM-DAT represents a unique disaster impact in a country and includes rich metadata such as disaster type and subtype, geographic location, temporal information, and quantified impacts (deaths, affected populations, economic damages, and reconstruction costs).

**Data Quality Considerations:**

While rich, the EM-DAT dataset has important limitations that must be considered during analysis:

- **Time bias**: Reported disaster frequency increases over time partly due to better reporting, improved technology, and changes in data collection, not necessarily an increase in actual disasters. The official documentation recommends excluding pre-2000 data from trend analyses.
- **Threshold bias**: Larger disasters are more likely to be recorded than smaller ones.
- **Accounting bias & Geographic bias**: Economic losses and indirect effects are often underreported, and data quality varies across regions and hazard types.

For detailed information on these biases and limitations, consult the [EM-DAT documentation](https://doc.emdat.be/docs/known-issues-and-limitations/specific-biases/).

### Problematic

**General Topic: Narrative Spatio-Temporal Evolution of Natural Disasters (1975-2025)**

Public discourse on natural disasters is often reactive and fragmented. Media coverage tends to focus only on isolated, high-intensity events or static snapshots of damage, creating a perception of randomness rather than pattern. Consequently, there is a critical absence of accessible visualizations that dynamically contextualize these events within a long-term historical framework, leaving audiences unable to distinguish between normal variability and emerging non-stationary trends.

Our approach moves from static, isolated event visualizations, to a continuous, **dynamic** **narrative** of global risk from 1975 to 2025. This project seeks to reconstruct the historical trajectory of global natural hazards and their intersection with human society over the last 50 years. To achieve this, we will address three critical dimensions:

> 1. **Disaster Typology & Frequency:** How has the global profile of disasters shifted over time? Specifically, has the frequency of climate-related events (floods, storms, droughts) increased disproportionately compared to geological events (earthquakes, volcanoes)?
> 2. **Geospatial Vulnerability:** Are traditional disaster hotspots intensifying, or are new regions emerging as vulnerable zones?
> 3. **Human Impact & Resilience**: How does the rising frequency of these events correlate with human impact (deaths, economic loss) and what does this reveal about our evolving capacity to respond?

This project is designed to serve two primary audiences, bridging the gap between public awareness and professional planning:

1. **The General Public**: To move beyond brief news headlines and foster a deeper, data-driven understanding of the evolving nature of global risks. By visualizing long-term trends, we aim to increase public awareness of the world's changing environmental landscape.
2. **Urban Planners & Risk Managers:** To provide a data-driven historical context for site-specific planning. By visualizing the long-term frequency and intensity of disasters in specific locations, planners can understand the local vulnerabilities, make informed decisions on building critical infrastructures and analyze how specific regions have historically coped with repeated events to improve current building codes and emergency strategies.

### Exploratory Data Analysis

Our exploratory analysis for the EM-DAT Public dataset is documented in the notebook [eda_public_emdat.ipynb](milestones/milestone-1/eda_public_emdat.ipynb).

Preprocessing was limited: we loaded the EM-DAT table, selected the columns needed for visualization (time, geography, disaster categories, impacts, and adjusted economic indicators), created a `Disaster_ID` to track the same event across multiple countries, and checked duplicates and missing values before plotting.

The notebook mainly uses plots to show disaster categories and regional distributions. It also includes plots to better understand relationships between variables and to highlight yearly trends.

### Related work

#### Existing Work on the EM-DAT Dataset

EM-DAT is a widely used dataset and several types of work exist:

- **Official tooling.** The EM-DAT ecosystem provides built-in analytics via the [EM-VIEW dashboard](https://emview.streamlit.app/), covering metric, table, map and time views.

- **Academic and student projects.** A common pattern is studying trends with choropleth maps, line charts, and pie charts at the country level (such as [example](https://github.com/valeqm/World-Disaster-Pipeline)). [Global Disasters (UGent)](https://datavisualiatie-ugent.github.io/project-dv24-5/) goes further by linking disaster frequency to climate indicators, but each chart is standalone.

- **Our World in Data.** [OWID](https://ourworldindata.org/natural-disasters) offers the most comprehensive public collection of EM-DAT-based charts — deaths, economic costs, and long-term trends - but remains filter-based.

All of the above are primarily descriptive and exploration-focused.

#### Our Approach

- **From exploration to data storytelling.** Existing work with EM-DAT mainly focuses on descriptive dashboards and trend analysis. Consequently, there is an absence of accessible visualizations that dynamically contextualize these events within a long-term historical framework. Our approach is original because it moves from static, isolated event visualizations to a continuous narrative of global risk from 1975 to 2025, tracing how shifting disaster patterns redraw the map of global vulnerability and what this reveals about our evolving capacity to respond. 

- **Multi-dimensional narrative.** We integrate multiple dimensions (typology, geography and human impact) into a single coherent experience, rather than treating them as separate charts only.

#### Sources of Inspiration

We draw inspiration from a web-based platform for interactive data visualization and storytelling [Flourish](https://flourish.studio/examples/?Industry=Featured) and advanced visualization designers such as [Moritz Stefaner — *Rhythm of Food*](https://truth-and-beauty.net/).

## Milestone 2 (17th April, 5pm)

**10% of the final grade**

- Link to the report: [Milestone 2 Report](milestones/milestone-2/report.pdf)
- Link to the initial website: [Milestone 2 Website](https://com-480-data-visualization.github.io/PixElles/)

## Milestone 3 (29th May, 5pm)

**80% of the final grade**

## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone
