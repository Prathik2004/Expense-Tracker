package com.expensetracker.app

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private val frontendUrl = "https://expense-tracker-ramo.vercel.app"
    private val apiUrl = "https://expense-tracker-production-cc79.up.railway.app"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.webViewClient = WebViewClient()
        webView.addJavascriptInterface(AppBridge(), "ExpenseTrackerAndroid")
        webView.loadUrl(frontendUrl)
        setContentView(webView)
    }

    inner class AppBridge {
        @JavascriptInterface
        fun openIndmoney() {
            val token = webView.evaluateJavascript("localStorage.getItem('token')") { value ->
                val cleanToken = value.trim('"')
                startActivityForResult(Intent(this@MainActivity, IndmoneyActivity::class.java).apply {
                    putExtra("authToken", cleanToken)
                    putExtra("apiUrl", apiUrl)
                }, 1001)
            }
        }
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode != 1001 || resultCode != RESULT_OK) return
        val payload = data?.getStringExtra("payload") ?: return
        val token = data.getStringExtra("authToken") ?: return
        thread {
            try {
                val connection = URL("$apiUrl/integrations/indmoney/browser-export/import").openConnection() as HttpURLConnection
                connection.requestMethod = "POST"
                connection.doOutput = true
                connection.setRequestProperty("Authorization", "Bearer $token")
                connection.setRequestProperty("Content-Type", "application/json")
                connection.outputStream.use { it.write(payload.toByteArray()) }
                val success = connection.responseCode in 200..299
                runOnUiThread { Toast.makeText(this, if (success) "INDmoney snapshot saved" else "Snapshot import failed", Toast.LENGTH_SHORT).show() }
            } catch (error: Exception) {
                runOnUiThread { Toast.makeText(this, "Snapshot upload failed", Toast.LENGTH_SHORT).show() }
            }
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }
}
