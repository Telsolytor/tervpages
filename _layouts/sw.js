const CACHE = "pwabuilder-offline";

const offlineFallbackPage = "index.html";


// 判断是否本站资源
function isSameOrigin(request) {
    return new URL(request.url).origin === self.location.origin;
}


// Install
self.addEventListener("install", function (event) {

    event.waitUntil(
        caches.open(CACHE).then(function (cache) {

            return cache.add(offlineFallbackPage);

        })
    );

});


// Activate
self.addEventListener("activate", function (event) {

    event.waitUntil(
        self.clients.claim()
    );

});


// Fetch
self.addEventListener("fetch", function (event) {

    // 只处理 GET
    if (event.request.method !== "GET") {
        return;
    }


    // 外部资源直接放行
    // 例如你的 K-Vault 图床
    if (!isSameOrigin(event.request)) {
        return;
    }


    event.respondWith(

        fetch(event.request)

            .then(function (response) {

                event.waitUntil(
                    updateCache(
                        event.request,
                        response.clone()
                    )
                );

                return response;

            })

            .catch(function () {

                return fromCache(event.request);

            })

    );

});



function fromCache(request) {

    return caches.open(CACHE).then(function (cache) {

        return cache.match(request).then(function (matching) {

            if (!matching || matching.status === 404) {

                return Promise.reject("no-match");

            }

            return matching;

        });

    });

}



function updateCache(request, response) {

    return caches.open(CACHE).then(function (cache) {

        return cache.put(request, response);

    });

}