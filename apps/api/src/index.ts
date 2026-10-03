import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth';
import { orgRouter } from './routes/org';

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/orgs', orgRouter);

app.get('/', (req, res) => {
  res.json({ message: 'ClubSphere API Foundation (Phase 0/1)' });
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
