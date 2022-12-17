const path = require('path');

const express = require('express');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');

// const database = require('./database/connect'); TO DO delete this?
const apiRoutes = require('./apiRoutes');
const userRoutes = require('./userRoutes');

const app = express();

app.use(cookieSession({
  name: 'session',
  keys: ['key1']
}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// /api/endpoints
const apiRouter = express.Router();
const properties = require('./database/properties');
const reservations = require('./database/reservations');

apiRoutes(apiRouter, properties, reservations);
app.use('/api', apiRouter);

// /user/endpoints
const userRouter = express.Router();
const users = require('./database/users');

userRoutes(userRouter, users);
app.use('/users', userRouter);

app.use(express.static(path.join(__dirname, '../public')));

app.get("/test", (req, res) => {
  res.send("🤗");
});

const port = process.env.PORT || 3000;
app.listen(port, (err) => console.log(err || `listening on port ${port} 😎`));
