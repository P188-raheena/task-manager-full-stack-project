import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000';

function App() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem('token')
  );

  const [showLogin, setShowLogin] = useState(true);
  const [isSignup, setIsSignup] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [message, setMessage] = useState('');

  // Get authentication headers
  const getHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/tasks`,
        getHeaders()
      );

      setTasks(res.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);

      if (error.response?.status === 401) {
        logout();
      }
    }
  };

  // Load tasks after login
  useEffect(() => {
    if (isLoggedIn) {
      fetchTasks();
    }
  }, [isLoggedIn]);

  // Signup
  const signup = async () => {
    if (!name || !email || !password) {
      setMessage('Please fill all fields');
      return;
    }

    try {
      await axios.post(`${API_URL}/auth/signup`, {
        name,
        email,
        password
      });

      setMessage('Signup successful. Please login.');
      setIsSignup(false);
      setName('');
      setPassword('');
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Signup failed'
      );
    }
  };

  // Login
  const login = async () => {
    if (!email || !password) {
      setMessage('Please enter email and password');
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      localStorage.setItem('token', res.data.token);

      setIsLoggedIn(true);
      setShowLogin(false);
      setMessage('');
      setPassword('');
    } catch (error) {
      setMessage(
        error.response?.data?.message || 'Login failed'
      );
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setTasks([]);
    setShowLogin(true);
  };

  // Add task
  const addTask = async () => {
    if (!input.trim()) return;

    try {
      const res = await axios.post(
        `${API_URL}/tasks`,
        {
          title: input
        },
        getHeaders()
      );

      setTasks([...tasks, res.data]);
      setInput('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  // Delete task
  const deleteTask = async (id) => {
    try {
      await axios.delete(
        `${API_URL}/tasks/${id}`,
        getHeaders()
      );

      setTasks(
        tasks.filter((task) => task._id !== id)
      );
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Toggle completed
  const toggleTask = async (id) => {
    try {
      const res = await axios.patch(
        `${API_URL}/tasks/${id}/toggle`,
        {},
        getHeaders()
      );

      setTasks(
        tasks.map((task) =>
          task._id === id ? res.data : task
        )
      );
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Start editing
  const startEdit = (task) => {
    setEditingId(task._id);
    setEditText(task.title);
  };

  // Save edit
  const saveEdit = async (id) => {
    if (!editText.trim()) return;

    try {
      const res = await axios.put(
        `${API_URL}/tasks/${id}`,
        {
          title: editText
        },
        getHeaders()
      );

      setTasks(
        tasks.map((task) =>
          task._id === id ? res.data : task
        )
      );

      setEditingId(null);
      setEditText('');
    } catch (error) {
      console.error('Error editing task:', error);
    }
  };

  // Filter and search
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && !task.completed) ||
      (filter === 'completed' && task.completed);

    return matchesSearch && matchesFilter;
  });

  // Statistics
  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const activeTasks = totalTasks - completedTasks;

  // Login / Signup screen
  if (!isLoggedIn) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authBox}>
          <h1 style={styles.title}>Task Manager</h1>

          <p style={styles.subtitle}>
            Manage your tasks easily
          </p>

          {isSignup && (
            <input
              style={styles.input}
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}

          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {message && (
            <p style={styles.message}>
              {message}
            </p>
          )}

          <button
            style={styles.primaryButton}
            onClick={isSignup ? signup : login}
          >
            {isSignup ? 'Sign Up' : 'Login'}
          </button>

          <button
            style={styles.linkButton}
            onClick={() => {
              setIsSignup(!isSignup);
              setMessage('');
            }}
          >
            {isSignup
              ? 'Already have an account? Login'
              : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Task Manager</h1>
            <p style={styles.subtitle}>
              Organize your day and stay productive
            </p>
          </div>

          <button
            style={styles.logoutButton}
            onClick={logout}
          >
            Logout
          </button>
        </div>

        {/* Statistics */}
        <div style={styles.statsContainer}>

          <div style={styles.statCard}>
            <h2>{totalTasks}</h2>
            <p>Total Tasks</p>
          </div>

          <div style={styles.statCard}>
            <h2>{activeTasks}</h2>
            <p>Active</p>
          </div>

          <div style={styles.statCard}>
            <h2>{completedTasks}</h2>
            <p>Completed</p>
          </div>

        </div>

        {/* Add Task */}
        <div style={styles.addContainer}>
          <input
            style={styles.taskInput}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addTask();
              }
            }}
            placeholder="Enter a new task..."
          />

          <button
            style={styles.primaryButton}
            onClick={addTask}
          >
            Add Task
          </button>
        </div>

        {/* Search */}
        <input
          style={styles.searchInput}
          type="text"
          placeholder="🔍 Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Filters */}
        <div style={styles.filterContainer}>

          <button
            style={
              filter === 'all'
                ? styles.activeFilter
                : styles.filterButton
            }
            onClick={() => setFilter('all')}
          >
            All
          </button>

          <button
            style={
              filter === 'active'
                ? styles.activeFilter
                : styles.filterButton
            }
            onClick={() => setFilter('active')}
          >
            Active
          </button>

          <button
            style={
              filter === 'completed'
                ? styles.activeFilter
                : styles.filterButton
            }
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>

        </div>

        {/* Tasks */}
        <div style={styles.taskList}>

          {filteredTasks.length === 0 ? (
            <p style={styles.emptyMessage}>
              No tasks found.
            </p>
          ) : (
            filteredTasks.map((task) => (

              <div
                key={task._id}
                style={styles.taskCard}
              >

                {editingId === task._id ? (

                  <div style={styles.editContainer}>

                    <input
                      style={styles.editInput}
                      value={editText}
                      onChange={(e) =>
                        setEditText(e.target.value)
                      }
                    />

                    <button
                      style={styles.saveButton}
                      onClick={() =>
                        saveEdit(task._id)
                      }
                    >
                      Save
                    </button>

                    <button
                      style={styles.cancelButton}
                      onClick={() => {
                        setEditingId(null);
                        setEditText('');
                      }}
                    >
                      Cancel
                    </button>

                  </div>

                ) : (

                  <>
                    <div
                      style={styles.taskContent}
                      onClick={() =>
                        toggleTask(task._id)
                      }
                    >

                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() =>
                          toggleTask(task._id)
                        }
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                      />

                      <span
                        style={{
                          ...styles.taskTitle,
                          textDecoration:
                            task.completed
                              ? 'line-through'
                              : 'none',
                          opacity:
                            task.completed ? 0.5 : 1
                        }}
                      >
                        {task.title}
                      </span>

                    </div>

                    <div style={styles.actionContainer}>

                      <button
                        style={styles.editButton}
                        onClick={() =>
                          startEdit(task)
                        }
                      >
                        Edit
                      </button>

                      <button
                        style={styles.deleteButton}
                        onClick={() =>
                          deleteTask(task._id)
                        }
                      >
                        Delete
                      </button>

                    </div>
                  </>

                )}

              </div>

            ))
          )}

        </div>

      </div>
    </div>
  );
}

// Styles
const styles = {
  page: {
    minHeight: '100vh',
    background: '#f4f6f8',
    padding: '30px 15px',
    boxSizing: 'border-box'
  },

  container: {
    maxWidth: '900px',
    margin: '0 auto'
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '25px'
  },

  title: {
    margin: 0,
    fontSize: '32px'
  },

  subtitle: {
    color: '#666',
    marginTop: '5px'
  },

  statsContainer: {
    display: 'flex',
    gap: '15px',
    marginBottom: '25px',
    flexWrap: 'wrap'
  },

  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    flex: '1 1 180px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },

  addContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px'
  },

  taskInput: {
    flex: 1,
    padding: '13px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontSize: '16px'
  },

  searchInput: {
    width: '100%',
    padding: '13px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box',
    marginBottom: '15px'
  },

  filterContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },

  filterButton: {
    padding: '9px 18px',
    border: '1px solid #ccc',
    borderRadius: '20px',
    background: 'white',
    cursor: 'pointer'
  },

  activeFilter: {
    padding: '9px 18px',
    border: 'none',
    borderRadius: '20px',
    background: '#333',
    color: 'white',
    cursor: 'pointer'
  },

  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },

  taskCard: {
    background: 'white',
    padding: '15px',
    borderRadius: '10px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 2px 7px rgba(0,0,0,0.08)'
  },

  taskContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    flex: 1
  },

  taskTitle: {
    fontSize: '16px',
    wordBreak: 'break-word'
  },

  actionContainer: {
    display: 'flex',
    gap: '5px'
  },

  primaryButton: {
    padding: '12px 18px',
    border: 'none',
    borderRadius: '8px',
    background: '#333',
    color: 'white',
    cursor: 'pointer'
  },

  editButton: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },

  deleteButton: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },

  saveButton: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },

  cancelButton: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },

  editContainer: {
    display: 'flex',
    width: '100%',
    gap: '8px'
  },

  editInput: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '6px'
  },

  logoutButton: {
    padding: '10px 15px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },

  emptyMessage: {
    textAlign: 'center',
    color: '#777',
    padding: '30px'
  },

  authContainer: {
    minHeight: '100vh',
    background: '#f4f6f8',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    boxSizing: 'border-box'
  },

  authBox: {
    width: '100%',
    maxWidth: '400px',
    background: 'white',
    padding: '30px',
    borderRadius: '15px',
    boxShadow: '0 3px 15px rgba(0,0,0,0.1)',
    boxSizing: 'border-box'
  },

  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '12px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxSizing: 'border-box'
  },

  linkButton: {
    width: '100%',
    marginTop: '15px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer'
  },

  message: {
    color: '#c00'
  }
};

export default App;