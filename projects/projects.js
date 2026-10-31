import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

for (let i = 0; i < projects.length; i++) {
    if (!projects[i].image.startsWith('http')) {
        projects[i].image = '../' + projects[i].image;
    }
}

renderProjects(projects, projectsContainer, 'h2');

const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `${projects.length} Projects`;

let query = '';
let selectedYear = null;

function searchFiltered() {
    return projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
    });
}

function visibleProjects() {
    let matches = searchFiltered();
    if (selectedYear === null) {
        return matches;
    }
    return matches.filter((project) => project.year === selectedYear);
}

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);

function renderPieChart(projectsGiven) {
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );
    let newData = newRolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    // the selected year may have disappeared from the search results
    if (!newData.some((d) => d.label === selectedYear)) {
        selectedYear = null;
    }

    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) => arcGenerator(d));

    let newSVG = d3.select('svg');
    newSVG.selectAll('path').remove();
    let legend = d3.select('.legend');
    legend.selectAll('li').remove();

    function isSelected(idx) {
        return newData[idx].label === selectedYear;
    }

    function selectWedge(i) {
        selectedYear = isSelected(i) ? null : newData[i].label;

        newSVG
            .selectAll('path')
            .attr('class', (_, idx) => (isSelected(idx) ? 'selected' : ''));
        legend
            .selectAll('li')
            .attr('class', (_, idx) => (isSelected(idx) ? 'legend-item selected' : 'legend-item'));

        renderProjects(visibleProjects(), projectsContainer, 'h2');
    }

    newArcs.forEach((arc, idx) => {
        newSVG
            .append('path')
            .attr('d', arc)
            .attr('fill', colors(idx))
            .attr('class', isSelected(idx) ? 'selected' : '')
            .on('click', () => selectWedge(idx));
    });

    newData.forEach((d, idx) => {
        legend
            .append('li')
            .attr('style', `--color:${colors(idx)}`)
            .attr('class', isSelected(idx) ? 'legend-item selected' : 'legend-item')
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
            .on('click', () => selectWedge(idx));
    });
}

renderPieChart(projects);

let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
    query = event.target.value;
    renderPieChart(searchFiltered());
    renderProjects(visibleProjects(), projectsContainer, 'h2');
});
