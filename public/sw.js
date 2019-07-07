self.addEventListener('install', function (event) {
    // Perform install steps
});

self.addEventListener('push', function (event) {
    console.log('[Service Worker] Push Received.');
    //console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);
    var obj = JSON.parse(event.data.text());



    event.waitUntil(self.registration.showNotification(obj.title, obj.options));
});

self.addEventListener('notificationclick', function (event) {
    console.log('[Service Worker] Notification click Received.');


    event.notification.close();

    event.waitUntil(
        clients.openWindow('http://localhost')
    );
});
