var swRegistration;
if ('serviceWorker' in navigator && 'PushManager' in window) {
    console.log('Service Worker and Push is supported');

    navigator.serviceWorker.register('sw.js')
        .then(function (swReg) {
            console.log('Service Worker is registered', swReg);
            swRegistration = swReg;
            swRegistration.pushManager.getSubscription()
                .then(function (subscription) {
                    isSubscribed = !(subscription === null);

                    if (isSubscribed) {
                        console.log('User IS subscribed.');
                        Cookies.set('push', JSON.stringify(subscription));
                        handleSubscription({
                            subscription: JSON.stringify(subscription)
                        });
                    } else {
                        console.log('User is NOT subscribed.');
                        subscribeUser(swReg);
                    }
                });

        })
        .catch(function (error) {
            console.error('Service Worker Error', error);
        });
} else {
    console.warn('Push messaging is not supported');
    //pushButton.textContent = 'Push Not Supported';
}

const applicationServerPublicKey = "BOwgl5YKUWtkZ34IkuZQzP7-R-Gj03xHez498heSUY17vg48-jgOk7Ux_KdgCG8lQdDXBkEGkAFhkBYKQ_oLyGU";

function subscribeUser(swRegistration) {
    const applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
    swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
        })
        .then(function (subscription) {
            console.log('User is subscribed.');
            handleSubscription(subscription);
            //updateSubscriptionOnServer(subscription);
        })
        .catch(function (err) {
            console.log('Failed to subscribe the user: ', err);

        });
}

function unsubscribeUser(swRegistration) {
    swRegistration.pushManager.getSubscription()
        .then(function (subscription) {
            if (subscription) {
                return subscription.unsubscribe();
            }
        })
        .catch(function (error) {
            console.log('Error unsubscribing', error);
        })
        .then(function () {
            updateSubscriptionOnServer(null);

            console.log('User is unsubscribed.');
            isSubscribed = false;

            updateBtn();
        });
}

function handleSubscription(subscription) {
    $.ajax({
        url: '/pushSubscription',
        method: 'POST',
        data: subscription,
        success: function (data) {
            console.log(data);
        },
        error: function () {
            console.log('error on backend push subscription');
        }
    });
}

function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
