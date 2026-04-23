import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker in production only
if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        let hasRefreshedForUpdate = false;

        const triggerUpdateCheck = async (registration: ServiceWorkerRegistration) => {
            try {
                await registration.update();
            } catch (error) {
                console.log('SW update check failed: ', error);
            }
        };

        const wireRegistration = (registration: ServiceWorkerRegistration) => {
            if (registration.waiting) {
                registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            registration.addEventListener('updatefound', () => {
                const installingWorker = registration.installing;
                if (!installingWorker) return;

                installingWorker.addEventListener('statechange', () => {
                    if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        installingWorker.postMessage({ type: 'SKIP_WAITING' });
                    }
                });
            });

            window.addEventListener('focus', () => {
                void triggerUpdateCheck(registration);
            });

            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    void triggerUpdateCheck(registration);
                }
            });

            window.setInterval(() => {
                void triggerUpdateCheck(registration);
            }, 60_000);
        };

        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (hasRefreshedForUpdate) return;
            hasRefreshedForUpdate = true;
            window.location.reload();
        });

        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('SW registered: ', registration);
            wireRegistration(registration);
        }).catch(registrationError => {
            console.log('SW registration failed: ', registrationError);
        });
    });
}
