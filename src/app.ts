import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import routes from './routes';
import appRegistry from './app.registry';

import User from './models/user.model';
import usersController from './controllers/users.controller';
import config from './config/config';

const app = express();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(
  cors({
    origin: config.clientPublicUrl,
    credentials: true,
  }),
);

// routes
app.use(routes);

// models registration
appRegistry.register('user:model', User);

// controllers registration
appRegistry.register('user:controller', usersController);

app.get('/', (req, res) => {
  res.send('API is running...');
});

export default app;
