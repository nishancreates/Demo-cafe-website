/**
 * THE DETOX CLUB — Firebase Data Layer (fb.js)
 * All data goes to Firestore. localStorage is a fast local cache only.
 * Every read: try Firestore first, fall back to cache.
 * Every write: write to Firestore + update cache simultaneously.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection, doc,
  getDoc, getDocs, setDoc, addDoc, deleteDoc, updateDoc,
  query, orderBy, limit,
  serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDY2pN3MaabGoB8C30alX9r5azTjo0OQj8",
  authDomain: "detoxclub-dashboard.firebaseapp.com",
  projectId: "detoxclub-dashboard",
  storageBucket: "detoxclub-dashboard.firebasestorage.app",
  messagingSenderId: "443733326967",
  appId: "1:443733326967:web:70fc6de77f8fac04aa5a72",
  measurementId: "G-0MZK8FDNYL"
};

// ── Init ──
let _app, _db;
function getDB() {
  if (_db) return _db;
  try {
    _app = initializeApp(FIREBASE_CONFIG);
    _db = getFirestore(_app);
    return _db;
  } catch(e) {
    console.warn("Firebase init failed:", e);
    return null;
  }
}

// ── Cache helpers ──
const cache = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
  del(key) {
    try { localStorage.removeItem(key); } catch {}
  }
};

// ── Generic Firestore helpers ──
async function fsGetAll(collName, orderByField = null) {
  const db = getDB();
  if (!db) return null;
  try {
    const ref = collection(db, collName);
    const q = orderByField ? query(ref, orderBy(orderByField)) : ref;
    const snap = await getDocs(q);
    const items = [];
    snap.forEach(d => items.push({ _id: d.id, ...d.data() }));
    return items;
  } catch(e) {
    console.warn(`fsGetAll(${collName}) failed:`, e.message);
    return null;
  }
}

async function fsGetDoc(collName, docId) {
  const db = getDB();
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, collName, docId));
    return snap.exists() ? { _id: snap.id, ...snap.data() } : null;
  } catch(e) { return null; }
}

async function fsSetDoc(collName, docId, data) {
  const db = getDB();
  if (!db) return false;
  try {
    const clean = stripUndefined(data);
    await setDoc(doc(db, collName, docId), { ...clean, _updatedAt: serverTimestamp() }, { merge: true });
    return true;
  } catch(e) {
    console.warn(`fsSetDoc(${collName}/${docId}) failed:`, e.message);
    return false;
  }
}

async function fsAddDoc(collName, data) {
  const db = getDB();
  if (!db) return null;
  try {
    const clean = stripUndefined(data);
    const ref = await addDoc(collection(db, collName), { ...clean, _createdAt: serverTimestamp() });
    return ref.id;
  } catch(e) {
    console.warn(`fsAddDoc(${collName}) failed:`, e.message);
    return null;
  }
}

async function fsDeleteDoc(collName, docId) {
  const db = getDB();
  if (!db) return false;
  try {
    await deleteDoc(doc(db, collName, docId));
    return true;
  } catch(e) { return false; }
}

function stripUndefined(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

// ════════════════════════════════════════════
// MENU
// ════════════════════════════════════════════
const DEFAULT_MENU = [
  {id:'mint-black',name:'Mint Black Tea',tagline:'Clarity',cat:'Core Brews',price:'Rs. 50',priceNum:50,desc:'Cool mint meets bold black tea. A daily ritual of clarity.',img:'images/mint-black.jpg',addons:[],soldOut:false},
  {id:'masala-tea',name:'Masala Tea',tagline:'A Symphony',cat:'Core Brews',price:'Rs. 60',priceNum:60,desc:'A symphony of spices. Warmth brewed to perfection.',img:'images/masala-tea.jpg',addons:[],soldOut:false},
  {id:'coffee',name:'Traditional Coffee',tagline:'The Anchor',cat:'Core Brews',price:'Rs. 100 / 150',priceNum:100,desc:'Rich, grounding, honest. Black or with milk.',img:'images/coffee.jpg',addons:['With Milk +Rs.50'],soldOut:false},
  {id:'english-tea',name:'English Breakfast Tea',tagline:'The Classic',cat:'Core Brews',price:'Rs. 150',priceNum:150,desc:'A cup that never lets you down.',img:'images/english-tea.jpg',addons:[],soldOut:false},
  {id:'kaadaa',name:'Kaa-daa',tagline:'The Rejuvenation',cat:'Warm Detox',price:'Rs. 150',priceNum:150,desc:'Sacred spice blend. Ancient recipe, modern soul.',img:'images/kaadaa.jpg',addons:[],soldOut:false},
  {id:'golden-milk',name:'Golden Mountain Milk',tagline:'The Healing Light',cat:'Warm Detox',price:'Rs. 150',priceNum:150,desc:'Turmeric warmth in a glass.',img:'images/golden-milk.jpg',addons:[],soldOut:false},
  {id:'lemon-ginger',name:'Hot Lemon Ginger Honey',tagline:'Simplicity',cat:'Warm Detox',price:'Rs. 150',priceNum:150,desc:'Bright, alive, and cleansing.',img:'images/lemon-ginger.jpg',addons:[],soldOut:false},
  {id:'apple-spice',name:'Apple Spice Brew',tagline:'Nostalgia',cat:'Warm Detox',price:'Rs. 150',priceNum:150,desc:'Autumn warmth, always.',img:'images/apple-spice.jpg',addons:[],soldOut:false},
  {id:'bel-elixir',name:'Bel Elixir',tagline:'Patience',cat:'Cold Detox',price:'Rs. 300',priceNum:300,desc:'A cooling ancient remedy.',img:'images/bel-elixir.jpg',addons:[],soldOut:false},
  {id:'chlorophyll-juice',name:'Chlorophyll Green Juice',tagline:'Liquid Sunlight',cat:'Cold Detox',price:'Rs. 300',priceNum:300,desc:'Pure alive and green.',img:'images/chlorophyll-juice.jpg',addons:[],soldOut:false},
  {id:'abc-vitality',name:'ABC Vitality',tagline:'Vitality',cat:'Cold Detox',price:'Rs. 300',priceNum:300,desc:"Apple, Beet, Carrot. Nature's power trio.",img:'images/abc-vitality.jpg',addons:[],soldOut:false},
  {id:'matcha',name:'Matcha',tagline:"The Monk's Focus",cat:'Cold Detox',price:'Rs. 350',priceNum:350,desc:'Ceremonial grade matcha.',img:'images/matcha.webp',addons:['Extra Shot +Rs.50'],soldOut:false},
  {id:'detox-breakfast',name:'Detox Breakfast',tagline:'The All-Morning',cat:'Breakfast',price:'Rs. 400 + 120',priceNum:400,desc:'Brown toast, mushrooms, veggies, fruits, eggs.',img:'images/detox-breakfast.jpg',addons:['Add Chicken +Rs.120'],soldOut:false},
  {id:'detox-fruity-pancake',name:'Detox Fruity Pancakes',tagline:'Gentle Indulgence',cat:'Breakfast',price:'Rs. 250 + 100',priceNum:250,desc:'Pancakes with maple, cream, fruits.',img:'images/detox-fruity-pancake.jpg',addons:['Add Yogurt +Rs.70','Add Cream +Rs.100'],soldOut:false},
  {id:'detox-meal',name:'Detox Meal',tagline:'Grounded Nourishment',cat:'Detox Lunch',price:'Rs. 350 + 120',priceNum:350,desc:'Rice, mushrooms, spinach, sesame.',img:'images/detox-meal.jpg',addons:['Add Chicken +Rs.120'],soldOut:false},
  {id:'detox-bake',name:'Detox Bake',tagline:'Earth & Oven',cat:'Detox Lunch',price:'Rs. 250 + 120',priceNum:250,desc:'Baked sweet potato with veggies.',img:'images/detox-bake.jpg',addons:['Add Chicken +Rs.120'],soldOut:false},
  {id:'detox-mash',name:'Detox Mash',tagline:'The Soften',cat:'Detox Lunch',price:'Rs. 350',priceNum:350,desc:'Mashed potatoes, cauli, sauté veggies.',img:'images/detox-mash.jpg',addons:['Add Chicken +Rs.120'],soldOut:false},
  {id:'lunch-bowl',name:'Detox Lunch Bowl',tagline:'Complete',cat:'Detox Lunch',price:'Rs. 350',priceNum:350,desc:'Rice, chicken, mushroom, potato, spinach, sesame.',img:'images/lunch-bowl.jpg',addons:[],soldOut:false},
  {id:'orange-magic',name:'Orange Magic',tagline:'Sunshine',cat:'Sweet Tooth',price:'Rs. 150',priceNum:150,desc:'Orange zest and sweetness.',img:'images/orange-magic.jpg',addons:['Add Cream +Rs.100'],soldOut:false},
  {id:'strawberry-angels',name:'Strawberry Angels',tagline:'Light as Clouds',cat:'Sweet Tooth',price:'Rs. 150',priceNum:150,desc:'Strawberries, cream, joy.',img:'images/strawberry-angels.jpg',addons:['Add Extra Fruits +Rs.100'],soldOut:false},
  {id:'apple-melts',name:'Apple Melts',tagline:'Pure Comfort',cat:'Sweet Tooth',price:'Rs. 150',priceNum:150,desc:'Warm apple caramel.',img:'images/apple-melts.jpg',addons:['Add Cream +Rs.100'],soldOut:false},
];

export async function getMenu() {
  const remote = await fsGetAll('menu');
  if (remote && remote.length > 0) {
    const items = remote.map(r => ({ ...r, id: r.id || r._id }));
    cache.set('detox_menu', items);
    return items;
  }
  // First time — seed Firestore with defaults
  const local = cache.get('detox_menu', DEFAULT_MENU);
  if (local.length > 0 && !(await fsGetAll('menu'))?.length) {
    await seedMenu(local);
  }
  return local;
}

async function seedMenu(items) {
  for (const item of items) {
    await fsSetDoc('menu', item.id, item);
  }
}

export async function saveMenuItem(item) {
  await fsSetDoc('menu', item.id, item);
  const menu = cache.get('detox_menu', DEFAULT_MENU);
  const idx = menu.findIndex(m => m.id === item.id);
  if (idx > -1) menu[idx] = item; else menu.push(item);
  cache.set('detox_menu', menu);
}

export async function deleteMenuItem(id) {
  await fsDeleteDoc('menu', id);
  const menu = cache.get('detox_menu', []).filter(m => m.id !== id);
  cache.set('detox_menu', menu);
}

// ════════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════════
const DEFAULT_SETTINGS = {
  openTime: '10:00',
  closeTime: '20:00',
  announcement: '✦ Welcome to The Detox Club — Walkhu Galli, Lalitpur ✦ Open Daily 10:00 AM – 8:00 PM ✦ 5% off combo meals: 1 drink + 1 food item ✦ Follow & tag us on Instagram for 5% off ✦',
  promos: ['5% off combo meals — 1 drink + 1 food item', 'Follow & tag us on Instagram for 5% off your order'],
  featuredIds: ['matcha', 'detox-breakfast', 'strawberry-angels']
};

export async function getSettings() {
  const remote = await fsGetDoc('settings', 'main');
  if (remote) {
    const s = { ...DEFAULT_SETTINGS, ...remote };
    cache.set('detox_settings', s);
    return s;
  }
  const local = cache.get('detox_settings', DEFAULT_SETTINGS);
  return local;
}

export async function saveSettings(data) {
  const clean = { ...data };
  delete clean._id;
  delete clean._updatedAt;
  await fsSetDoc('settings', 'main', clean);
  cache.set('detox_settings', data);
}

// ════════════════════════════════════════════
// EVENTS
// ════════════════════════════════════════════
export async function getEvents() {
  const remote = await fsGetAll('events', 'date');
  if (remote) {
    const events = remote.map(e => ({ ...e, id: e.id || e._id }));
    cache.set('detox_events', events);
    return events;
  }
  return cache.get('detox_events', []);
}

export async function saveEvent(event) {
  const clean = { ...event };
  delete clean._id;
  await fsSetDoc('events', event.id, clean);
  const events = cache.get('detox_events', []);
  const idx = events.findIndex(e => e.id === event.id);
  if (idx > -1) events[idx] = event; else events.push(event);
  cache.set('detox_events', events);
}

export async function deleteEvent(id) {
  await fsDeleteDoc('events', id);
  cache.set('detox_events', cache.get('detox_events', []).filter(e => e.id !== id));
}

export async function addRsvp(eventId, rsvpData) {
  // Add to rsvps subcollection
  const fsId = await fsAddDoc('rsvps', { ...rsvpData, eventId });
  // Also update event's rsvp count in events doc
  const db = getDB();
  if (db) {
    try {
      const { getDoc, updateDoc, doc: fsDoc, arrayUnion } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
      await updateDoc(fsDoc(db, 'events', eventId), {
        rsvps: arrayUnion({ ...rsvpData, id: fsId || Date.now().toString() })
      });
    } catch(e) { console.warn('Could not update event rsvps array:', e.message); }
  }
  // Update cache
  const events = cache.get('detox_events', []);
  const idx = events.findIndex(e => e.id === eventId);
  if (idx > -1) {
    if (!events[idx].rsvps) events[idx].rsvps = [];
    events[idx].rsvps.push({ ...rsvpData, id: fsId });
    cache.set('detox_events', events);
  }
  return fsId;
}

// ════════════════════════════════════════════
// RESERVATIONS
// ════════════════════════════════════════════
export async function getReservations() {
  const remote = await fsGetAll('reservations', '_createdAt');
  if (remote) {
    const res = remote.map(r => ({ ...r, id: r.id || r._id }));
    cache.set('detox_reservations', res);
    return res;
  }
  return cache.get('detox_reservations', []);
}

export async function saveReservation(data) {
  const id = data.id || 'res-' + Date.now();
  const item = { ...data, id, status: data.status || 'pending' };
  await fsSetDoc('reservations', id, item);
  const existing = cache.get('detox_reservations', []);
  const idx = existing.findIndex(r => r.id === id);
  if (idx > -1) existing[idx] = item; else existing.unshift(item);
  cache.set('detox_reservations', existing.slice(0, 300));
  return id;
}

export async function updateReservationStatus(id, status) {
  await fsSetDoc('reservations', id, { status });
  const res = cache.get('detox_reservations', []);
  const idx = res.findIndex(r => r.id === id);
  if (idx > -1) { res[idx].status = status; cache.set('detox_reservations', res); }
}

// ════════════════════════════════════════════
// DAILY LOG
// ════════════════════════════════════════════
export async function getLogs() {
  const remote = await fsGetAll('logs');
  if (remote) {
    const logs = remote.map(l => ({ ...l, id: l.id || l._id })).sort((a,b) => new Date(a.date) - new Date(b.date));
    cache.set('detox_logs', logs);
    return logs;
  }
  return cache.get('detox_logs', []);
}

export async function addLog(entry) {
  const id = 'log-' + Date.now();
  const item = { ...entry, id };
  await fsSetDoc('logs', id, item);
  const logs = cache.get('detox_logs', []);
  logs.push(item);
  cache.set('detox_logs', logs);
  return id;
}

export async function deleteLog(id) {
  await fsDeleteDoc('logs', id);
  cache.set('detox_logs', cache.get('detox_logs', []).filter(l => l.id !== id));
}

// ════════════════════════════════════════════
// COMMUNITY
// ════════════════════════════════════════════
export async function getCommunity() {
  const remote = await fsGetAll('community');
  if (remote) {
    const msgs = remote.sort((a,b) => (b._createdAt?.seconds||0) - (a._createdAt?.seconds||0));
    cache.set('detox_community', msgs);
    return msgs;
  }
  return cache.get('detox_community', []);
}

export async function addCommunityMessage(data) {
  const fsId = await fsAddDoc('community', data);
  const msgs = cache.get('detox_community', []);
  msgs.unshift({ ...data, _id: fsId });
  cache.set('detox_community', msgs.slice(0, 100));
  return fsId;
}

export async function deleteCommunityMessage(fsId) {
  await fsDeleteDoc('community', fsId);
  cache.set('detox_community', cache.get('detox_community', []).filter(m => m._id !== fsId));
}

// ════════════════════════════════════════════
// GALLERY
// ════════════════════════════════════════════
export async function getGallery() {
  const remote = await fsGetAll('gallery');
  if (remote) {
    const gallery = remote.sort((a,b) => (b._createdAt?.seconds||0) - (a._createdAt?.seconds||0));
    cache.set('detox_gallery', gallery);
    return gallery;
  }
  return cache.get('detox_gallery', []);
}

export async function addGalleryItem(data) {
  const fsId = await fsAddDoc('gallery', data);
  const gallery = cache.get('detox_gallery', []);
  gallery.unshift({ ...data, _id: fsId });
  cache.set('detox_gallery', gallery);
  return fsId;
}

export async function deleteGalleryItem(fsId) {
  await fsDeleteDoc('gallery', fsId);
  cache.set('detox_gallery', cache.get('detox_gallery', []).filter(g => g._id !== fsId));
}

// ════════════════════════════════════════════
// NEWSLETTER
// ════════════════════════════════════════════
export async function addNewsletterSubscriber(email) {
  await fsSetDoc('newsletter', email.replace(/[.@]/g, '_'), { email, subscribedAt: serverTimestamp() });
}

// ════════════════════════════════════════════
// EXPORT cache for pages that need sync fallback
// ════════════════════════════════════════════
export { cache };
