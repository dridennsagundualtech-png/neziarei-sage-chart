package app.sinnerscure.bible;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Lets the app redraw the home-screen widget after it saves new days. */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {
    @PluginMethod
    public void refresh(PluginCall call) {
        TodayWidget.refreshAll(getContext());
        call.resolve();
    }
}
