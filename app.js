var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var jugadorouter = require('./routes/jugador')
var usuariorouter = require('./routes/usuario')
// var cancharouter = require('./routes/cancha')
var gruporouter = require('./routes/grupo')
var espaciorouter = require('./routes/espacioDeportivo')
var serviciorouter = require('./routes/servicios')
var reservarouter = require('./routes/reserva')
var noticiarouter = require('./routes/noticia')

var invitacionrouter = require('./routes/invitacion')

var db = require('./conexions/mongo');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.options('*', cors()); // Permitir preflight para todas las rutas
app.use(cors({
  origin: "*", // O reemplaza con 'http://localhost:50512' si es necesario
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', cors(), express.static('uploads'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use('/api',jugadorouter );

app.use('/api',usuariorouter );

// app.use('/api',cancharouter );


app.use('/api',invitacionrouter );


app.use('/api',gruporouter );


app.use('/api/espacio',espaciorouter );

app.use('/api',serviciorouter );


app.use('/api/reservas',reservarouter );

app.use('/api',noticiarouter );



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  if (req.originalUrl.startsWith('/api')) {
    res.json({ error: err.message });
  } else {
    res.render('error');
  }
});

module.exports = app;
