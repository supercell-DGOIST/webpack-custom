'use strict';

const path = require('path');

const createNoopServiceWorkerMiddleware = (servedPath) => {
	const noopServiceWorkerMiddleware = (req, res, next) => {
    if (req.url === path.posix.join(servedPath, 'service-worker.js')) {
      res.setHeader('Content-Type', 'text/javascript');
      res.send(
        `
        self.addEventListener('install', () => self.skipWaiting());

        self.addEventListener('activate', () => {
          self.clients.matchAll({ type: 'window' }).then(windowClients => {
            for (let windowClient of windowClients) {
              // Force open pages to refresh, so that they have a chance to load the
              // fresh navigation response from the local dev server.
              windowClient.navigate(windowClient.url);
            }
          });
        });
        `
      );
    } else {
      next();
    }
  };
	return noopServiceWorkerMiddleware;
};

module.exports = createNoopServiceWorkerMiddleware;
