import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Claude
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      claude: !!process.env.CLAUDE_API_KEY,
      rivery: !!process.env.RIVERY_API_TOKEN
    }
  });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@certus.ai' && password === 'certus2025') {
    const token = jwt.sign(
      { userId: 1, email, role: 'admin' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    return res.json({
      success: true,
      token,
      user: { id: 1, email, name: 'Admin', role: 'admin', isAdmin: true }
    });
  }
  
  res.status(401).json({ success: false, error: 'Invalid credentials' });
});

// AI Prediction
app.post('/api/predictions/generate', async (req, res) => {
  try {
    const { headline, primaryCopy, budget } = req.body;
    
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: `Predict ad performance for: "${headline}" - "${primaryCopy}" with budget $${budget}. Return JSON with overallScore, metrics (ctr, cvr, cpc), and forecast.`
      }]
    });
    
    const prediction = JSON.parse(message.content[0].text);
    res.json({ success: true, prediction });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => console.log(`🚀 CERTUS API on port ${PORT}`));
