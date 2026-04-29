const express = require('express');
const cors = require('cors');
const path = require('path');

const { requireApiKey } = require('./middleware/auth');
const { rateLimit } = require('./middleware/rateLimit');

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '256kb' }));

app.use('/api/tasks',      require('./routes/tasks'));
app.use('/api/events',     require('./routes/events'));
app.use('/api/hours',      require('./routes/hours'));
app.use('/api/projects',   require('./routes/projects'));
app.use('/api/activities', require('./routes/activities'));

app.use('/api/integrations', rateLimit, requireApiKey, require('./routes/integrations'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  const integrationStatus = process.env.OPENCLAW_API_KEY ? 'enabled' : 'disabled (set OPENCLAW_API_KEY)';
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Integrations API: ${integrationStatus}`);
});
