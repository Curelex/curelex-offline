const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/clinics',    require('./routes/clinics'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/patients',   require('./routes/patients'));
app.use('/api/superadmin', require('./routes/superadmin'));

app.get('/', (req, res) => res.json({ message: 'Curelex API running ✅' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));