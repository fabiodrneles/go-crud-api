import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:8080';

// Função para formatar a data para o input type="date" (YYYY-MM-DD)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toISOString().split('T')[0];
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '' });
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState('');

  // Busca as tarefas da API
  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks`);
      // Ordena usando 'created_at' do seu model
      setTasks(response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) || []);
      setError('');
    } catch (err) {
      console.error("Erro ao buscar tarefas:", err);
      setError('Não foi possível carregar as tarefas. O backend está rodando?');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Handler para mudanças nos inputs do formulário de nova tarefa
  const handleNewTaskChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  // Cria uma nova tarefa
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      // Envia o objeto completo da nova tarefa
      await axios.post(`${API_URL}/tasks`, { 
        ...newTask, 
        completed: false,
        // Converte a string da data para o formato que o Go entende (ISO 8601)
        due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null 
      });
      setNewTask({ title: '', description: '', due_date: '' }); // Limpa o formulário
      fetchTasks();
    } catch (err) {
      console.error("Erro ao criar tarefa:", err);
      setError('Falha ao criar a tarefa.');
    }
  };

  // Deleta uma tarefa
  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/tasks/${id}`);
      fetchTasks();
    } catch (err) {
      console.error("Erro ao deletar tarefa:", err);
      setError('Falha ao deletar a tarefa.');
    }
  };

  // Alterna o status 'completed'
  const handleToggleComplete = async (task) => {
    try {
      // Envia o objeto task inteiro com o 'completed' invertido
      await axios.put(`${API_URL}/tasks/${task.id}`, { ...task, completed: !task.completed });
      fetchTasks();
    } catch (err) {
      console.error("Erro ao atualizar tarefa:", err);
      setError('Falha ao atualizar o status da tarefa.');
    }
  };
  
  // Handler para mudanças nos inputs do formulário de edição
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingTask(prev => ({ ...prev, [name]: value }));
  };
  
  // Salva a edição de uma tarefa
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;

    try {
      await axios.put(`${API_URL}/tasks/${editingTask.id}`, {
        ...editingTask,
        due_date: editingTask.due_date ? new Date(editingTask.due_date).toISOString() : null
      });
      setEditingTask(null);
      fetchTasks();
    } catch (err)      {
      console.error("Erro ao atualizar tarefa:", err);
      setError('Falha ao salvar a tarefa.');
    }
  };

  // Renderiza a tarefa (modo de visualização ou edição)
  const renderTask = (task) => {
    const isEditing = editingTask && editingTask.id === task.id;

    return isEditing ? (
      // Modo de Edição
      <li key={task.id} className="task-item editing">
        <form onSubmit={handleUpdateTask} className="edit-task-form">
          <input
            name="title"
            type="text"
            value={editingTask.title}
            onChange={handleEditChange}
            placeholder="Título"
            autoFocus
          />
          <textarea
            name="description"
            value={editingTask.description}
            onChange={handleEditChange}
            placeholder="Descrição"
          />
          <input
            name="due_date"
            type="date"
            value={formatDateForInput(editingTask.due_date)}
            onChange={handleEditChange}
          />
          <div className="edit-task-actions">
            <button type="submit" className="btn-save">Salvar</button>
            <button type="button" onClick={() => setEditingTask(null)} className="btn-cancel">Cancelar</button>
          </div>
        </form>
      </li>
    ) : (
      // Modo de Visualização
      <li key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
        <div className="task-main-content">
          <input 
            type="checkbox"
            className="task-checkbox"
            checked={task.completed}
            onChange={() => handleToggleComplete(task)}
          />
          <div className="task-details">
            <span className="task-title">
              {task.title}
            </span>
            {task.description && <p className="task-description">{task.description}</p>}
            {task.due_date && <p className="task-duedate">Vencimento: {new Date(task.due_date).toLocaleDateString()}</p>}
          </div>
        </div>
        <div className="task-actions">
          <button onClick={() => setEditingTask(task)} className="btn-edit">✏️</button>
          <button onClick={() => handleDeleteTask(task.id)} className="btn-delete">❌</button>
        </div>
      </li>
    );
  };

  return (
    <div className="app-container">
      <header>
        <h1>Gerenciador de Tarefas <br/>(Go + React)</h1>
      </header>
      
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleCreateTask} className="add-task-form">
        <h3>Adicionar Nova Tarefa</h3>
        <input
          name="title"
          type="text"
          value={newTask.title}
          onChange={handleNewTaskChange}
          placeholder="Título da tarefa"
        />
        <textarea
          name="description"
          value={newTask.description}
          onChange={handleNewTaskChange}
          placeholder="Adicione uma descrição..."
        />
        <input
          name="due_date"
          type="date"
          value={newTask.due_date}
          onChange={handleNewTaskChange}
        />
        <button type="submit">Adicionar Tarefa</button>
      </form>

      <ul className="task-list">
        {tasks.length > 0 ? tasks.map(renderTask) : <p>Nenhuma tarefa encontrada. Adicione uma!</p>}
      </ul>
    </div>
  );
}

export default App;