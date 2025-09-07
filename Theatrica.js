/* ===========================
   UTIL & STORAGE (modular API)
=========================== */
const store = {
  get:k=>JSON.parse(localStorage.getItem(k)||'null'),
  set:(k,v)=>localStorage.setItem(k,JSON.stringify(v)),
  push:(k,v)=>{const a=store.get(k)||[]; a.push(v); store.set(k,a);},
};
const fmt = n => '₱'+(Number(n)||0).toLocaleString('en-PH',{minimumFractionDigits:2});
const id = ()=>'id-'+Math.random().toString(36).slice(2,9);

/* Seed Data (Database Design) */
(function seed(){
  if(store.get('seeded')) return;
  const products = [
    // Tickets
    {id:id(),name:'Movie Ticket — Standard',cat:'Tickets',attr:'Standard',price:280,img:'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop'},
    {id:id(),name:'Movie Ticket — VIP Recliner',cat:'Tickets',attr:'VIP',price:520,img:'https://images.unsplash.com/photo-1517602302552-471fe67acf66?q=80&w=1200&auto=format&fit=crop'},
    {id:id(),name:'Group Ticket Package (4)',cat:'Tickets',attr:'Standard',price:999,img:'https://images.unsplash.com/photo-1498925008800-019c7d59d903?q=80&w=1200&auto=format&fit=crop'},
    {id:id(),name:'Fast Pass / Skip‑the‑Line',cat:'Tickets',attr:'VIP',price:120,img:'https://images.unsplash.com/photo-1452697620382-f6543ead73b5?q=80&w=1200&auto=format&fit=crop'},
    // Snacks
    {id:id(),name:'Regular Popcorn',cat:'Snacks',attr:'',price:120,img:'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop'},
    {id:id(),name:'Popcorn + Drink Combo',cat:'Snacks',attr:'Combo',price:199,img:'https://images.unsplash.com/photo-1516214104703-d870798883c5?q=80&w=1200&auto=format&fit=crop'},
    {id:id(),name:'Family Snack Set',cat:'Snacks',attr:'Combo',price:499,img:'https://images.unsplash.com/photo-1478147427282-58a87a120781?q=80&w=1200&auto=format&fit=crop'},
    {id:id(),name:'Coffee / Hot Chocolate',cat:'Snacks',attr:'',price:130,img:'https://images.unsplash.com/photo-1498804103079-a6351b050096?q=80&w=1200&auto=format&fit=crop'},
    // Merch
    {id:id(),name:'Movie T‑Shirt',cat:'Merch',attr:'Standard',price:699,img:'https://images.unsplash.com/photo-1520975940471-7f55f2b8b3a8?q=80&w=1200&auto=format&fit=crop'},
    {id:id(),name:'Limited Edition Poster',cat:'Merch',attr:'',price:450,img:'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1200&auto=format&fit=crop'},
    {id:id(),name:'Theatrica Collectible Mug',cat:'Merch',attr:'',price:320,img:'https://images.unsplash.com/photo-1523365280197-f1783db9fe62?q=80&w=1200&auto=format&fit=crop'}
  ];
  store.set('products', products);
  store.set('orders', []);
  store.set('users', [{id:id(),email:'user@demo.com',pass:'demo',name:'Demo User',addr:'',phone:'',wishlist:[],notifs:[]}]);
  store.set('admin', {email:'admin@theatrica.io',pass:'admin',token:''});
  store.set('inventory', products.map(p=>({pid:p.id,stock:20,status:'active'})));
  store.set('cms',{About:'We love cinemas.',Contact:'Message us via Support.',FAQ:'VIP gets free refunds.',Privacy:'We respect your data.'});
  store.set('settings',{currency:'PHP',ship:'pickup',pay:'gcash'});
  store.set('audit',[]);
  store.set('reviews',[]);
  store.set('seeded',true);
})();

/* ===========================
   UI ROUTER
=========================== */
const ui = {
  show(which){
    for(const el of document.querySelectorAll('#views > div')) el.classList.add('hide');
    document.querySelector('#view-'+which).classList.remove('hide');
    for(const b of document.querySelectorAll('nav button')) b.classList.remove('active');
    (document.querySelector('#nav'+which[0].toUpperCase()+which.slice(1))||{}).classList?.add('active');
    if(which==='catalog') catalog.render();
    if(which==='home') home.render();
    if(which==='cart') cart.render();
    if(which==='orders') orders.render();
    if(which==='account') account.show('login');
    if(which==='admin') admin.show('login');
  },
  search(){
    document.getElementById('cat').value='';
    catalog.render(document.getElementById('q').value.trim());
    ui.show('catalog');
  },
  quick(cat){ document.getElementById('cat').value=cat; catalog.render(); },
  toast(msg){ alert(msg); },
};
window.addEventListener('load', ()=>{ home.render(); ui.show('home'); account.refreshBanner(); });

/* ===========================
   HOME
=========================== */
const home = {
  render(){
    const list = document.getElementById('homeHighlights');
    const data = store.get('products').slice(0,6);
    list.innerHTML = data.map(p=>card(p)).join('');
  }
}

/* ===========================
   CATALOG + DETAIL + REVIEWS
=========================== */
const catalog = {
  render(query=''){
    const q = (query || document.getElementById('q').value).toLowerCase();
    const cat = document.getElementById('cat').value;
    const attr = document.getElementById('filterAttr').value;
    const sort = document.getElementById('sort').value;
    let data = store.get('products').filter(p =>
      (!cat || p.cat===cat) &&
      (!attr || p.attr===attr) &&
      (!q || p.name.toLowerCase().includes(q))
    );
    const key = {pop:'id',new:'-id',name:'name',priceAsc:'price',priceDesc:'-price'}[sort];
    data.sort((a,b)=>{
      const k = key.startsWith('-')?key.slice(1):key;
      const dir = key.startsWith('-')?-1:1;
      return (a[k]>b[k]?1:-1)*dir;
    });
    document.getElementById('catalogList').innerHTML = data.map(p=>card(p)).join('');
  },
  detail(pid){
    const p = store.get('products').find(x=>x.id===pid);
    const inv = store.get('inventory').find(i=>i.pid===pid)||{stock:0,status:'inactive'};
    const el = document.getElementById('detail');
    el.innerHTML = `
      <div class="row">
        <img src="${p.img}" style="width:320px;height:220px;object-fit:cover;border-radius:12px;border:1px solid #1f2937" />
        <div style="flex:1">
          <h2 style="margin:0">${p.name}</h2>
          <div class="row"><span class="tag">${p.cat}</span><span class="tag">${p.attr||'—'}</span></div>
          <div class="price" style="margin:8px 0">${fmt(p.price)}</div>
          <div class="muted mini">Stock: ${inv.stock} • Status: ${inv.status}</div>
          <div class="row" style="margin-top:10px">
            <input id="qty" type="number" min="1" value="1" style="width:100px" />
            <input id="note" placeholder="Seat row, add‑ons, size…" />
            <button class="btn" onclick="cart.add('${p.id}')">Add to Cart</button>
            <button class="btn sec" onclick="wishlist.add('${p.id}')">♡ Wishlist</button>
          </div>
        </div>
      </div>`;
    reviews.render(pid);
    ui.show('detail');
  }
};
function card(p){
  return `<div class="card">
    <img src="${p.img}" alt="">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
      <div><b>${p.name}</b><br><span class="muted mini">${p.cat} • ${p.attr||'—'}</span></div>
      <div class="price">${fmt(p.price)}</div>
    </div>
    <div class="row" style="margin-top:8px">
      <button class="btn" onclick="catalog.detail('${p.id}')">View</button>
      <button class="btn sec" onclick="cart.add('${p.id}',1,true)">Quick add</button>
    </div>
  </div>`;
}

/* Reviews */
const reviews = {
  render(pid){
    const all = store.get('reviews').filter(r=>r.pid===pid);
    const box = document.getElementById('reviews');
    box.innerHTML = all.length? all.map(r=>`<div class="card"><b>${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</b> — ${r.text} <span class="muted mini">by ${r.user||'Anon'}</span></div>`).join(''): `<div class="muted mini">No reviews yet. Be the first!</div>`;
    document.getElementById('addReview').dataset.pid = pid;
  },
  submit(){
    const pid = document.getElementById('addReview').dataset.pid;
    const stars = +document.getElementById('revStars').value;
    const text = document.getElementById('revText').value.trim();
    if(!text) return ui.toast('Please add a short review.');
    store.push('reviews',{id:id(),pid,stars,text,user:(store.get('session')||{}).email||'Guest',ts:Date.now()});
    reviews.render(pid);
    admin.refreshKPIs();
    document.getElementById('revText').value='';
  }
}

/* ===========================
   CART + CHECKOUT + ORDERS
=========================== */
const cart = {
  add(pid,qty=1,quiet=false){
    const q = qty || +document.getElementById('qty')?.value || 1;
    const note = document.getElementById('note')?.value||'';
    const items = store.get('cart')||[];
    const existing = items.find(i=>i.pid===pid && i.note===note);
    existing? existing.qty+=q : items.push({id:id(),pid,qty:q,note});
    store.set('cart',items);
    document.getElementById('cartCount').textContent = (items.reduce((s,i)=>s+i.qty,0));
    if(!quiet) ui.toast('Added to cart');
  },
  render(){
    const items = store.get('cart')||[];
    const prods = store.get('products');
    const dom = document.getElementById('cartItems');
    if(!items.length){ dom.innerHTML='<div class="muted">Your cart is empty.</div>'; document.getElementById('cartSubtotal').textContent=fmt(0); return; }
    dom.innerHTML = items.map(i=>{
      const p = prods.find(x=>x.id===i.pid);
      return `<div class="card row">
        <img src="${p.img}" style="width:90px;height:70px;object-fit:cover;border-radius:8px;border:1px solid #1f2937">
        <div style="flex:1"><b>${p.name}</b><div class="muted mini">${p.cat} • ${p.attr||'—'}</div>
        <input value="${i.note||''}" oninput="cart.note('${i.id}',this.value)" class="mini" /></div>
        <input type="number" min="1" value="${i.qty}" style="width:80px" oninput="cart.qty('${i.id}',this.value)">
        <div class="price">${fmt(p.price*i.qty)}</div>
        <button class="btn bad" onclick="cart.remove('${i.id}')">Remove</button>
      </div>`
    }).join('');
    document.getElementById('cartSubtotal').textContent = fmt(cart.total());
    checkout.preview();
  },
  qty(iid,v){ const items=store.get('cart')||[]; const it=items.find(x=>x.id===iid); it.qty=+v||1; store.set('cart',items); cart.render();},
  note(iid,v){ const items=store.get('cart')||[]; const it=items.find(x=>x.id===iid); it.note=v; store.set('cart',items); },
  remove(iid){ let items=store.get('cart')||[]; items=items.filter(x=>x.id!==iid); store.set('cart',items); cart.render();},
  total(){ const items=store.get('cart')||[]; const prods=store.get('products'); return items.reduce((s,i)=>s+(prods.find(p=>p.id===i.pid).price*i.qty),0); }
};

const checkout = {
  step(n){
    ['co1','co2','co3'].forEach((id,i)=>document.getElementById(id).classList.toggle('hide',i!==n-1));
    ['step1','step2','step3'].forEach((id,i)=>document.getElementById(id).classList.toggle('on',i===n-1));
    if(n===3) checkout.preview();
  },
  preview(){
    const items=store.get('cart')||[]; const prods=store.get('products');
    const li = items.map(i=>{const p=prods.find(x=>x.id===i.pid);return `<li>${i.qty}× ${p.name} — ${fmt(p.price*i.qty)} <span class="muted mini">${i.note||''}</span></li>`}).join('');
    const ship = document.getElementById('shipMethod').value||'pickup';
    const pay = document.getElementById('payMethod').value||'gcash';
    document.getElementById('reviewBlock').innerHTML = `
      <div class="card">
        <b>Items</b><ul>${li}</ul>
        <div><b>Subtotal:</b> ${fmt(cart.total())}</div>
        <div><b>Shipping:</b> ${ship==='3pl'?fmt(79):fmt(0)} (${ship})</div>
        <div><b>To Pay:</b> ${fmt(cart.total()+(ship==='3pl'?79:0))}</div>
        <div class="muted mini">Payment: ${pay.toUpperCase()} • Email: ${document.getElementById('payEmail').value||'—'}</div>
      </div>`;
  },
  place(){
    const user = store.get('session');
    const order = {
      id:id(), items:store.get('cart')||[], total:cart.total(),
      ship:{name:val('shipName'),phone:val('shipPhone'),addr:val('shipAddr'),method:val('shipMethod')},
      pay:{method:val('payMethod'),email:val('payEmail')}, status:'Pending', ts:Date.now(),
      user:user?user.email:'guest'
    };
    if(!order.items.length) return ui.toast('Cart is empty.');
    store.push('orders', order);
    // Inventory decrement + event-driven notifications
    const inv = store.get('inventory');
    order.items.forEach(i=>{ const j=inv.find(x=>x.pid===i.pid); if(j){ j.stock=Math.max(0,j.stock-i.qty); if(j.stock<=3) admin.lowStockAlert(j.pid);} });
    store.set('inventory',inv);
    store.set('cart',[]);
    admin.audit(`ORDER ${order.id} placed by ${order.user}`);
    account.notify(order.user, `Order ${order.id} confirmed`, `Thanks! Track status in Orders.`);
    ui.toast('Order placed! A confirmation has been sent.');
    cart.render(); orders.render(); ui.show('orders');
  }
}
function val(id){return document.getElementById(id).value;}

/* Orders page */
const orders = {
  render(){
    const t = document.getElementById('orderTable');
    const me = (store.get('session')||{}).email;
    const all = store.get('orders').filter(o=>!me || o.user===me);
    t.innerHTML = `<tr><th>Order</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr>`+
      all.map(o=>`<tr>
        <td>${o.id}<div class="mini muted">${new Date(o.ts).toLocaleString()}</div></td>
        <td>${o.items.map(i=>store.get('products').find(p=>p.id===i.pid).name+' ×'+i.qty).join('<br>')}</td>
        <td>${fmt(o.total)}</td>
        <td>${o.status}</td>
        <td><button class="btn sec mini" onclick="orders.track('${o.id}')">Track</button></td>
      </tr>`).join('');
  },
  track(oid){
    const o = store.get('orders').find(x=>x.id===oid);
    ui.toast(`Tracking ${oid}: ${o.status} → (Processing → Shipped → Delivered).`);
  }
}

/* ===========================
   ACCOUNT (login/profile/wishlist/notifications)
=========================== */
const account = {
  show(tab){
    ['acct-login','acct-profile','acct-wishlist','acct-notifications'].forEach(x=>document.getElementById(x).classList.add('hide'));
    document.getElementById('acct-'+tab).classList.remove('hide');
    ['acctTab1','acctTab2','acctTab3','acctTab4'].forEach(el=>document.getElementById(el).classList.remove('on'));
    ({login:'acctTab1',profile:'acctTab2',wishlist:'acctTab3',notifications:'acctTab4'})[tab] && document.getElementById(({login:'acctTab1',profile:'acctTab2',wishlist:'acctTab3',notifications:'acctTab4'})[tab]).classList.add('on');

    if(tab==='profile') account.load();
    if(tab==='wishlist') wishlist.render();
    if(tab==='notifications') account.renderNotifs();
  },
  refreshBanner(){
    const s = store.get('session');
    document.getElementById('who').textContent = s? (s.email.split('@')[0]) : 'Sign in';
    document.getElementById('cartCount').textContent = (store.get('cart')||[]).reduce((s,i)=>s+i.qty,0);
  },
  login(){
    const email = val('loginEmail'), pass = val('loginPass');
    const user = (store.get('users')||[]).find(u=>u.email===email && u.pass===pass);
    if(!user) return ui.toast('Invalid credentials');
    store.set('session', user);
    account.refreshBanner(); account.show('profile');
    admin.audit(`USER ${email} logged in`);
  },
  register(){
    const email = val('loginEmail'); const pass = val('loginPass')||'demo';
    if(!email) return ui.toast('Enter an email');
    if((store.get('users')||[]).some(u=>u.email===email)) return ui.toast('User exists');
    const u = {id:id(),email,pass,name:'',addr:'',phone:'',wishlist:[],notifs:[]};
    store.push('users',u); store.set('session',u); account.refreshBanner(); account.show('profile');
    admin.audit(`USER ${email} registered`);
  },
  load(){
    const s = store.get('session'); if(!s) return ui.toast('Please login first.');
    document.getElementById('profName').value = s.name||''; document.getElementById('profAddr').value=s.addr||''; document.getElementById('profPhone').value=s.phone||'';
  },
  save(){
    let s = store.get('session'); if(!s) return;
    const users = store.get('users'); const u = users.find(x=>x.id===s.id);
    Object.assign(u,{name:val('profName'),addr:val('profAddr'),phone:val('profPhone')});
    store.set('users',users); store.set('session',u);
    document.getElementById('acctMsg').textContent='Saved ✔';
    admin.audit(`USER ${u.email} updated profile`);
  },
  logout(){ localStorage.removeItem('session'); account.refreshBanner(); ui.show('home'); },
  renderNotifs(){
    const s = store.get('session'); const box = document.getElementById('notifList');
    const items = (s?.notifs)||[];
    box.innerHTML = items.length? items.map(n=>`<div class="card"><b>${n.title}</b><div class="muted mini">${n.body}</div></div>`).join('') : '<div class="muted mini">No notifications yet.</div>';
  },
  notify(email,title,body){
    const users = store.get('users');
    const u = users.find(x=>x.email===email);
    if(!u) return;
    u.notifs.push({id:id(),title,body,ts:Date.now()});
    store.set('users',users);
  }
}
const wishlist = {
  add(pid){
    const s = store.get('session'); if(!s) return ui.toast('Login to save wishlist.');
    const users = store.get('users'); const u = users.find(x=>x.id===s.id);
    if(!u.wishlist.includes(pid)) u.wishlist.push(pid);
    store.set('users',users); account.show('wishlist');
  },
  render(){
    const s = store.get('session'); const list = document.getElementById('wishList');
    if(!s) return list.innerHTML='<div class="muted mini">Login to view wishlist.</div>';
    const data = store.get('products').filter(p=>s.wishlist.includes(p.id));
    list.innerHTML = data.length? data.map(p=>card(p)).join(''):'<div class="muted mini">No items yet.</div>';
  }
}

/* ===========================
   SUPPORT / CONTACT
=========================== */
const support = {
  send(){
    document.getElementById('supStatus').textContent = 'Thanks! We will reply via email.';
    admin.audit(`SUPPORT message from ${val('supEmail')||val('supName')||'guest'}`);
  }
}

/* ===========================
   ADMIN (secure-ish mock)
=========================== */
const admin = {
  require(){ const a=store.get('admin'); if(!a.token){ ui.toast('Admin login required'); return false } return true; },
  show(tab){
    // show admin view
    document.querySelectorAll('#view-admin .grid > div').forEach(d=>d.classList.add('hide'));
    document.getElementById('admin-'+tab).classList.remove('hide');
    document.querySelectorAll('#view-admin .tabs button').forEach(b=>b.classList.remove('on'));
    document.getElementById('adTab-'+(tab==='login'?'login':({products:'prod',orders:'orders',inventory:'inv',users:'users',cms:'cms',settings:'sets',reports:'reps',notify:'notif',audit:'audit'}[tab]))).classList.add('on');

    if(tab==='products' && this.require()) this.renderProducts();
    if(tab==='orders' && this.require()) this.renderOrders();
    if(tab==='inventory' && this.require()) this.renderInventory();
    if(tab==='users' && this.require()) this.renderUsers();
    if(tab==='cms' && this.require()) this.renderCMS();
    if(tab==='settings' && this.require()) this.renderSettings();
    if(tab==='reports' && this.require()) this.refreshKPIs();
    if(tab==='notify' && this.require()) this.renderNotifs();
    if(tab==='audit' && this.require()) this.renderAudit();
  },
  login(){
    const {email,pass} = store.get('admin');
    if(val('adEmail')===email && val('adPass')===pass){ const t=id(); store.set('admin',{email,pass,token:t}); ui.toast('Welcome, admin'); this.show('products'); this.audit('ADMIN login'); }
    else ui.toast('Invalid admin credentials');
  },
  audit(msg){ store.push('audit',{id:id(),msg,ts:Date.now()}); },
  renderAudit(){
    const box = document.getElementById('auditList');
    const data = (store.get('audit')||[]).slice().reverse();
    box.innerHTML = data.map(a=>`<div class="card mini"><b>${new Date(a.ts).toLocaleString()}</b> — ${a.msg}</div>`).join('');
  },
  renderProducts(){
    const t = document.getElementById('adminProdTable');
    const data = store.get('products');
    t.innerHTML = `<tr><th>Name</th><th>Cat</th><th>Attr</th><th>Price</th><th></th></tr>`+
      data.map(p=>`<tr>
        <td><input value="${p.name}" oninput="admin.upd('${p.id}','name',this.value)"></td>
        <td><input value="${p.cat}" oninput="admin.upd('${p.id}','cat',this.value)"></td>
        <td><input value="${p.attr}" oninput="admin.upd('${p.id}','attr',this.value)"></td>
        <td><input type="number" value="${p.price}" oninput="admin.upd('${p.id}','price',+this.value)"></td>
        <td><button class="btn bad mini" onclick="admin.delProduct('${p.id}')">Delete</button></td>
      </tr>`).join('');
  },
  addProduct(){
    const p={id:id(),name:val('pName'),price:+val('pPrice')||0,cat:val('pCat'),attr:val('pAttr'),img:val('pImg')||'https://picsum.photos/seed/theatrica/800/600'};
    if(!p.name) return ui.toast('Name required');
    const prods=store.get('products'); prods.push(p); store.set('products',prods);
    const inv=store.get('inventory'); inv.push({pid:p.id,stock:10,status:'active'}); store.set('inventory',inv);
    this.audit(`PRODUCT added: ${p.name}`); this.renderProducts(); catalog.render();
  },
  upd(pid,k,v){ const prods=store.get('products'); Object.assign(prods.find(p=>p.id===pid),{[k]:v}); store.set('products',prods); this.audit(`PRODUCT ${pid} updated: ${k}`); },
  delProduct(pid){ store.set('products',store.get('products').filter(p=>p.id!==pid)); store.set('inventory',store.get('inventory').filter(i=>i.pid!==pid)); this.audit(`PRODUCT ${pid} deleted`); this.renderProducts(); catalog.render(); },
  renderOrders(){
    const t=document.getElementById('adminOrderTable'); const data=store.get('orders');
    t.innerHTML = `<tr><th>Order</th><th>User</th><th>Total</th><th>Status</th><th>Ops</th></tr>`+
      data.map(o=>`<tr>
        <td>${o.id}</td><td>${o.user}</td><td>${fmt(o.total)}</td>
        <td>
          <select onchange="admin.setOrder('${o.id}',this.value)">
            ${['Pending','Processing','Shipped','Delivered','Cancelled','Refunded'].map(s=>`<option ${o.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </td>
        <td>
          <button class="btn mini" onclick="admin.print('${o.id}')">Print</button>
          <button class="btn warn mini" onclick="admin.refund('${o.id}')">Refund</button>
        </td>
      </tr>`).join('');
  },
  setOrder(idv,status){ const orders=store.get('orders'); const o=orders.find(x=>x.id===idv); o.status=status; store.set('orders',orders); this.audit(`ORDER ${idv} -> ${status}`); orders && window.orders.render(); },
  print(oid){ const o=store.get('orders').find(x=>x.id===oid); const w=window.open(); w.document.write(`<pre>${JSON.stringify(o,null,2)}</pre>`); w.print(); this.audit(`ORDER ${oid} printed`); },
  refund(oid){ this.setOrder(oid,'Refunded'); ui.toast('Refund initiated.'); },
  renderInventory(){
    const t=document.getElementById('invTable'); const inv=store.get('inventory'), prods=store.get('products');
    t.innerHTML = `<tr><th>Product</th><th>Stock</th><th>Status</th><th>Adjust</th></tr>`+
      inv.map(i=>`<tr>
        <td>${prods.find(p=>p.id===i.pid)?.name||i.pid}</td>
        <td>${i.stock}</td>
        <td>
          <select onchange="admin.invSet('${i.pid}','status',this.value)">
            ${['active','inactive','out of stock'].map(s=>`<option ${i.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
        </td>
        <td><input type="number" style="width:90px" placeholder="+/‑ qty" onkeydown="if(event.key==='Enter'){admin.invAdjust('${i.pid}',+this.value);this.value='';}"></td>
      </tr>`).join('');
    const lows = inv.filter(x=>x.stock<=3);
    const box=document.getElementById('lowStock'); box.classList.toggle('hide',!lows.length);
    box.innerHTML = lows.length? ('⚠ Low stock: '+lows.map(x=>prods.find(p=>p.id===x.pid).name).join(', ')) : 'All good.';
  },
  invAdjust(pid,delta){ const inv=store.get('inventory'); const i=inv.find(x=>x.pid===pid); i.stock=Math.max(0,i.stock+(delta||0)); store.set('inventory',inv); this.audit(`INVENTORY ${pid} adjusted by ${delta}`); this.renderInventory(); },
  invSet(pid,k,v){ const inv=store.get('inventory'); Object.assign(inv.find(x=>x.pid===pid),{[k]:v}); store.set('inventory',inv); this.audit(`INVENTORY ${pid} ${k}=${v}`); },
  lowStockAlert(pid){ const msg = `Low stock for ${store.get('products').find(p=>p.id===pid).name}`; this.audit('ALERT '+msg); },
  renderUsers(){
    const t=document.getElementById('userTable'); const users=store.get('users');
    t.innerHTML = `<tr><th>Email</th><th>Name</th><th>Phone</th><th>Ops</th></tr>`+
      users.map(u=>`<tr><td>${u.email}</td><td>${u.name||''}</td><td>${u.phone||''}</td><td><button class="btn warn mini" onclick="admin.suspend('${u.id}')">Suspend</button></td></tr>`).join('');
  },
  suspend(uid){ this.audit(`USER ${uid} suspended`); ui.toast('User suspended (mock)'); },
  renderCMS(){
    const box=document.getElementById('cmsList'); const cms=store.get('cms');
    box.innerHTML = Object.entries(cms).map(([k,v])=>`<div class="card"><b>${k}</b><div class="muted mini">${v}</div></div>`).join('');
  },
  savePage(){ const cms=store.get('cms'); cms[val('cmsPage')||'Page']=val('cmsContent'); store.set('cms',cms); this.audit(`CMS page saved: ${val('cmsPage')}`); this.renderCMS(); },
  renderSettings(){ const s=store.get('settings'); document.getElementById('setCurrency').value=s.currency; document.getElementById('setShip').value=s.ship; document.getElementById('setPay').value=s.pay; },
  saveSettings(){ const s={currency:val('setCurrency'),ship:val('setShip'),pay:val('setPay')}; store.set('settings',s); this.audit('SETTINGS updated'); ui.toast('Settings saved'); },
  refreshKPIs(){
    const orders=store.get('orders'); const rev=orders.filter(o=>o.status!=='Refunded').reduce((s,o)=>s+o.total,0);
    const rating=store.get('reviews').reduce((s,r)=>s+r.stars,0)/(store.get('reviews').length||1);
    document.getElementById('kpiRevenue').textContent = fmt(rev);
    document.getElementById('kpiOrders').textContent = orders.length;
    document.getElementById('kpiRating').textContent = rating.toFixed(1);
    document.getElementById('kpiUsers').textContent = (store.get('users')||[]).length;
  },
  renderNotifs(){ document.getElementById('adminNotifList').innerHTML = (store.get('users')||[]).map(u=>`<div class="card mini"><b>${u.email}</b> — ${u.notifs.length} notifications</div>`).join(''); },
  broadcast(){ const title=val('nTitle'), body=val('nBody'); (store.get('users')||[]).forEach(u=>account.notify(u.email,title,body)); this.audit(`NOTIFY broadcast: ${title}`); ui.toast('Broadcast sent'); this.renderNotifs(); }
}

/* ===========================
   LITTLE ENHANCEMENTS
=========================== */
document.addEventListener('click', e=>{
  if(e.target.closest('[data-pid]')) catalog.detail(e.target.closest('[data-pid]').dataset.pid);
});