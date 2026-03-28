import UIKit
import Capacitor
import WebKit
import AuthenticationServices

class OmniBridgeViewController: CAPBridgeViewController, WKScriptMessageHandler, ASWebAuthenticationPresentationContextProviding {
    private var authSession: ASWebAuthenticationSession?

    override open func viewDidLoad() {
        super.viewDidLoad()
        installPasskeyInterception()
    }

    deinit {
        webView?.configuration.userContentController.removeScriptMessageHandler(forName: "omniAuth")
    }

    private func installPasskeyInterception() {
        guard let webView = webView else { return }

        let controller = webView.configuration.userContentController
        controller.removeScriptMessageHandler(forName: "omniAuth")
        controller.add(self, name: "omniAuth")

        let js = """
        (function() {
          if (window.__omniCapPasskeyPatched) return;
          window.__omniCapPasskeyPatched = true;

          // Intercept direct WebAuthn calls
          if (window.navigator && window.navigator.credentials && window.navigator.credentials.get) {
            const originalGet = window.navigator.credentials.get.bind(window.navigator.credentials);
            window.navigator.credentials.get = function(options) {
              try {
                if (options && options.publicKey) {
                  window.webkit.messageHandlers.omniAuth.postMessage({
                    action: 'passkey_login',
                    currentUrl: window.location.href
                  });
                  return new Promise(() => {});
                }
              } catch (e) {}
              return originalGet(options);
            };
          }

          // Intercept Privy passkey button taps
          document.addEventListener('click', function(e) {
            try {
              const el = e.target && (e.target.closest ? e.target.closest('button,[role=\"button\"],a') : null);
              if (!el) return;
              const txt = ((el.innerText || el.textContent || '') + '').toLowerCase().trim();
              if (txt.includes('i have a passkey') || txt === 'passkey' || txt.includes('use passkey')) {
                e.preventDefault();
                e.stopPropagation();
                window.webkit.messageHandlers.omniAuth.postMessage({
                  action: 'passkey_login',
                  currentUrl: window.location.href
                });
              }
            } catch (err) {}
          }, true);

          console.log('[OMNI Capacitor] Passkey interception patch applied');
        })();
        """

        let script = WKUserScript(source: js, injectionTime: .atDocumentEnd, forMainFrameOnly: false)
        controller.addUserScript(script)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "omniAuth",
              let body = message.body as? [String: Any],
              let action = body["action"] as? String else { return }

        if action == "passkey_login" {
            let currentUrl = (body["currentUrl"] as? String) ?? "https://orimolty-lang.github.io/universal-wallet-web/"
            guard let url = URL(string: currentUrl) else { return }
            openNativeAuth(url: url)
        }
    }

    private func openNativeAuth(url: URL) {
        authSession?.cancel()
        authSession = nil

        let session = ASWebAuthenticationSession(url: url, callbackURLScheme: nil) { [weak self] _, error in
            if let err = error as NSError? {
                print("[OMNI Capacitor] ASWebAuth ended: \(err.localizedDescription) code=\(err.code)")
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                self?.webView?.reload()
            }
        }
        session.prefersEphemeralWebBrowserSession = false
        session.presentationContextProvider = self

        authSession = session
        _ = session.start()
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        return view.window ?? ASPresentationAnchor()
    }
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
