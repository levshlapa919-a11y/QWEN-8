package app.golda.mesenger;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.app.DownloadManager;
import android.os.Environment;
import android.content.Context;
import android.webkit.*;

public class Main extends Activity {
    static final String URL = "https://appassets.androidplatform.net/assets/www/index.html";
    androidx.webkit.WebViewAssetLoader loader;
    WebView w;
    ValueCallback<Uri[]> cb;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        if (Build.VERSION.SDK_INT >= 23) requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO, Manifest.permission.CAMERA}, 1);
        w = new WebView(this);
        setContentView(w);
        loader = new androidx.webkit.WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new androidx.webkit.WebViewAssetLoader.AssetsPathHandler(this)).build();
        WebSettings s = w.getSettings();
        s.setUserAgentString(s.getUserAgentString() + " GoldaApp/1.3");
        s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(true); s.setAllowContentAccess(true); s.setDatabaseEnabled(true);
        CookieManager.getInstance().setAcceptCookie(true);
        w.setBackgroundColor(0xFF050B07);
        w.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return loader.shouldInterceptRequest(r.getUrl());
            }
            @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r.isForMainFrame() && !r.getUrl().getHost().equals("appassets.androidplatform.net")) v.loadUrl("file:///android_asset/offline.html");
            }
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (u.getHost() != null && (u.getHost().equals("appassets.androidplatform.net") || u.getHost().endsWith("supabase.co"))) return false;
                startActivity(new Intent(Intent.ACTION_VIEW, u)); return true;
            }
        });
        w.setWebChromeClient(new WebChromeClient() {
            @Override public void onPermissionRequest(PermissionRequest r) { runOnUiThread(() -> r.grant(r.getResources())); }
            @Override public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> c, FileChooserParams p) {
                if (cb != null) cb.onReceiveValue(null);
                cb = c;
                try { startActivityForResult(p.createIntent(), 7); } catch (Exception e) { cb = null; return false; }
                return true;
            }
        });
        w.setDownloadListener((url, ua, cd, mime, len) -> {
            try {
                DownloadManager.Request q = new DownloadManager.Request(Uri.parse(url));
                q.setMimeType(mime); q.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                q.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, URLUtil.guessFileName(url, cd, mime));
                ((DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE)).enqueue(q);
            } catch (Exception e) { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); }
        });
        w.loadUrl(URL);
    }

    @Override protected void onActivityResult(int rq, int rs, Intent d) {
        if (rq == 7 && cb != null) { cb.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(rs, d)); cb = null; }
    }

    @Override public void onBackPressed() { if (w.canGoBack()) w.goBack(); else super.onBackPressed(); }
}
