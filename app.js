const express = require('express');
const mysql = require('mysql2');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const port = 3000;

const db = mysql.createConnection({
  host: 'localhost',
  user: 'phpmyadmin',
  password: 'aluno',
  database: 'medical'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL');
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Configurar a sessão
app.use(
  session({
    secret: '122364764836287565',
    resave: true,
    saveUninitialized: true,
  })
);


// READ
app.get('/cadastro', (req, res) => {
     if (req.session.adm) {
      res.render('cadastro');
  } else {
      res.send('Faça login para acessar esta página. <a href="/login">Login</a>');
  }
  });

 app.get('/paciente', (req, res) => {
  if (req.session.gmail) {
   res.render('paciente');
} else {
   res.send('Faça login para acessar esta página. <a href="/login">Login</a>');
}
});

app.get('/medico', (req, res) => {
  db.query('SELECT * FROM consultas', (err, result) => {
    if (err) throw err;
    console.log(`Enviando página médico: ${result}`);
    res.render('medico', { consultas: result });
  });
});



app.get('/', (req, res) => {
  db.query('SELECT * FROM users', (err, result) => {
    if (err) throw err;
    res.render('home', { users: result });
  });
});
app.get('/login', (req, res) => {
  db.query('SELECT * FROM users', (err, result) => {
    if (err) throw err;
    res.render('login', { users: result });
  });
});

app.post('/login', (req, res) => {
  const { Email, pswd } = req.body;

  const query = 'SELECT * FROM users WHERE email = ? AND senha = ?';
  console.log(`${Email} -> ${pswd}`);

  db.query(query, [Email, pswd], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      req.session.loggedin = true;
      req.session.username = Email;
      req.session.medico = false;
      req.session.adm = false;
      req.session.gmail = false;

      // Testa o email para ver se é paciente
      if (Email.indexOf('@gmail') > 0) {
        req.session.adm = true; // Variável .gmail para sinalizar se é paciente ou não
        console.log(`req.session.gmail -> ${req.session.gmail}`);

         // Redireciona para a página do paciente se for paciente
         console.log('Redireciona p/ a pg do paciente');
         res.render('paciente');
      }else if(Email.indexOf('@adm') > 0) {// Testa o email para ver se é adm
        req.session.adm = true; // Variável .adm para sinalizar se é adm ou não
        console.log(`req.session.adm -> ${req.session.adm}`);
        
        // Redireciona para a página de cadastro se for adm
        console.log('Redireciona p/ a pg do cadastro');
        res.render('cadastro');
      } else if (Email.indexOf('@med') > 0) { // Testa o email para ver se é médico
        req.session.medico = true; // Variável .medico para sinalizar se é médico ou não
        console.log(`req.session.medico -> ${req.session.medico}`);
        
        // Redireciona para a página do médico se for médico
        console.log('Redireciona p/ a pg do medico');
        res.redirect('/medico');
        //res.render('medico', {consultas: []});
      } else { // senão vai para HOME
        console.log('Redireciona p/ HOME');
        res.redirect('/');
      }
    } else {
      // res.send('Credenciais incorretas. <a href="/">Tente novamente</a>');
      res.redirect('/incorreta');
    }
  });
});


app.get('/usuario', (req, res) => {
  db.query('SELECT * FROM users', (err, result) => {
    if (err) throw err;
    res.render('usuario', { users: result });
  });
});

app.get('/incorreta', (req, res) => {
  db.query('SELECT * FROM users', (err, result) => {
    if (err) throw err;
    res.render('incorreta', { users: result });
  });
});

app.get('/planos', (req, res) => {
  db.query('SELECT * FROM users', (err, result) => {
    if (err) throw err;
    res.render('planos', { users: result });
  });
});

app.get('/exames', (req, res) => {
  db.query('SELECT * FROM users', (err, result) => {
    if (err) throw err;
    res.render('exames', { users: result });
  });
});

app.get('/realizelogin', (req, res) => {
  db.query('SELECT * FROM users', (err, result) => {
    if (err) throw err;
    res.render('realizelogin', { users: result });
  });
});



// UPDATE
app.post('/update/:id', (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  const sql = 'UPDATE users SET name = ?, email = ? WHERE id = ?';
  db.query(sql, [name, email, id], (err, result) => {
    if (err) throw err;
    res.redirect('/');
  });
});


// READ
app.get('/consultas', (req, res) => {
  db.query('SELECT * FROM consultas', (err, result) => {
    if (err) throw err;
    res.render('consultas', { consultas: result });
  });
});
// READ


// CREATE
app.post('/add', (req, res) => {
  const { Nome, Medico, Especialidade, Data, Hora, name, email, CPF, celular, senha } = req.body;

  if (Nome && Medico && Especialidade && Data && Hora) {
    // Handle consulta insertion
    const consultaSql = 'INSERT INTO consultas (Nome, Medico, Especialidade, Data, Hora) VALUES (?, ?, ?, ?, ?)';
    db.query(consultaSql, [Nome, Medico, Especialidade, Data, Hora], (err, result) => {
      if (err) throw err;
      res.redirect('/consultas');
    });
  } else if (name && email && CPF && celular && senha) {
    // Handle user insertion
    const userSql = 'INSERT INTO users (name, email, CPF, celular, senha) VALUES (?, ?, ?, ?, ?)';
    db.query(userSql, [name, email, CPF, celular, senha], (err, result) => {
      if (err) throw err;
      res.redirect('/usuario');
    });
  } else {
    // Handle invalid request
    res.status(400).send('Invalid request');
  }
});

// Rota para fazer logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
      res.redirect('/');
  });
});

// UPDATE
app.post('/update/:id', (req, res) => {
  const { id } = req.params;
  const { Nome, Medico, Especialidade, Data, Hora } = req.body;

  const sql = 'UPDATE consultas SET Nome = ?, Medico = ?, Especialidade = ?, Data = ?, Hora = ? WHERE id = ?';
  db.query(sql, [Nome, Medico, id, Especialidade, Data, Hora], (err, result) => {
    if (err) throw err;
    res.redirect('/medico');
  });
});

// DELETE
app.get('/delete/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM users WHERE id = ?';
  console.log('Delete usuário')
  db.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.redirect('/');
  });
});

// DELETE
app.get('/deleteConsulta/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM consultas WHERE id = ?';
  console.log('Delete consulta')

  db.query(sql, [id], (err, result) => {
    if (err) throw err;
    res.redirect('/consultas');
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});