const express = require('express');
const fs = require('fs');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const DB_FILE = './db.json';

function readDB() {
  if (!fs.existsSync(DB_FILE)) return { artists: [], tickets: [] };
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

let db = readDB();

// Admin login
const ADMIN = { username: 'admin', password: 'admin123' };
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) return res.json({ success: true });
  res.json({ success: false });
});

// Sanatçı login
app.post('/api/artist/login', (req,res)=>{
  const {email,password} = req.body;
  const artist = db.artists.find(a=>a.email===email && a.password===password);
  if(!artist) return res.json({success:false});
  res.json({success:true, artistId:artist.id, name:artist.name, ticketTarget:artist.ticketTarget, ticketsSold:artist.ticketsSold});
});


// Sanatçı ekle
app.post('/api/admin/add-artist', (req, res) => {
  const { name, email, phone, password, ticketTarget } = req.body;
  if (!name || !email) return res.status(400).json({ success: false, message: 'Eksik bilgi' });
  const artist = { id: uuidv4(), name, email, phone, password, ticketTarget: parseInt(ticketTarget)||0, ticketsSold: 0 };
  db.artists.push(artist);
  writeDB(db);
  res.json({ success: true, artist });
});

// Sanatçı silme
app.delete('/api/admin/artist/:id', (req, res) => {
  const id = req.params.id;
  const index = db.artists.findIndex(a => a.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Sanatçı bulunamadı' });
  db.artists.splice(index, 1);
  db.tickets = db.tickets.filter(t => t.artistId !== id);
  writeDB(db);
  res.json({ success: true });
});

// Sanatçı listesi
app.get('/api/admin/artists', (req, res) => res.json(db.artists));

// Bilet oluştur
app.post('/api/artist/create-ticket', (req, res) => {
  const { artistId, customerName } = req.body;
  const artist = db.artists.find(a => a.id === artistId);
  if (!artist) return res.status(404).json({ success: false, message: "Sanatçı bulunamadı" });
  const ticket = { id: uuidv4(), artistId, customerName, used: false, createdAt: new Date() };
  db.tickets.push(ticket);
  artist.ticketsSold += 1;
  writeDB(db);
  res.json({ success: true, ticket });
});

// QR doğrulama
app.post('/api/admin/verify-ticket', (req, res) => {
  const { ticketId } = req.body;
  const ticket = db.tickets.find(t => t.id === ticketId);
  if (!ticket) return res.status(404).json({ success: false, message: 'Bilet bulunamadı' });
  if (ticket.used) return res.json({ success: false, message: 'Bilet zaten kullanıldı' });
  ticket.used = true;
  writeDB(db);
  res.json({ success: true });
});

// Okunan biletler
app.get('/api/admin/tickets', (req, res) => {
  const tickets = db.tickets.map(t => {
    const artist = db.artists.find(a => a.id === t.artistId);
    return {
      id: t.id,
      artistName: artist ? artist.name : 'Bilinmiyor',
      customerName: t.customerName,
      createdAt: t.createdAt
    };
  });
  res.json(tickets);
});

// Geçmişi temizle
app.delete('/api/admin/clear-tickets', (req, res) => {
  db.tickets = [];
  db.artists.forEach(a => a.ticketsSold = 0);
  writeDB(db);
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Server ${PORT} portunda çalışıyor`));
