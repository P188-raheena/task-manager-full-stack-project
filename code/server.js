const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;

const MONGO_URI =
  'mongodb://127.0.0.1:27017/taskdb';

const JWT_SECRET =
  process.env.JWT_SECRET || 'task-manager-secret-key';

// MongoDB connection
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  }
});

const User = mongoose.model('User', userSchema);

// Task Schema
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  completed: {
    type: Boolean,
    default: false
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const Task = mongoose.model('Task', taskSchema);

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: 'Authentication required'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.userId = decoded.userId;

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token'
    });
  }
};

// Home
app.get('/', (req, res) => {
  res.send('Task Manager API is running 🚀');
});

// Signup
app.post('/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'All fields are required'
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({
      message: 'Signup successful'
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Signup failed'
    });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      {
        userId: user._id
      },
      JWT_SECRET,
      {
        expiresIn: '1d'
      }
    );

    res.json({
      token,
      name: user.name
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Login failed'
    });
  }
});

// Get tasks
app.get('/tasks', authenticate, async (req, res) => {
  try {
    const tasks = await Task.find({
      userId: req.userId
    }).sort({
      createdAt: -1
    });

    res.json(tasks);

  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch tasks'
    });
  }
});

// Add task
app.post('/tasks', authenticate, async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        message: 'Task title is required'
      });
    }

    const task = new Task({
      title,
      completed: false,
      userId: req.userId
    });

    await task.save();

    res.status(201).json(task);

  } catch (error) {
    res.status(500).json({
      message: 'Failed to add task'
    });
  }
});

// Edit task
app.put('/tasks/:id', authenticate, async (req, res) => {
  try {
    const { title } = req.body;

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId
      },
      {
        title
      },
      {
        new: true
      }
    );

    if (!task) {
      return res.status(404).json({
        message: 'Task not found'
      });
    }

    res.json(task);

  } catch (error) {
    res.status(500).json({
      message: 'Failed to edit task'
    });
  }
});

// Toggle task
app.patch(
  '/tasks/:id/toggle',
  authenticate,
  async (req, res) => {
    try {
      const task = await Task.findOne({
        _id: req.params.id,
        userId: req.userId
      });

      if (!task) {
        return res.status(404).json({
          message: 'Task not found'
        });
      }

      task.completed = !task.completed;

      await task.save();

      res.json(task);

    } catch (error) {
      res.status(500).json({
        message: 'Failed to update task'
      });
    }
  }
);

// Delete task
app.delete(
  '/tasks/:id',
  authenticate,
  async (req, res) => {
    try {
      const task = await Task.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId
      });

      if (!task) {
        return res.status(404).json({
          message: 'Task not found'
        });
      }

      res.json({
        message: 'Task deleted successfully'
      });

    } catch (error) {
      res.status(500).json({
        message: 'Failed to delete task'
      });
    }
  }
);

// Start server
app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});