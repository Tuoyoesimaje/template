const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'backend', port: PORT });
});

app.listen(PORT, () => {
  console.log(`Backend test server running on port ${PORT}`);
});