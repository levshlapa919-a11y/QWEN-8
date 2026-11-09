package app.golda.mesenger;

import android.app.*;
import android.content.*;
import android.os.*;
import org.json.*;
import java.io.*;
import java.net.*;

public class Notif extends Service {
    static final String CH_MSG = "msgs", CH_SVC = "svc";
    volatile boolean run;
    Thread th;

    @Override public IBinder onBind(Intent i) { return null; }

    @Override public int onStartCommand(Intent i, int f, int id) {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26) {
            nm.createNotificationChannel(new NotificationChannel(CH_MSG, "Сообщения", NotificationManager.IMPORTANCE_HIGH));
            nm.createNotificationChannel(new NotificationChannel(CH_SVC, "Фоновая работа", NotificationManager.IMPORTANCE_MIN));
        }
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CH_SVC) : new Notification.Builder(this);
        b.setSmallIcon(android.R.drawable.stat_notify_chat).setContentTitle("Golda").setContentText("Получение сообщений").setOngoing(true);
        if (Build.VERSION.SDK_INT >= 29) startForeground(1, b.build(), android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
        else startForeground(1, b.build());
        if (!run) {
            run = true;
            th = new Thread(this::loop, "golda-poll"); th.start();
        }
        return START_STICKY;
    }

    @Override public void onDestroy() { run = false; if (th != null) th.interrupt(); super.onDestroy(); }

    void loop() {
        SharedPreferences p = getSharedPreferences("golda", MODE_PRIVATE);
        while (run) {
            try {
                String tok = p.getString("tok", ""), base = p.getString("base", ""), key = p.getString("key", "");
                if (tok.isEmpty() || base.isEmpty()) { stopSelf(); return; }
                if (!Main.fg) poll(p, base, key, tok);
            } catch (Throwable e) { }
            try { Thread.sleep(Main.fg ? 5000 : 15000); } catch (InterruptedException e) { return; }
        }
    }

    void poll(SharedPreferences p, String base, String key, String tok) throws Exception {
        String last = p.getString("last", "");
        if (last.isEmpty()) { last = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US) {{ setTimeZone(java.util.TimeZone.getTimeZone("UTC")); }}.format(new java.util.Date()); p.edit().putString("last", last).apply(); }
        HttpURLConnection c = (HttpURLConnection) new URL(base + "/rest/v1/rpc/notif_poll").openConnection();
        c.setConnectTimeout(10000); c.setReadTimeout(15000); c.setRequestMethod("POST"); c.setDoOutput(true);
        c.setRequestProperty("apikey", key); c.setRequestProperty("Content-Type", "application/json");
        JSONObject body = new JSONObject().put("p_token", tok).put("p_after", last);
        try (OutputStream o = c.getOutputStream()) { o.write(body.toString().getBytes("UTF-8")); }
        if (c.getResponseCode() != 200) { c.disconnect(); return; }
        StringBuilder sb = new StringBuilder();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(c.getInputStream(), "UTF-8"))) { String l; while ((l = r.readLine()) != null) sb.append(l); }
        c.disconnect();
        JSONArray a = new JSONArray(sb.toString());
        String muted = "," + p.getString("muted", "") + ",";
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        for (int i = 0; i < a.length(); i++) {
            JSONObject m = a.getJSONObject(i);
            last = m.getString("created_at");
            String cid = m.getString("chat_id");
            if (muted.contains("," + cid + ",")) continue;
            String txt = m.optString("content", "").replaceAll("\\[\\[[^\\]]*\\]\\]", "Вложение").trim();
            if (txt.isEmpty()) txt = "Вложение";
            boolean g = m.optBoolean("is_group");
            String title = g ? m.optString("chat_name", "Группа") : m.optString("sender", "Сообщение");
            String text = g ? m.optString("sender", "") + ": " + txt : txt;
            Intent open = new Intent(this, Main.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pi = PendingIntent.getActivity(this, cid.hashCode(), open, PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0));
            Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CH_MSG) : new Notification.Builder(this);
            b.setSmallIcon(android.R.drawable.stat_notify_chat).setContentTitle(title).setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text)).setContentIntent(pi).setAutoCancel(true)
                .setWhen(System.currentTimeMillis()).setGroup("golda");
            nm.notify(2 + Math.abs(cid.hashCode() % 100000), b.build());
        }
        if (a.length() > 0) p.edit().putString("last", last).apply();
    }
}
