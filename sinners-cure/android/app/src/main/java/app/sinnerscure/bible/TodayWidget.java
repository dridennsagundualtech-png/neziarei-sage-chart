package app.sinnerscure.bible;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;
import org.json.JSONObject;

/**
 * Home-screen widget: today's celebration, verse and Rosary mysteries.
 * The app writes the next months of days into "widget.days" (Capacitor Preferences),
 * so the widget keeps working offline even when the app isn't opened.
 */
public class TodayWidget extends AppWidgetProvider {
    private static final String PREFS = "CapacitorStorage";
    private static final String KEY = "widget.days";
    private static final String ACTION_REFRESH = "app.sinnerscure.bible.WIDGET_REFRESH";

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) mgr.updateAppWidget(id, build(ctx));
        scheduleNextDay(ctx);
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        super.onReceive(ctx, intent);
        String action = intent.getAction();
        if (ACTION_REFRESH.equals(action)
            || Intent.ACTION_TIME_CHANGED.equals(action)
            || Intent.ACTION_TIMEZONE_CHANGED.equals(action)) {
            refreshAll(ctx);
        }
    }

    @Override
    public void onDisabled(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(refreshIntent(ctx));
    }

    public static void refreshAll(Context ctx) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
        int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, TodayWidget.class));
        if (ids == null || ids.length == 0) return;
        for (int id : ids) mgr.updateAppWidget(id, build(ctx));
        scheduleNextDay(ctx);
    }

    private static PendingIntent refreshIntent(Context ctx) {
        Intent i = new Intent(ctx, TodayWidget.class).setAction(ACTION_REFRESH);
        return PendingIntent.getBroadcast(ctx, 0, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    /** Redraw just after midnight so the widget turns to the new day. */
    private static void scheduleNextDay(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Calendar c = Calendar.getInstance();
        c.add(Calendar.DAY_OF_YEAR, 1);
        c.set(Calendar.HOUR_OF_DAY, 0);
        c.set(Calendar.MINUTE, 1);
        c.set(Calendar.SECOND, 0);
        am.set(AlarmManager.RTC, c.getTimeInMillis(), refreshIntent(ctx));
    }

    private static JSONObject today(Context ctx) {
        try {
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            String raw = prefs.getString(KEY, null);
            if (raw == null) return null;
            String key = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Calendar.getInstance().getTime());
            return new JSONObject(raw).optJSONObject(key);
        } catch (Exception e) {
            return null;
        }
    }

    private static int colorFor(Context ctx, String lit) {
        int res;
        switch (lit == null ? "" : lit) {
            case "violet": res = R.color.lit_violet; break;
            case "white": res = R.color.lit_white; break;
            case "red": res = R.color.lit_red; break;
            case "rose": res = R.color.lit_rose; break;
            default: res = R.color.lit_green;
        }
        return ctx.getColor(res);
    }

    private static final String[] WEEKDAY_MYSTERIES = {
        "Glorious Mysteries", "Joyful Mysteries", "Sorrowful Mysteries", "Glorious Mysteries",
        "Luminous Mysteries", "Sorrowful Mysteries", "Joyful Mysteries"
    };

    static RemoteViews build(Context ctx) {
        RemoteViews v = new RemoteViews(ctx.getPackageName(), R.layout.widget_today);
        Calendar now = Calendar.getInstance();
        String date = new SimpleDateFormat("EEEE, d MMMM", Locale.getDefault()).format(now.getTime());
        JSONObject day = today(ctx);

        String title = day != null ? day.optString("title") : "Sinner's Cure";
        String meta = day != null ? day.optString("meta") : date;
        String verse = day != null ? day.optString("verse") : "Come to me, all you that labour, and are burdened, and I will refresh you.";
        String ref = day != null ? day.optString("ref") : "Matthew 11:28";
        String mysteries = day != null ? day.optString("mysteries") : WEEKDAY_MYSTERIES[now.get(Calendar.DAY_OF_WEEK) - 1];
        String color = day != null ? day.optString("color") : "green";
        // Written by the app in its language (English or Tagalog).
        String rosaryLabel = day != null ? day.optString("rosaryLabel", "Rosary") : "Rosary";
        String dateLabel = day != null ? day.optString("date", date) : date;

        v.setTextViewText(R.id.w_date, dateLabel);
        v.setTextViewText(R.id.w_title, title);
        v.setTextViewText(R.id.w_meta, meta);
        v.setTextViewText(R.id.w_verse, "“" + verse + "”");
        v.setTextViewText(R.id.w_ref, ref);
        v.setTextViewText(R.id.w_rosary, rosaryLabel + " · " + mysteries);
        v.setInt(R.id.w_ribbon, "setBackgroundColor", colorFor(ctx, color));

        Intent open = new Intent(Intent.ACTION_VIEW, Uri.parse("app.sinnerscure.bible://today"), ctx, MainActivity.class);
        v.setOnClickPendingIntent(R.id.w_root, PendingIntent.getActivity(ctx, 10, open,
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
        Intent rosary = new Intent(Intent.ACTION_VIEW, Uri.parse("app.sinnerscure.bible://rosary"), ctx, MainActivity.class);
        v.setOnClickPendingIntent(R.id.w_rosary, PendingIntent.getActivity(ctx, 11, rosary,
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
        return v;
    }
}
