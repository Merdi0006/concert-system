const API_URL='http://localhost:5000/api';
let artistId=null;
let ticketTarget=0;
let ticketsSold=0;

document.getElementById('loginBtn').addEventListener('click',()=>{
  const email=document.getElementById('artistEmail').value.trim();
  const pass=document.getElementById('artistPass').value.trim();
  fetch(`${API_URL}/artist/login`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email,password:pass})
  }).then(r=>r.json()).then(d=>{
    if(d.success){
      artistId=d.artistId;
      ticketTarget=d.ticketTarget;
      ticketsSold=d.ticketsSold;
      document.getElementById('artistName').innerText=d.name;
      document.getElementById('artistLoginCard').style.display='none';
      document.getElementById('artistPanel').style.display='block';
      updateProgress();
    } else alert('Hatalı giriş!');
  });
});

// Bilet oluştur
document.getElementById('createTicketBtn').addEventListener('click',()=>{
  const customerName=document.getElementById('customerName').value.trim();
  if(!customerName) return alert('Müşteri adı girin!');
  fetch(`${API_URL}/artist/create-ticket`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({artistId, customerName})
  }).then(r=>r.json()).then(d=>{
    if(d.success){
      ticketsSold++;
      updateProgress();
      document.getElementById('customerName').value='';
      generateQR(d.ticket.id);
    } else alert(d.message || 'Bilet oluşturulamadı');
  });
});

function updateProgress(){
  const percent = ticketTarget>0 ? Math.floor((ticketsSold/ticketTarget)*100):0;
  document.getElementById('progressBar').style.width=percent+'%';
  document.getElementById('progressBar').innerText=percent+'%';
  document.getElementById('progressText').innerText=`${ticketsSold} / ${ticketTarget} bilet satıldı`;
}

// QR oluştur
function generateQR(ticketId){
  const container=document.getElementById('ticketQR');
  container.innerHTML='';
  QRCode.toCanvas(ticketId, {width:200}, (err,canvas)=>{
    if(err) return console.error(err);
    container.appendChild(canvas);
  });
}
