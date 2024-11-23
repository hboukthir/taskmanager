document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');
    const clearTasksButton = document.getElementById('clear-tasks');
    
    // Vérifie la disponibilité d'IndexedDB et initialise la base de données
    let db;
    const request = window.indexedDB.open('tasksDB', 1);

    request.onerror = (event) => {
        console.log('Erreur lors de l\'ouverture de la base de données IndexedDB', event);
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        loadTasksFromIndexedDB();
    };

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        const objectStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('taskName', 'taskName', { unique: false });
        objectStore.createIndex('taskDate', 'taskDate', { unique: false });
    };

    // Validation et ajout des tâches
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskName = document.getElementById('task-name').value;
        const taskDate = document.getElementById('task-date').value;

        if (!taskName || !taskDate) {
            alert('Veuillez remplir tous les champs !');
            return;
        }

        const task = {
            taskName,
            taskDate,
            completed: false
        };

        // Ajout de la tâche dans IndexedDB
        const transaction = db.transaction(['tasks'], 'readwrite');
        const objectStore = transaction.objectStore('tasks');
        objectStore.add(task);

        transaction.oncomplete = () => {
            displayTask(task);
        };

        // Sauvegarde dans LocalStorage pour des tâches temporaires
        saveTaskToLocalStorage(task);
        taskForm.reset();
    });

    // Sauvegarde des tâches dans LocalStorage
    function saveTaskToLocalStorage(task) {
        let tasks = localStorage.getItem('tasks') ? JSON.parse(localStorage.getItem('tasks')) : [];
        tasks.push(task);
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Chargement des tâches depuis IndexedDB et affichage dans la liste
    function loadTasksFromIndexedDB() {
        const transaction = db.transaction(['tasks'], 'readonly');
        const objectStore = transaction.objectStore('tasks');
        const request = objectStore.getAll();

        request.onsuccess = (event) => {
            const tasks = event.target.result;
            tasks.forEach((task) => displayTask(task));
        };
    }

    // Affichage des tâches dans la liste
    function displayTask(task) {
        const li = document.createElement('li');
        li.textContent = `${task.taskName} - ${task.taskDate}`;

        const completeButton = document.createElement('button');
        completeButton.textContent = 'Terminé';
        completeButton.addEventListener('click', () => {
            li.style.textDecoration = 'line-through';
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Supprimer';
        deleteButton.addEventListener('click', () => {
            taskList.removeChild(li);
            deleteTaskFromIndexedDB(task.id);
        });

        li.appendChild(completeButton);
        li.appendChild(deleteButton);
        taskList.appendChild(li);
    }

    // Suppression d'une tâche dans IndexedDB
    function deleteTaskFromIndexedDB(id) {
        const transaction = db.transaction(['tasks'], 'readwrite');
        const objectStore = transaction.objectStore('tasks');
        objectStore.delete(id);
    }

    // Suppression de toutes les tâches
    clearTasksButton.addEventListener('click', () => {
        const transaction = db.transaction(['tasks'], 'readwrite');
        const objectStore = transaction.objectStore('tasks');
        objectStore.clear();
        taskList.innerHTML = '';
        localStorage.removeItem('tasks');
    });
});
