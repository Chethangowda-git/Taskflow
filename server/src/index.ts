import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis';
import { initSocketServer } from './socket/socketManager';
import { authRouter } from './routes/auth.routes';
import { boardRouter } from './routes/board.routes';
import { columnRouter } from './routes/column.routes';
import { cardRouter } from './routes/card.routes';
import { userRouter } from './routes/user.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();
const httpServer = createServer(app); // wrap express in http server for socket.io

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/boards', boardRouter);
app.use('/api', columnRouter);
app.use('/api', cardRouter);
app.use('/api/users', userRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();
  await connectRedis();
  initSocketServer(httpServer);
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
