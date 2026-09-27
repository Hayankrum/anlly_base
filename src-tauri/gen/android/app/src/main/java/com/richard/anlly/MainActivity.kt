package com.richard.anlly

import android.os.Bundle
import android.os.SystemClock
import android.webkit.WebView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge

class MainActivity : TauriActivity() {
  /**
   * With this on, the system back gesture first walks the WebView history
   * (the pages of the app) and only then reaches the exit guard below.
   */
  override val handleBackNavigation: Boolean = true

  private var webView: WebView? = null
  private var lastBackAt = 0L

  override fun onWebViewCreate(webView: WebView) {
    super.onWebViewCreate(webView)
    this.webView = webView
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    // Registered before super so it sits behind the WebView history callback
    // and never steals the gesture from a page that can still go back.
    registerBackHandler()
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
  }

  private fun registerBackHandler() {
    onBackPressedDispatcher.addCallback(
      this,
      object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() {
          val view = webView
          if (view != null && view.canGoBack()) {
            view.goBack()
            return
          }

          // Nothing left to go back to (home): first gesture warns, second exits.
          val now = SystemClock.elapsedRealtime()
          if (now - lastBackAt < EXIT_WINDOW_MS) {
            finish()
          } else {
            lastBackAt = now
            Toast.makeText(
              this@MainActivity,
              "Pressione voltar novamente para sair",
              Toast.LENGTH_SHORT,
            ).show()
          }
        }
      },
    )
  }

  companion object {
    private const val EXIT_WINDOW_MS = 2500L
  }
}
