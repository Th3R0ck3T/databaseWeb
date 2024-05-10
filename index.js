const express = require('express');
const sql = require('mssql');
const path = require('path');
const session = require('express-session');
const cookieParser = require("cookie-parser")
const methodOverride = require('method-override');
const route = require('./Routes/route');

const app = express();

const config = {
    user: 'sa',
    password: 'heslo123',
    server: 'localhost', // Adresa serveru
    database: 'master',
    options: {
        encrypt: false,
        trustedConnection: true,
    }
};


app.use(cookieParser());
app.use(session({
  key: 'user_sid',
  secret: "this is my biggest secret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

app.use(express.static('Public'))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

app.use((req, res, next) => {
    res.locals.currentUser = req.session.userId;
    res.locals.isAdmin = req.session.isAdmin;
    res.locals.isVyvojar = req.session.isVyvojar;
    res.locals.username = req.session.username;

    if(!res.locals.currentUser){
      config.user = "host";
      config.password = "Heslo123";
      console.log("do databaze je prihlaseny host");
    } else if(res.locals.isAdmin) {
      config.user = "sa";
      config.password = "heslo123";
      console.log("do databaze je prihlaseny admin");
    } else {
      config.user = res.locals.username;
      config.password = req.session.password;
      console.log(`do databaze je prihlaseny ${res.locals.username}`);
    }
    // Připojení k SQL Serveru
sql.connect(config, async (err) => {
  if (err) throw err;
  console.log("Connected to SQL Server");
});

    next();
});

sql.connect(config, async (err) => {
  if (err) throw err;
  console.log("Connected to SQL Server");
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/Views'))

// Definice cesty pro získání dat z databáze
app.use('/', route)

const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
