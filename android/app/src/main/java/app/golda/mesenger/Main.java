package app.golda.mesenger;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.*;

public class Main extends Activity {
    static final String URL = "https://levshlapa919-a11y.github.io/QWEN-8/";
    WebView w;
    ValueCallback<Uri[]> cb;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        if (Build.VERSION.SDK_INT >= 23) requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO, Manifest.permission.CAMERA}, 1);
        w = new WebView(this);
        setContentView(w);
        WebSettings s = w.getSettings();
        s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false); s.setDatabaseEnabled(true);
        CookieManager.getInstance().setAcceptCookie(true);
        w.setBackgroundColor(0xFF050B07);
        w.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (u.getHost() != null && (u.getHost().endsWith("github.io") || u.getHost().endsWith("supabase.co"))) return false;
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
        w.loadUrl(URL);
    }

    @Override protected void onActivityResult(int rq, int rs, Intent d) {
        if (rq == 7 && cb != null) { cb.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(rs, d)); cb = null; }
    }

    @Override public void onBackPressed() { if (w.canGoBack()) w.goBack(); else super.onBackPressed(); }
}
