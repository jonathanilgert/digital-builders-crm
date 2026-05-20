require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const { requireApiKey } = require('./middleware/auth');
const { rateLimit } = require('./middleware/rateLimit');
const { requireSession, isConfigured: sessionConfigured } = require('./middleware/session');

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());

app.use('/api/auth', require('./routes/auth'));

const messages = require('./routes/messages');

app.use('/api/tasks',      requireSession, require('./routes/tasks'));
app.use('/api/events',     requireSession, require('./routes/events'));
app.use('/api/hours',      requireSession, require('./routes/hours'));
app.use('/api/projects',   requireSession, require('./routes/projects'));
app.use('/api/activities', requireSession, require('./routes/activities'));
app.use('/api/messages',   requireSession, messages.humanRouter);

app.use('/api/integrations/messages', rateLimit, requireApiKey, messages.agentRouter);
app.use('/api/integrations',          rateLimit, requireApiKey, require('./routes/integrations'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  const integrationStatus = process.env.OPENCLAW_API_KEY ? 'enabled' : 'disabled (set OPENCLAW_API_KEY)';
  const sessionStatus = sessionConfigured() ? 'enabled' : 'disabled (set JWT_SECRET and APP_PASSWORD)';
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Session auth: ${sessionStatus}`);
  console.log(`Integrations API: ${integrationStatus}`);
});
