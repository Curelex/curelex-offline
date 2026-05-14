const express   = require('express');
const cors      = require('cors');
const dotenv    = require('dotenv');
const http      = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app    = express();
const server = http.createServer(app);

// ── Socket.io setup ───────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Make io accessible in routes via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  // Patient joins a room for their specific doctor queue
  // Room format: "queue_{clinicId}_{doctorId}_{date}"
  socket.on('join_queue', ({ clinicId, doctorId, date }) => {
    const room = `queue_${clinicId}_${doctorId}_${date}`;
    socket.join(room);
    console.log(`📡 Socket ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Export io for use in routes
module.exports.io = io;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/clinics',    require('./routes/clinics'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/patients',   require('./routes/patients'));
app.use('/api/superadmin', require('./routes/superadmin'));
app.use('/api/queue',      require('./routes/queue'));   // ← NEW

app.get('/', (req, res) => res.json({ message: 'Curelex API running ✅' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));