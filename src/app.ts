import express from 'express';
import morgan from 'morgan';

import routes from './routes';

const app = express();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// routes
app.use(routes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

export default app;
