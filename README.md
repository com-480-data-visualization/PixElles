# Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
| Morgane Magnin | 347041 |
| Luna Raithle   | 332446 |
|                |        |

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

**General Topic**: Spatio-Temporal Evolution of Natural Disasters (1960-2025)

**Main Axis**: This project aims to deconstruct the complex relationship between natural hazards and human societies over the last six decades. Driven by the acceleration of global warming, we seek to visualize the changes of historical disaster baselines and modern climate-driven events. To achieve this, we will address three critical dimensions:

1. **Climate-Related Shifts**: Has the frequency of *climate-related* disasters (floods, storms, droughts) increased disproportionately compared to *geological* events (earthquakes, volcanoes) over the past 60 years?
2. **Geographical Dynamics**: Are traditional disaster hotspots intensifying, or are new regions emerging as vulnerable zones due to climate change?
3. **Human Impact & Resilience**: How does the rising frequency of these events correlate with human impact (deaths, economic loss), and what does this reveal about our evolving capacity to respond?

#### Motivation

Public discourse on natural disasters is often reactive and fragmented. Media coverage tends to focus only on isolated, high-intensity events or static snapshots of damage, creating a perception of randomness rather than pattern. Consequently, there is a critical absence of accessible visualizations that dynamically contextualize these events within a long-term historical framework, leaving audiences unable to distinguish between normal variability and systemic climate shifts.

Our approach is to move from static, isolated event visualizations, to a continuous, dynamic narrative of global risk from 1960 to 2025. By contrasting the rising frequency of climate-related events against the stable baseline of geological hazards, we provide a clearer picture of planetary change. Crucially, we go beyond frequency metrics to integrate mortality and economic loss data, addressing a nuanced core question:

> _As disasters become more frequent, is humanity becoming more vulnerable, or are we successfully adapting?_

#### Target Audience

This project is designed to serve two primary audiences, bridging the gap between public awareness and professional planning:

1. **The General Public**: To move beyond brief news headlines and foster a deeper, data-driven understanding of the evolving nature of global risks. By visualizing long-term trends, we aim to increase public awareness of the world's changing environmental landscape and the urgency of climate adaptation.
2. **Urban Planners & Risk Managers:** To provide a data-driven historical context for site-specific planning. By visualizing the long-term frequency and intensity of disasters in specific locations, planners can understand the local vulnerabilities, make informed decisions on building critical infrastructures and analyze how specific regions have historically coped with repeated events to improve current building codes and emergency strategies.

### Exploratory Data Analysis

Our exploratory analysis for the EM-DAT Public dataset is documented in the notebook [eda_public_emdat.ipynb](milestones/milestone-1/eda_public_emdat.ipynb).

Preprocessing was limited: we loaded the EM-DAT table, selected the columns needed for visualization (time, geography, disaster categories, impacts, and adjusted economic indicators), created a `Disaster_ID` to track the same event across multiple countries, and checked duplicates and missing values before plotting.

The notebook mainly uses plots to show disaster categories and regional distributions. It also includes plots to better understand relationships between variables and to highlight yearly trends.

### Related work

> - What others have already done with the data?
> - Why is your approach original?
> - What source of inspiration do you take? Visualizations that you found on other websites or magazines (might be unrelated to your data).
> - In case you are using a dataset that you have already explored in another context (ML or ADA course, semester project...), you are required to share the report of that work to outline the differences with the submission for this class.

## Milestone 2 (17th April, 5pm)

**10% of the final grade**

## Milestone 3 (29th May, 5pm)

**80% of the final grade**

## Late policy

- < 24h: 80% of the grade for the milestone
- < 48h: 70% of the grade for the milestone
