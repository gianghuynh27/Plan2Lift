import express from 'express';
import morgan from 'morgan';

import routes from './routes';
import appRegistry from './app.registry';

import User from './models/user.model';
import usersController from './controllers/users.controller';

const app = express();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

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
