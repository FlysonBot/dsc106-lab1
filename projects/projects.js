import { fetchJSON, renderProjects } from '../global.js';

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
