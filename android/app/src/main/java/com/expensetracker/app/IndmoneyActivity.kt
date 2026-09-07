package com.expensetracker.app

import android.app.Activity
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.content.Intent
import android.graphics.Color
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.Toast
import org.json.JSONObject
import org.json.JSONTokener

class IndmoneyActivity : Activity() {
    private lateinit var webView: WebView
    private var captureButton: Button? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        captureButton = Button(this).apply {
            text = "Capture portfolio"
            setTextColor(Color.WHITE)
            setBackgroundColor(Color.rgb(37, 99, 235))
            setOnClickListener { capturePage() }
        }
        root.addView(captureButton, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))

        webView = WebView(this)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.userAgentString = webView.settings.userAgentString + " ExpenseTrackerMobile"
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                captureButton?.visibility = android.view.View.VISIBLE
            }
        }
        webView.addJavascriptInterface(CaptureBridge(), "ExpenseTrackerAndroid")
        root.addView(webView, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
        setContentView(root)
        webView.loadUrl("https://www.indmoney.com/dashboard")
    }

    private fun capturePage() {
        captureButton?.text = "Capturing..."
        val script = """
            (() => {
              const clean = value => (value || '').replace(/\\s+/g, ' ').trim();
              const tables = Array.from(document.querySelectorAll('table')).map(table => ({
                headers: Array.from(table.querySelectorAll('thead th')).map(cell => clean(cell.textContent)),
                rows: Array.from(table.querySelectorAll('tbody tr')).map(row => Array.from(row.querySelectorAll('th,td')).map(cell => clean(cell.textContent)))
              })).filter(table => table.rows.length > 0);
              const rows = Array.from(document.querySelectorAll('[role="row"], tr, [data-testid*="holding"], [data-testid*="portfolio"], [class*="holding"], [class*="portfolio"]')).map(el => clean(el.textContent)).filter(Boolean).slice(0, 1000);
              return JSON.stringify({url: location.href, title: document.title, capturedAt: new Date().toISOString(), tables, rows, visibleText: clean(document.body?.innerText).slice(0, 150000)});
            })()
        """.trimIndent()
        webView.evaluateJavascript(script) { encodedJson ->
            val json = JSONTokener(encodedJson).nextValue() as? String
            if (json.isNullOrBlank()) {
                runOnUiThread {
                    captureButton?.text = "Capture portfolio"
                    Toast.makeText(this, "No page data found", Toast.LENGTH_SHORT).show()
                }
                return@evaluateJavascript
            }
            runOnUiThread { CaptureBridge().receiveSnapshot(json) }
        }
    }

    inner class CaptureBridge {
        @JavascriptInterface
        fun receiveSnapshot(json: String) {
            val result = Intent().apply {
                putExtra("payload", json)
                putExtra("authToken", intent.getStringExtra("authToken"))
            }
            setResult(RESULT_OK, result)
            runOnUiThread { Toast.makeText(this@IndmoneyActivity, "Snapshot captured", Toast.LENGTH_SHORT).show() }
            finish()
        }
    }

    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }
}
