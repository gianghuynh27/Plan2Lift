import express from 'express';

import userModel from './models/user.model';

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.get('/save-user', async (req, res) => {
  const newUser = new userModel({
    username: 'test',
    password: 'testingtesting',
  });

  await newUser.save();

  res.send('User saved successfully');
});

export default app;
