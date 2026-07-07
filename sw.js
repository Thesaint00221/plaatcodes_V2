const cacheName="plaatcodes-v1";

const bestanden=[
"./",
"./index.html",
"./style.css",
"./app.js",
"./data.json"
];


self.addEventListener(
"install",
event=>{
event.waitUntil(
caches.open(cacheName)
.then(cache=>cache.addAll(bestanden))
);
});


self.addEventListener(
"fetch",
event=>{
event.respondWith(
caches.match(event.request)
.then(response=>response || fetch(event.request))
);
});
