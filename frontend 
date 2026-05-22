// App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');

  // Fetch all tasks from backend on load
  useEffect(() => {
    axios.get('http://localhost:5000/tasks')
      .then(res => setTasks(res.data));
  }, []);

  // Add a new task
  const addTask = async () => {
    if (!input) return;
    const res = await axios.post('http://localhost:5000/tasks', { text: input });
    setTasks([...tasks, res.data]);
    setInput('');
  };

  // Delete a task
  const deleteTask = async (id) => {
    await axios.delete(`http://localhost:5000/tasks/${id}`);
    setTasks(tasks.filter(t => t._id !== id));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Task Manager</h1>
      <input 
        value={input} 
        onChange={(e) => setInput(e.target.value)} 
        placeholder="Enter a task..."
      />
      <button onClick={addTask}>Add Task</button>
      <ul>
        {tasks.map(t => (
          <li key={t._id}>
            {t.text} 
            <button onClick={() => deleteTask(t._id)} style={{ marginLeft: '10px' }}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
