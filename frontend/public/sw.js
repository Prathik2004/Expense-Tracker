self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = typeof payload.title === "string" ? payload.title : "Expensify";
  const body = typeof payload.body === "string" ? payload.body : "You have a new notification.";
  const url = typeof payload.url === "string" && payload.url.startsWith("/") ? payload.url : "/";
  const tag = typeof payload.tag === "string" ? payload.tag : undefined;
  const icon = typeof payload.icon === "string" ? payload.icon : "/icon.svg";
  const image = typeof payload.image === "string" && payload.image.startsWith("/") ? payload.image : undefined;

  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon,
    image,
    tag,
    data: { url }
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/";
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      if ("focus" in client) {
        return client.focus().then(() => client.navigate(url));
      }
    }
    return self.clients.openWindow(url);
  }));
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(self.registration.pushManager.subscribe({ userVisibleOnly: true }).then(() =>
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) =>
      clients.forEach((client) => client.postMessage({ type: "push-subscription-changed" }))
    )
  ));
});
