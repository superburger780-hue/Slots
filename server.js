const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'users.json');

// ДАННЫЕ ЕДИНСТВЕННОГО АДМИНА (Можете поменять на свои)
const ADMIN_LOGIN = 'admin';
const ADMIN_PASS = '7777';

function loadUsers() {
  let users = {};
  if (fs.existsSync(DB_FILE)) {
    users = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  }
  // Гарантируем, что аккаунт админа всегда существует в базе
  if (!users[ADMIN_LOGIN]) {
    users[ADMIN_LOGIN] = {
      username: ADMIN_LOGIN,
      password: ADMIN_PASS,
      balance: 999999,
      isAdmin: true,
      winChance: 80,
      lastSeen: 0
    };
    saveUsers(users);
  }
  return users;
}

function saveUsers(users) {
  fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
}

// Создаем файл базы с админом сразу при запуске сервера
loadUsers();

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(path.join(__dirname, 'index.html')));
    return;
  }

  if (req.url === '/api' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const data = JSON.parse(body);
      const users = loadUsers();
      res.writeHead(200, { 'Content-Type': 'application/json' });

      if (data.action === 'auth') {
        const { mode, login, pass } = data;
        if (mode === 'register') {
          if (login.toLowerCase() === ADMIN_LOGIN.toLowerCase() || users[login]) {
            return res.end(JSON.stringify({ ok: false, err: 'Этот логин занят или зарезервирован' }));
          }
          // Все новые регистрации — строго обычные игроки
          users[login] = {
            username: login,
            password: pass,
            balance: 1000,
            isAdmin: false,
            winChance: 45,
            lastSeen: Date.now()
          };
          saveUsers(users);
          return res.end(JSON.stringify({ ok: true, user: users[login] }));
        } else {
          if (!users[login] || users[login].password !== pass) {
            return res.end(JSON.stringify({ ok: false, err: 'Неверный логин или пароль' }));
          }
          users[login].lastSeen = Date.now();
          saveUsers(users);
          return res.end(JSON.stringify({ ok: true, user: users[login] }));
        }
      }

      if (data.action === 'sync') {
        const u = users[data.login];
        if (!u) return res.end(JSON.stringify({ ok: false }));
        if (typeof data.balance === 'number') u.balance = data.balance;
        u.lastSeen = Date.now();
        saveUsers(users);
        return res.end(JSON.stringify({ ok: true, user: u, allUsers: u.isAdmin ? users : null }));
      }

      if (data.action === 'adminUpdate') {
        const admin = users[data.adminLogin];
        const target = users[data.targetLogin];
        if (admin && admin.isAdmin && target) {
          target.balance = data.balance;
          target.winChance = data.winChance;
          saveUsers(users);
        }
        return res.end(JSON.stringify({ ok: true, allUsers: users }));
      }
    });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущен на порту ${PORT}. Админ: ${ADMIN_LOGIN} / ${ADMIN_PASS}`);
});
