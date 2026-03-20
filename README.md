# Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
| Morgane Magnin | 347041 |
|                |        |
|                |        |

[Milestone 1](#milestone-1) • [Milestone 2](#milestone-2) • [Milestone 3](#milestone-3)

## Milestone 1 (20th March, 5pm)

**10% of the final grade**

This is a preliminary milestone to let you set up goals for your final project and assess the feasibility of your ideas.
Please, fill the following sections about your project.

*(max. 2000 characters per section)*

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

> Frame the general topic of your visualization and the main axis that you want to develop.
> - What am I trying to show with my visualization?
> - Think of an overview for the project, your motivation, and the target audience.

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

