const axios = require('axios');

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const NVIDIA_BASE_URL = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!NVIDIA_API_KEY) {
    return res.status(500).json({ error: 'NVIDIA_API_KEY not configured' });
  }

  const path = req.url.replace('/api/proxy', '');

  // Health check
  if (path === '/health') {
    return res.status(200).json({ status: 'healthy' });
  }

  // Handle chat completions
  if (path === '/v1/chat/completions' && req.method === 'POST') {
    try {
      const response = await axios.post(
        `${NVIDIA_BASE_URL}/chat/completions`,
        req.body,
        {
          headers: {
            'Authorization': `Bearer ${NVIDIA_API_KEY}`,
            'Content-Type': 'application/json'
          },
          responseType: req.body.stream ? 'stream' : 'json'
        }
      );

      if (req.body.stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        response.data.pipe(res);
      } else {
        res.status(200).json(response.data);
      }
    } catch (error) {
      const status = error.response?.status || 500;
      const message = error.response?.data || { error: error.message };
      res.status(status).json(message);
    }
  }
  // Handle models list
  else if (path === '/v1/models' && req.method === 'GET') {
    try {
      const response = await axios.get(
        `${NVIDIA_BASE_URL}/models`,
        {
          headers: {
            'Authorization': `Bearer ${NVIDIA_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      res.status(200).json(response.data);
    } catch (error) {
      const status = error.response?.status || 500;
      const message = error.response?.data || { error: error.message };
      res.status(status).json(message);
    }
  } else {
    res.status(404).json({ error: 'Not found' });
  }
};
