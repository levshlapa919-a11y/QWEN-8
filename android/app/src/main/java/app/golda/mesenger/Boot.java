package app.golda.mesenger;

import android.content.*;
import android.os.Build;

public class Boot extends BroadcastReceiver {
    @Override public void onReceive(Context c, Intent i) {
        if (!c.getSharedPreferences("golda", Context.MODE_PRIVATE).getString("tok", "").isEmpty()) {
            try {
                Intent s = new Intent(c, Notif.class);
                if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(s); else c.startService(s);
            } catch (Throwable e) { }
        }
    }
}
