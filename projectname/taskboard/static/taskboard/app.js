const API_URL = '/api/tasks/';

let tasks = [];
let currentFilter = 'all';

const form = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const list = document.getElementById('task-list');
const message = document.getElementById('message');
const emptyInfo = document.getElementById('empty');
const countAll = document.getElementById('count-all');
const countCompleted = document.getElementById('count-completed');
const filterButtons = document.querySelectorAll('.filter');

function getCookie(name) {
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(name + '='));
  return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
}

function showMessage(text) {
  message.textContent = text;
  message.hidden = false;
}

function hideMessage() {
  message.hidden = true;
  message.textContent = '';
}

async function apiRequest(url, method = 'GET', body = null) {
  const options = { method, headers: {} };
  if (method !== 'GET') {
    options.headers['X-CSRFToken'] = getCookie('csrftoken');
  }
  if (body !== null) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    let errorText = `Błąd serwera (${response.status})`;
    try {
      const data = await response.json();
      if (data.error) {
        errorText = data.error;
      }
    } catch (e) {
      // odpowiedź bez JSON - zostaje ogólny komunikat
    }
    throw new Error(errorText);
  }
  return response.status === 204 ? null : response.json();
}

function getFilteredTasks() {
  if (currentFilter === 'active') {
    return tasks.filter((task) => !task.completed);
  }
  if (currentFilter === 'completed') {
    return tasks.filter((task) => task.completed);
  }
  return tasks;
}

function updateSummary() {
  countAll.textContent = tasks.length;
  countCompleted.textContent = tasks.filter((task) => task.completed).length;
}

function createTaskElement(task) {
  const li = document.createElement('li');
  if (task.completed) {
    li.classList.add('done');
  }

  const title = document.createElement('span');
  title.className = 'title';
  title.textContent = task.title;

  const toggleButton = document.createElement('button');
  toggleButton.type = 'button';
  toggleButton.textContent = task.completed ? 'Przywróć' : 'Ukończ';
  toggleButton.addEventListener('click', () => toggleTask(task));

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'delete';
  deleteButton.textContent = 'Usuń';
  deleteButton.addEventListener('click', () => deleteTask(task));

  li.append(title, toggleButton, deleteButton);
  return li;
}

function renderTasks() {
  list.replaceChildren();
  const visibleTasks = getFilteredTasks();
  visibleTasks.forEach((task) => list.appendChild(createTaskElement(task)));
  emptyInfo.hidden = visibleTasks.length > 0;
  updateSummary();
}

async function loadTasks() {
  try {
    tasks = await apiRequest(API_URL);
    renderTasks();
  } catch (error) {
    showMessage('Nie udało się pobrać zadań: ' + error.message);
  }
}

async function addTask(event) {
  event.preventDefault();
  const title = titleInput.value.trim();
  if (!title) {
    showMessage('Treść zadania nie może być pusta.');
    titleInput.focus();
    return;
  }

  try {
    const task = await apiRequest(API_URL, 'POST', { title });
    tasks.unshift(task);
    form.reset();
    hideMessage();
    renderTasks();
  } catch (error) {
    showMessage('Nie udało się dodać zadania: ' + error.message);
  }
}

async function toggleTask(task) {
  try {
    const updated = await apiRequest(`${API_URL}${task.id}/`, 'PATCH', {
      completed: !task.completed,
    });
    tasks = tasks.map((t) => (t.id === updated.id ? updated : t));
    hideMessage();
    renderTasks();
  } catch (error) {
    showMessage('Nie udało się zmienić statusu: ' + error.message);
  }
}

async function deleteTask(task) {
  try {
    await apiRequest(`${API_URL}${task.id}/`, 'DELETE');
    tasks = tasks.filter((t) => t.id !== task.id);
    hideMessage();
    renderTasks();
  } catch (error) {
    showMessage('Nie udało się usunąć zadania: ' + error.message);
  }
}

function setFilter(event) {
  currentFilter = event.currentTarget.dataset.filter;
  filterButtons.forEach((button) => {
    button.classList.toggle('active', button === event.currentTarget);
  });
  renderTasks();
}

form.addEventListener('submit', addTask);
filterButtons.forEach((button) => button.addEventListener('click', setFilter));
document.addEventListener('DOMContentLoaded', loadTasks);
