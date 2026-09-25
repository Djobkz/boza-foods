(() => {
  const C = window.BOZA_CONFIG || {};
  const configured = C.SUPABASE_URL && !C.SUPABASE_URL.includes("PASTE_") &&
                     C.SUPABASE_ANON_KEY && !C.SUPABASE_ANON_KEY.includes("PASTE_");
  const sb = configured ? window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY) : null;

  const MENU = {
    "Burger":[["Chicken burger",250],["Cheese burger",300],["Double cheese",450],["Smoked burger",550],["Smash burger",650]],
    "Tacos":[["Poulet",400],["Foie",450],["Viande",500],["Mixte",550]],
    "Fajitas":[["Poulet",350],["Foie",400],["Viande",550],["Mixte",500]],
    "Sandwichs":[["Poulet",300],["Foie",400],["Viande",450],["Mixte",450],["4 fromage",500],["Boza sandwich",650]],
    "Suppléments":[["Œuf",50],["Gruyère",100],["Gouda",100],["Mozzarella",100],["Camembert",100],["Kiri",150],["Poulet fumé",100],["Frites",100],["Viande",150],["Fromage rouge",100]],
    "Boissons":[["Canette",100],["Eau minérale 50cl",30],["Gazeuse 1L",150],["Eau minérale 1L",50]]
  };
  const CATEGORIES=Object.keys(MENU);
  let category="Burger", cart=[], orderType="sur_place", nextNo=null, channel=null;

  const $=id=>document.getElementById(id);
  const money=n=>Number(n||0).toLocaleString("fr-FR")+" DA";
  const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

  function showApp(){ $("login").hidden=true; $("appArea").hidden=false; }
  function showLogin(){ $("login").hidden=false; $("appArea").hidden=true; }

  function renderCategories(){
    $("categories").innerHTML=CATEGORIES.map(c=>`<button class="category ${c===category?"active":""}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("");
    $("categories").querySelectorAll("[data-cat]").forEach(b=>b.onclick=()=>{category=b.dataset.cat;renderCategories();renderMenu();});
  }

  function renderMenu(){
    const items=MENU[category];
    let html=items.map(([name,price])=>`<button class="menuItem" data-add="${escapeHtml(name)}" data-price="${price}"><strong>${escapeHtml(name)}</strong><span class="price">${money(price)}</span></button>`).join("");
    if(["Burger","Tacos","Fajitas","Sandwichs"].includes(category)){
      html+=`<button class="menuItem" data-menu150><strong>Menu : frites + soda</strong><span class="price">+150 DA avec le dernier article</span></button>`;
    }
    $("menu").innerHTML=html;
    $("menu").querySelectorAll("[data-add]").forEach(b=>b.onclick=()=>addItem(b.dataset.add,Number(b.dataset.price)));
    const menuBtn=$("menu").querySelector("[data-menu150]");
    if(menuBtn) menuBtn.onclick=()=>applyMenuToLast();
  }

  function addItem(name,price){ cart.push({id:crypto.randomUUID(),name,basePrice:price,price,qty:1,mods:[]});renderCart(); }
  function applyMenuToLast(){
    if(!cart.length){ alert("Ajoute d'abord un article principal."); return; }
    const x=cart[cart.length-1];
    if(!x.menu){x.menu=true;x.price+=150;renderCart();}
    else alert("Le dernier article est déjà en menu.");
  }
  function renderCart(){
    if(!cart.length){$("cart").innerHTML='<div class="cartEmpty">Aucun article.</div>';$("total").textContent="0 DA";return;}
    $("cart").innerHTML=cart.map((x,i)=>`
      <div class="cartItem">
        <div class="cartTitle"><div><strong>${escapeHtml(x.name)}${x.menu?" + Menu":""}</strong><div class="muted">${escapeHtml(x.mods.join(" · ")||"Standard")}</div></div><strong>${money(x.price*x.qty)}</strong></div>
        <div class="qty"><button data-minus="${i}">−</button><span>${x.qty}</span><button data-plus="${i}">+</button><button class="remove" data-remove="${i}">Supprimer</button></div>
        <div class="mods">
          ${["Sans laitue","Sans tomates","Sans épices"].map(m=>`<label><input type="checkbox" data-mod="${i}" data-value="${m}" ${x.mods.includes(m)?"checked":""}> ${m}</label>`).join("")}
        </div>
      </div>`).join("");
    $("cart").querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>{let i=+b.dataset.minus;cart[i].qty=Math.max(1,cart[i].qty-1);renderCart();});
    $("cart").querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>{cart[+b.dataset.plus].qty++;renderCart();});
    $("cart").querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{cart.splice(+b.dataset.remove,1);renderCart();});
    $("cart").querySelectorAll("[data-mod]").forEach(i=>i.onchange=()=>{let x=cart[+i.dataset.mod],m=i.dataset.value;if(i.checked&&!x.mods.includes(m))x.mods.push(m);if(!i.checked)x.mods=x.mods.filter(v=>v!==m);renderCart();});
    $("total").textContent=money(cart.reduce((s,x)=>s+x.price*x.qty,0));
  }

  async function getNextNo(){
    if(!sb){$("nextOrderNo").textContent="1";return;}
    const {data,error}=await sb.rpc("next_order_number");
    if(error){console.error(error);$("nextOrderNo").textContent="—";return;}
    nextNo=data;$("nextOrderNo").textContent=data;
  }

  function orderPayload(no){
    const total=cart.reduce((s,x)=>s+x.price*x.qty,0);
    return {order_number:no,order_type:orderType,total,status:"new",
      items:cart.map(x=>({name:x.name,qty:x.qty,unit_price:x.price,menu:!!x.menu,modifications:x.mods}))};
  }

  async function saveOrder(){
    if(!cart.length){$("orderMsg").textContent="Ajoute au moins un article.";return;}
    if(!sb){$("orderMsg").textContent="Configure d'abord Supabase dans config.js.";return;}
    $("sendOrder").disabled=true;$("orderMsg").textContent="";
    const no=nextNo || 1, payload=orderPayload(no);
    const {error}=await sb.from("orders").insert(payload);
    $("sendOrder").disabled=false;
    if(error){$("orderMsg").textContent="Erreur: "+error.message;return;}
    cart=[];renderCart();$("orderMsg").textContent=`Commande #${no} enregistrée — ${orderType==="sur_place"?"Sur place":"À emporter"}.`;
    await getNextNo();await loadHistory();await loadKitchen();
  }

  async function loadKitchen(){
    if(!sb){$("kitchenOrders").innerHTML='<p class="muted">Configure Supabase pour activer la cuisine en temps réel.</p>';return;}
    const {data,error}=await sb.from("orders").select("*").in("status",["new","preparing"]).order("created_at",{ascending:true});
    if(error){$("kitchenOrders").innerHTML='<p class="error">'+escapeHtml(error.message)+'</p>';return;}
    $("kitchenOrders").innerHTML=data.length?data.map(renderKitchenCard).join(""):'<p class="muted">Aucune commande en attente.</p>';
    bindStatusButtons();
  }

  function renderKitchenCard(o){
    const badge=o.order_type==="sur_place"?'Sur place':'À emporter';
    const status=o.status==="new"?"Nouvelle":"En préparation";
    const cls=o.status==="new"?"red":"orange";
    return `<article class="orderCard">
      <div class="topline"><strong>#${o.order_number}</strong><span class="badge ${cls}">${status}</span></div>
      <p><span class="badge">${badge}</span> <strong>${money(o.total)}</strong></p>
      <ul>${(o.items||[]).map(x=>`<li><strong>${x.qty}× ${escapeHtml(x.name)}</strong>${x.menu?" + menu":""}${x.modifications?.length?" — "+escapeHtml(x.modifications.join(", ")):""}</li>`).join("")}</ul>
      <div class="statusButtons">
        ${o.status==="new"?`<button data-status="${o.id}" data-value="preparing">Préparer</button>`:""}
        <button data-status="${o.id}" data-value="ready">Prêt</button>
      </div>
    </article>`;
  }

  function bindStatusButtons(){
    $("kitchenOrders").querySelectorAll("[data-status]").forEach(b=>b.onclick=async()=>{
      const {error}=await sb.from("orders").update({status:b.dataset.value}).eq("id",b.dataset.status);
      if(error) alert(error.message); else {await loadKitchen();await loadHistory();}
    });
  }

  async function loadHistory(){
    if(!sb){$("historyOrders").innerHTML='<p class="muted">Configure Supabase pour activer l’historique partagé.</p>';return;}
    const {data,error}=await sb.from("orders").select("*").order("created_at",{ascending:false}).limit(100);
    if(error){$("historyOrders").innerHTML='<p class="error">'+escapeHtml(error.message)+'</p>';return;}
    $("historyOrders").innerHTML=data.length?data.map(o=>`
      <div class="historyRow"><div class="topline"><strong>#${o.order_number}</strong><strong>${money(o.total)}</strong></div>
      <div class="muted">${o.order_type==="sur_place"?"Sur place":"À emporter"} · ${new Date(o.created_at).toLocaleString("fr-FR")} · ${escapeHtml(o.status)}</div>
      <div>${(o.items||[]).map(x=>`${x.qty}× ${escapeHtml(x.name)}${x.modifications?.length?" ("+escapeHtml(x.modifications.join(", "))+")":""}`).join(" · ")}</div></div>`).join(""):'<p class="muted">Aucune commande.</p>';
  }

  function subscribe(){
    if(!sb)return;
    if(channel)sb.removeChannel(channel);
    channel=sb.channel("boza-orders").on("postgres_changes",{event:"*",schema:"public",table:"orders"},()=>{loadKitchen();loadHistory();getNextNo();}).subscribe();
  }

  async function login(){
    if(!sb){$("loginMsg").textContent="Configure config.js avec tes clés Supabase.";return;}
    const {error}=await sb.auth.signInWithPassword({email:$("email").value,password:$("password").value});
    if(error){$("loginMsg").textContent=error.message;return;}
    showApp();await boot();
  }

  async function boot(){renderCategories();renderMenu();renderCart();await getNextNo();await loadKitchen();await loadHistory();subscribe();}

  document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");document.querySelectorAll(".tabPanel").forEach(x=>x.hidden=true);$(b.dataset.tab+"Tab").hidden=false;});
  $("dineIn").onclick=()=>{orderType="sur_place";$("dineIn").classList.add("active");$("takeaway").classList.remove("active");};
  $("takeaway").onclick=()=>{orderType="emporter";$("takeaway").classList.add("active");$("dineIn").classList.remove("active");};
  $("clearCart").onclick=()=>{cart=[];renderCart();};
  $("sendOrder").onclick=saveOrder;$("refreshKitchen").onclick=loadKitchen;$("refreshHistory").onclick=loadHistory;$("loginBtn").onclick=login;

  if(sb){sb.auth.getSession().then(({data})=>{if(data.session){showApp();boot();}});$("connection").textContent="● Connecté";}
  else {$("connection").textContent="● Configuration requise";$("loginMsg").textContent="Le projet est prêt. Ajoute tes clés Supabase dans config.js.";showLogin();}
})();
