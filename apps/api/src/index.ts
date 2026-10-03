import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth';
import { orgRouter } from './routes/org';
import { merchRouter } from './routes/merch';
import { fundraisingRouter } from './routes/fundraising';
import { financeRouter } from './routes/finance';
import { membershipRouter } from './routes/membership';

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/orgs', orgRouter);
app.use('/api/v1', merchRouter);
app.use('/api/v1', fundraisingRouter);
app.use('/api/v1', financeRouter);
app.use('/api/v1', membershipRouter);

app.get('/', (req, res) => {
  res.json({
    name: 'ClubSphere API',
    version: '1.0.0',
    phases: ['Phase 0: Foundation', 'Phase 1: Auth & Tenancy', 'Phase 2: Membership', 'Phase 6: Merch', 'Phase 7: Fundraising', 'Phase 8: Finance'],
    status: 'online'
  });
});

app.listen(port, () => {
  console.log(`ClubSphere API running on http://localhost:${port}`);
});
