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

function setQuery(newQuery) {
    query = newQuery;
    return projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
    });
}

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let selectedIndex = -1;

function renderPieChart(projectsGiven) {
    selectedIndex = -1;
    let newRolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );
    let newData = newRolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(newData);
    let newArcs = newArcData.map((d) => arcGenerator(d));

    let newSVG = d3.select('svg');
    newSVG.selectAll('path').remove();
    let legend = d3.select('.legend');
    legend.selectAll('li').remove();

    function selectWedge(i) {
        selectedIndex = selectedIndex === i ? -1 : i;

        newSVG
            .selectAll('path')
            .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));
        legend
            .selectAll('li')
            .attr('class', (_, idx) => (idx === selectedIndex ? 'legend-item selected' : 'legend-item'));

        if (selectedIndex === -1) {
            renderProjects(projects, projectsContainer, 'h2');
        } else {
            let year = newData[selectedIndex].label;
            renderProjects(
                projects.filter((project) => project.year === year),
                projectsContainer,
                'h2',
            );
        }
    }

    newArcs.forEach((arc, idx) => {
        newSVG
            .append('path')
            .attr('d', arc)
            .attr('fill', colors(idx))
            .on('click', () => selectWedge(idx));
    });

    newData.forEach((d, idx) => {
        legend
            .append('li')
            .attr('style', `--color:${colors(idx)}`)
            .attr('class', 'legend-item')
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
            .on('click', () => selectWedge(idx));
    });
}

renderPieChart(projects);

let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
    let filteredProjects = setQuery(event.target.value);
    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
});
