const API_URL='http://localhost:5000/api';
let qrScanner=null;

// Admin login
document.getElementById('loginBtn').addEventListener('click',()=>{
  const user=document.getElementById('adminUser').value.trim();
  const pass=document.getElementById('adminPass').value.trim();
  fetch(`${API_URL}/admin/login`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({username:user,password:pass})
  }).then(r=>r.json()).then(d=>{
    if(d.success){
      document.getElementById('adminLoginCard').style.display='none';
      document.getElementById('adminPanel').style.display='block';
      loadArtists();
      loadTicketHistory();
    } else alert('Hatalı giriş!');
  });
});

// Sanatçı ekle
document.getElementById('addArtistBtn').addEventListener('click',()=>{
  const data={
    name:document.getElementById('artistName').value,
    email:document.getElementById('artistEmail').value,
    phone:document.getElementById('artistPhone').value,
    password:document.getElementById('artistPass').value,
    ticketTarget:parseInt(document.getElementById('artistTarget').value)
  };
  fetch(`${API_URL}/admin/add-artist`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(data)
  }).then(r=>r.json()).then(d=>{
    if(d.success){
      loadArtists();
      clearArtistInputs();
    } else alert(d.message || 'Sanatçı eklenemedi');
  });
});

function clearArtistInputs(){
  document.getElementById('artistName').value='';
  document.getElementById('artistEmail').value='';
  document.getElementById('artistPhone').value='';
  document.getElementById('artistPass').value='';
  document.getElementById('artistTarget').value='';
}

// Sanatçı listesi + silme butonu
function loadArtists(){
  const list=document.getElementById('artistList');
  list.innerHTML='';
  fetch(`${API_URL}/admin/artists`).then(r=>r.json()).then(artists=>{
    artists.forEach(a=>{
      const percent=a.ticketTarget>0 ? Math.floor((a.ticketsSold/a.ticketTarget)*100):0;
      const div=document.createElement('div');
      div.className='card p-2 my-2';
      div.innerHTML=`<strong>${a.name}</strong> (${a.phone})<br>
      Satış: ${a.ticketsSold}/${a.ticketTarget} <div class="progress mt-1"><div class="progress-bar" style="width:${percent}%">${percent}%</div></div>
      <button class="btn btn-sm btn-danger mt-2" onclick="deleteArtist('${a.id}')">Sil</button>`;
      list.appendChild(div);
    });
  });
}

// Sanatçı silme fonksiyonu
function deleteArtist(id){
  if(!confirm('Bu sanatçıyı silmek istediğinizden emin misiniz?')) return;
  fetch(`${API_URL}/admin/artist/${id}`,{method:'DELETE'})
  .then(r=>r.json())
  .then(d=>{
    if(d.success){
      alert('Sanatçı silindi');
      loadArtists();
      loadTicketHistory();
    } else alert(d.message);
  });
}

// QR okut
document.getElementById('startQrBtn').addEventListener('click',()=>{
  if(qrScanner){ qrScanner.stop().catch(()=>{}); qrScanner.clear(); }
  qrScanner=new Html5Qrcode('qr-reader');
  qrScanner.start({facingMode:'environment'},{fps:10, qrbox:250},
    async decoded=>{
      document.getElementById('qr-result').innerText=`Bilet ID: ${decoded}`;
      await verifyTicket(decoded);
      loadTicketHistory();
      qrScanner.stop();
    },
    err=>console.warn(err)
  );
});

async function verifyTicket(ticketId){
  const res=await fetch(`${API_URL}/admin/verify-ticket`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ticketId})
  });
  const result=await res.json();
  alert(result.success?'Bilet doğrulandı':'Hata: '+result.message);
}

// Ticket hafızası
function loadTicketHistory(){
  const tbody=document.getElementById('ticketHistory');
  tbody.innerHTML='';
  fetch(`${API_URL}/admin/tickets`).then(r=>r.json()).then(tickets=>{
    tickets.forEach(t=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>${t.id}</td><td>${t.artistName}</td><td>${t.customerName}</td><td>${new Date(t.createdAt).toLocaleString()}</td>`;
      tbody.appendChild(tr);
    });
  });
}

// Geçmişi temizle
document.getElementById('clearHistory').addEventListener('click',()=>{
  if(!confirm('Geçmişi temizlemek istediğinizden emin misiniz?')) return;
  fetch(`${API_URL}/admin/clear-tickets`,{method:'DELETE'}).then(r=>r.json()).then(d=>{
    if(d.success){
      loadTicketHistory();
      loadArtists();
    }
  });
});
